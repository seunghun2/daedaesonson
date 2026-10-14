'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { Box, Text, Group, ActionIcon, Center, Loader } from '@mantine/core';
import { ChevronLeft, Search, X, Clock, MapPin, Building } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Facility, FACILITY_CATEGORY_LABELS } from '@/types';
import { searchRegions, ensureRegionDataLoaded, RegionResult } from '@/lib/regionSearch';
import { useDebouncedCallback } from 'use-debounce';
import { getFacilityImageUrl } from '@/lib/supabaseImage';
import React from 'react';

const BRAND_COLOR = '#191F28';

const RECOMMENDED_KEYWORDS = [
    '용인 봉안당',
    '분당 수목장',
    '서울 근교 공원묘지',
    '일산 납골당',
    '공설 봉안당',
];

const CATEGORY_BADGE_PALETTE: Record<string, { bg: string; text: string }> = {
    CHARNEL_HOUSE: { bg: '#F2F4F6', text: '#4E5968' },
    NATURAL_BURIAL: { bg: '#F2F4F6', text: '#4E5968' },
    FAMILY_GRAVE: { bg: '#F2F4F6', text: '#4E5968' },
    CREMATORIUM: { bg: '#F2F4F6', text: '#4E5968' },
    FUNERAL_HOME: { bg: '#F2F4F6', text: '#4E5968' },
    OTHER: { bg: '#F2F4F6', text: '#4E5968' },
};

function formatFacilityPrice(fac: any): { text: string; hasPrice: boolean } {
    const raw = fac.representativePrice || fac.minPrice || fac.priceRange?.min || 0;
    if (!raw || raw <= 0) return { text: '가격문의', hasPrice: false };
    const manwon = raw >= 10000 ? Math.floor(raw / 10000) : raw;
    return { text: `${manwon.toLocaleString()}만원~`, hasPrice: true };
}

function highlightKeyword(text: string, keyword: string): React.ReactNode {
    if (!keyword.trim()) return text;
    const escapedKeyword = keyword.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedKeyword})`, 'gi');
    const parts = text.split(regex);
    if (parts.length === 1) return text;
    const lowerKeyword = keyword.trim().toLowerCase();
    return parts.map((part, i) =>
        part.toLowerCase() === lowerKeyword ? (
            <span key={i} style={{ color: BRAND_COLOR, fontWeight: 700 }}>{part}</span>
        ) : (
            <React.Fragment key={i}>{part}</React.Fragment>
        )
    );
}

function SearchPageContent() {
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);
    const [query, setQuery] = useState('');
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [recentFacilities, setRecentFacilities] = useState<any[]>([]);

    // 검색 결과
    const [regionResults, setRegionResults] = useState<RegionResult[]>([]);
    const [facilityResults, setFacilityResults] = useState<Facility[]>([]);
    const [allFacilities, setAllFacilities] = useState<Facility[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // 데이터 로드
    useEffect(() => {
        // 최근 검색어
        try {
            const saved = localStorage.getItem('recentSearches');
            if (saved) setRecentSearches(JSON.parse(saved));
        } catch { }

        // 최근 본 시설
        try {
            const saved = localStorage.getItem('facilityHistory');
            if (saved) setRecentFacilities(JSON.parse(saved).slice(0, 5));
        } catch { }

        // 시설 데이터 (캐시 우선, 스토리지 접근 차단 안전 방어)
        try {
            const cached = typeof window !== 'undefined' ? sessionStorage.getItem('facilitiesCache') : null;
            if (cached) {
                setAllFacilities(JSON.parse(cached));
            } else {
                fetch('/api/facilities').then(r => r.json()).then(data => {
                    setAllFacilities(data);
                    try { sessionStorage.setItem('facilitiesCache', JSON.stringify(data)); } catch { }
                }).catch(() => { });
            }
        } catch {
            fetch('/api/facilities').then(r => r.json()).then(data => {
                setAllFacilities(data);
            }).catch(() => { });
        }

        // 지역 데이터 미리 로드
        ensureRegionDataLoaded();

        // 자동 포커스
        setTimeout(() => inputRef.current?.focus(), 100);
    }, []);

    // 검색 (debounced)
    const handleSearch = useDebouncedCallback(async (keyword: string) => {
        if (!keyword.trim()) {
            setRegionResults([]);
            setFacilityResults([]);
            return;
        }

        setIsLoading(true);

        try {
            // 지역 검색
            const regions = await searchRegions(keyword);
            setRegionResults(regions);

            // 시설 검색 (단일어 및 추천 복합 키워드 모두 지원)
            const searchKey = keyword.trim().toLowerCase().normalize('NFC');
            const tokens = searchKey.split(/\s+/).filter(Boolean);
            const facilities = allFacilities
                .filter(f => f.isActive !== false)
                .filter(f => {
                    const name = (f.name || '').toLowerCase().normalize('NFC');
                    const addr = (f.address || '').toLowerCase().normalize('NFC');
                    if (name.includes(searchKey) || addr.includes(searchKey)) return true;
                    if (tokens.length > 1) {
                        const catLabel = (FACILITY_CATEGORY_LABELS[f.category] || '').toLowerCase();
                        const catAlias = f.category === 'CHARNEL_HOUSE' ? '납골당 봉안당' : f.category === 'NATURAL_BURIAL' ? '수목장 자연장' : f.category === 'FAMILY_GRAVE' ? '공원묘지 매장묘' : '';
                        const pubLabel = f.isPublic ? '공설 시립 구립 군립' : '사설';
                        const nearSeoul = searchKey.includes('서울 근교') && (addr.includes('경기') || addr.includes('서울') || addr.includes('인천'));
                        const searchable = `${name} ${addr} ${catLabel} ${catAlias} ${pubLabel} ${nearSeoul ? '서울 근교' : ''}`;
                        return tokens.every(t => searchable.includes(t));
                    }
                    return false;
                })
                .slice(0, 10);
            setFacilityResults(facilities);
        } catch (error) {
            console.error('검색 중 오류:', error);
        } finally {
            setIsLoading(false);
        }
    }, 200);

    const handleInputChange = (value: string) => {
        setQuery(value);
        handleSearch(value);
    };

    const saveRecentSearch = (keyword: string) => {
        if (!keyword.trim()) return;
        const updated = [keyword, ...recentSearches.filter(s => s !== keyword)].slice(0, 10);
        setRecentSearches(updated);
        try { localStorage.setItem('recentSearches', JSON.stringify(updated)); } catch { }
    };

    const clearRecentSearches = () => {
        setRecentSearches([]);
        try { localStorage.removeItem('recentSearches'); } catch { }
    };

    const removeRecentSearch = (keyword: string) => {
        const updated = recentSearches.filter(s => s !== keyword);
        setRecentSearches(updated);
        try { localStorage.setItem('recentSearches', JSON.stringify(updated)); } catch { }
    };

    // 시설 선택 → /facility/[id]로 이동 (호갱노노 스타일)
    const handleSelectFacility = (facility: Facility) => {
        saveRecentSearch(facility.name);
        router.push(`/facility/${facility.id}`);
    };

    // 지역 선택 → 메인 페이지로 이동 (region 파라미터)
    const handleSelectRegion = (region: RegionResult) => {
        saveRecentSearch(region.fullName);
        router.push(`/?region=${encodeURIComponent(region.fullName)}&lat=${region.center.lat}&lng=${region.center.lng}&type=${region.type}&name=${encodeURIComponent(region.name)}`);
    };

    // 최근/추천 검색어 클릭
    const handleRecentSearchClick = (keyword: string) => {
        setQuery(keyword);
        handleSearch(keyword);
        saveRecentSearch(keyword);
    };

    // 최근 본 시설 클릭
    const handleRecentFacilityClick = (fac: any) => {
        router.push(`/facility/${fac.id}`);
    };

    const hasResults = regionResults.length > 0 || facilityResults.length > 0;
    const showEmpty = query.trim() && !isLoading && !hasResults;

    return (
        <Box
            h="100dvh"
            bg="white"
            style={{
                display: 'flex',
                flexDirection: 'column',
                animation: 'fadeIn 0.2s ease-out',
            }}
        >
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>

            {/* 검색 헤더 */}
            <Box
                style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #F2F4F6',
                    flexShrink: 0,
                }}
            >
                <Group wrap="nowrap" gap={8} align="center">
                    <ActionIcon
                        variant="subtle"
                        color="gray"
                        size={38}
                        radius="md"
                        onClick={() => {
                            if (typeof window !== 'undefined' && window.history.length <= 1) {
                                router.push('/');
                            } else {
                                router.back();
                            }
                        }}
                        aria-label="뒤로가기"
                        style={{ color: '#191F28', flexShrink: 0 }}
                    >
                        <ChevronLeft size={22} color="#191F28" strokeWidth={2} />
                    </ActionIcon>

                    <Box
                        style={{
                            flex: 1,
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            backgroundColor: '#F2F4F6',
                            borderRadius: '12px',
                            border: 'none',
                            padding: '0 14px',
                            height: '44px',
                        }}
                    >
                        <Search size={18} color="#8B95A1" style={{ flexShrink: 0 }} />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => handleInputChange(e.target.value)}
                            placeholder="시설명, 지역을 검색하세요"
                            style={{
                                flex: 1,
                                border: 'none',
                                outline: 'none',
                                background: 'transparent',
                                fontSize: '15px',
                                fontWeight: 500,
                                padding: '0 10px',
                                color: '#191F28',
                            }}
                            autoFocus
                        />
                        {query && (
                            <ActionIcon
                                variant="transparent"
                                size="sm"
                                onClick={() => { setQuery(''); setRegionResults([]); setFacilityResults([]); inputRef.current?.focus(); }}
                                style={{ color: '#8B95A1', flexShrink: 0 }}
                                aria-label="검색어 지우기"
                            >
                                <X size={16} />
                            </ActionIcon>
                        )}
                    </Box>
                </Group>
            </Box>

            {/* 검색 결과 or 최근 검색 */}
            <Box style={{ flex: 1, overflowY: 'auto' }}>

                {/* 검색 로딩 */}
                {isLoading && (
                    <Center py="xl">
                        <Loader size="sm" color="blue" />
                    </Center>
                )}

                {/* 검색 결과 */}
                {!isLoading && hasResults && (
                    <Box>
                        {/* 지역 결과 (최대 4개) */}
                        {regionResults.length > 0 && (
                            <Box pt={12}>
                                <Box px="md" pb={6}>
                                    <Text size="xs" c="#8B95A1" fw={700} style={{ letterSpacing: '-0.2px' }}>지역</Text>
                                </Box>
                                {regionResults.slice(0, 4).map((region, i) => (
                                    <Box
                                        key={`reg-${i}`}
                                        px="md"
                                        py={13}
                                        onClick={() => handleSelectRegion(region)}
                                        style={{
                                            cursor: 'pointer',
                                            borderBottom: '1px solid #F2F4F6',
                                            transition: 'background-color 0.15s',
                                        }}
                                    >
                                        <Group gap={10} wrap="nowrap">
                                            <Box
                                                style={{
                                                    width: 32,
                                                    height: 32,
                                                    borderRadius: 8,
                                                    backgroundColor: '#F2F4F6',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0,
                                                }}
                                            >
                                                <MapPin size={15} color="#6B7684" />
                                            </Box>
                                            <Text size="sm" c="#191F28" fw={600} truncate>
                                                {highlightKeyword(region.fullName, query)}
                                            </Text>
                                        </Group>
                                    </Box>
                                ))}
                            </Box>
                        )}

                        {/* 시설 결과 */}
                        {facilityResults.length > 0 && (
                            <Box pt={16}>
                                <Box px="md" pb={6}>
                                    <Text size="xs" c="#8B95A1" fw={700} style={{ letterSpacing: '-0.2px' }}>시설</Text>
                                </Box>
                                {facilityResults.map((fac, i) => {
                                    const rawImg = fac.thumbnail || fac.imageUrl || (Array.isArray(fac.images) ? fac.images[0] : fac.images) || fac.imageGallery?.[0];
                                    const thumbUrl = getFacilityImageUrl(rawImg);
                                    const catPalette = CATEGORY_BADGE_PALETTE[fac.category] || CATEGORY_BADGE_PALETTE.OTHER;
                                    const priceInfo = formatFacilityPrice(fac);

                                    return (
                                        <Box
                                            key={`fac-${fac.id}-${i}`}
                                            px="md"
                                            py={12}
                                            onClick={() => handleSelectFacility(fac)}
                                            style={{
                                                cursor: 'pointer',
                                                borderBottom: '1px solid #F2F4F6',
                                                transition: 'background-color 0.15s',
                                            }}
                                        >
                                            <Group gap={12} wrap="nowrap" justify="space-between">
                                                {/* 좌측 48x48 라운드 썸네일 */}
                                                <Box
                                                    style={{
                                                        width: 48,
                                                        height: 48,
                                                        borderRadius: 10,
                                                        overflow: 'hidden',
                                                        backgroundColor: '#F2F4F6',
                                                        border: '1px solid rgba(15, 23, 42, 0.06)',
                                                        flexShrink: 0,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                    }}
                                                >
                                                    {thumbUrl ? (
                                                        <Image
                                                            src={thumbUrl}
                                                            alt={fac.name}
                                                            width={48}
                                                            height={48}
                                                            style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                                                        />
                                                    ) : (
                                                        <Building size={20} color="#8B95A1" />
                                                    )}
                                                </Box>

                                                {/* 중앙: 카테고리 배지 + 시설명 + 주소 */}
                                                <Box style={{ flex: 1, minWidth: 0 }}>
                                                    <Group gap={6} wrap="nowrap" mb={2}>
                                                        <span
                                                            style={{
                                                                display: 'inline-block',
                                                                backgroundColor: catPalette.bg,
                                                                color: catPalette.text,
                                                                fontSize: '10.5px',
                                                                fontWeight: 700,
                                                                padding: '1.5px 6px',
                                                                borderRadius: '4px',
                                                                lineHeight: 1.3,
                                                                flexShrink: 0,
                                                            }}
                                                        >
                                                            {FACILITY_CATEGORY_LABELS[fac.category] || fac.category}
                                                        </span>
                                                        <Text size="sm" c="#191F28" fw={600} truncate>
                                                            {highlightKeyword(fac.name, query)}
                                                        </Text>
                                                    </Group>
                                                    <Text size="xs" c="#8B95A1" truncate>
                                                        {fac.address}
                                                    </Text>
                                                </Box>

                                                {/* 우측 대표 가격 */}
                                                <Text
                                                    size="sm"
                                                    fw={700}
                                                    style={{
                                                        color: priceInfo.hasPrice ? '#191F28' : '#8B95A1',
                                                        flexShrink: 0,
                                                        whiteSpace: 'nowrap',
                                                        letterSpacing: '-0.3px',
                                                    }}
                                                >
                                                    {priceInfo.text}
                                                </Text>
                                            </Group>
                                        </Box>
                                    );
                                })}
                            </Box>
                        )}
                    </Box>
                )}

                {/* 검색 결과 없음 */}
                {showEmpty && (
                    <Center py="xl" px="md">
                        <Box ta="center">
                            <Text size="sm" c="#6B7684" fw={500}>
                                &apos;{query}&apos;에 대한 검색 결과가 없습니다.
                            </Text>
                            <Text size="xs" c="#8B95A1" mt={4}>
                                시설명, 지역명으로 검색해보세요
                            </Text>
                        </Box>
                    </Center>
                )}

                {/* 기본 화면: 추천 검색어 + 최근 검색 + 최근 본 시설 */}
                {!query.trim() && !isLoading && (
                    <Box>
                        {/* 추천 검색어 칩 */}
                        <Box px="md" pt={16} pb={12}>
                            <Text size="xs" c="#8B95A1" fw={700} mb={10} style={{ letterSpacing: '-0.2px' }}>
                                추천 검색어
                            </Text>
                            <Group gap={8} style={{ flexWrap: 'wrap' }}>
                                {RECOMMENDED_KEYWORDS.map((kw) => (
                                    <button
                                        key={kw}
                                        type="button"
                                        onClick={() => handleRecentSearchClick(kw)}
                                        style={{
                                            padding: '7px 13px',
                                            borderRadius: '999px',
                                            backgroundColor: '#F2F4F6',
                                            border: 'none',
                                            color: '#333D4B',
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            transition: 'background-color 0.15s',
                                            letterSpacing: '-0.2px',
                                        }}
                                    >
                                        {kw}
                                    </button>
                                ))}
                            </Group>
                        </Box>

                        {/* 최근 검색어 */}
                        {recentSearches.length > 0 && (
                            <Box mt={4}>
                                <Box px="md" py={10}>
                                    <Group justify="space-between" align="center">
                                        <Text size="xs" c="#8B95A1" fw={700} style={{ letterSpacing: '-0.2px' }}>최근 검색</Text>
                                        <Text
                                            size="xs"
                                            c="#8B95A1"
                                            onClick={clearRecentSearches}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            전체 삭제
                                        </Text>
                                    </Group>
                                </Box>
                                {recentSearches.map((keyword, i) => (
                                    <Box
                                        key={`recent-${i}`}
                                        px="md"
                                        py={11}
                                        style={{
                                            cursor: 'pointer',
                                            borderBottom: '1px solid #F2F4F6',
                                        }}
                                    >
                                        <Group justify="space-between" wrap="nowrap">
                                            <Group
                                                gap={10}
                                                wrap="nowrap"
                                                style={{ flex: 1, minWidth: 0 }}
                                                onClick={() => handleRecentSearchClick(keyword)}
                                            >
                                                <Clock size={14} color="#8B95A1" style={{ flexShrink: 0 }} />
                                                <Text size="sm" c="#191F28" fw={500} truncate>{keyword}</Text>
                                            </Group>
                                            <ActionIcon
                                                variant="subtle"
                                                color="gray"
                                                size={36}
                                                radius="md"
                                                aria-label="검색어 삭제"
                                                onClick={(e) => { e.stopPropagation(); removeRecentSearch(keyword); }}
                                                style={{ color: '#8B95A1', flexShrink: 0 }}
                                            >
                                                <X size={16} />
                                            </ActionIcon>
                                        </Group>
                                    </Box>
                                ))}
                            </Box>
                        )}

                        {/* 최근 본 시설 */}
                        {recentFacilities.length > 0 && (
                            <Box mt="sm">
                                <Box px="md" py={10}>
                                    <Text size="xs" c="#8B95A1" fw={700} style={{ letterSpacing: '-0.2px' }}>최근 본 시설</Text>
                                </Box>
                                {recentFacilities.map((fac: any, i: number) => {
                                    const thumbUrl = getFacilityImageUrl(fac.thumbnail);
                                    const catPalette = CATEGORY_BADGE_PALETTE[fac.category] || CATEGORY_BADGE_PALETTE.OTHER;
                                    const priceInfo = formatFacilityPrice(fac);

                                    return (
                                        <Box
                                            key={`hist-${fac.id}-${i}`}
                                            px="md"
                                            py={12}
                                            onClick={() => handleRecentFacilityClick(fac)}
                                            style={{
                                                cursor: 'pointer',
                                                borderBottom: '1px solid #F2F4F6',
                                            }}
                                        >
                                            <Group gap={12} wrap="nowrap" justify="space-between">
                                                <Box
                                                    style={{
                                                        width: 48,
                                                        height: 48,
                                                        borderRadius: 10,
                                                        overflow: 'hidden',
                                                        backgroundColor: '#F2F4F6',
                                                        border: '1px solid rgba(15, 23, 42, 0.06)',
                                                        flexShrink: 0,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                    }}
                                                >
                                                    {thumbUrl ? (
                                                        <Image
                                                            src={thumbUrl}
                                                            alt={fac.name}
                                                            width={48}
                                                            height={48}
                                                            style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                                                        />
                                                    ) : (
                                                        <Building size={20} color="#8B95A1" />
                                                    )}
                                                </Box>
                                                <Box style={{ flex: 1, minWidth: 0 }}>
                                                    <Group gap={6} wrap="nowrap" mb={2}>
                                                        {fac.category && (
                                                            <span
                                                                style={{
                                                                    display: 'inline-block',
                                                                    backgroundColor: catPalette.bg,
                                                                    color: catPalette.text,
                                                                    fontSize: '10.5px',
                                                                    fontWeight: 700,
                                                                    padding: '1.5px 6px',
                                                                    borderRadius: '4px',
                                                                    lineHeight: 1.3,
                                                                    flexShrink: 0,
                                                                }}
                                                            >
                                                                {(FACILITY_CATEGORY_LABELS as Record<string, string>)[fac.category] || fac.category}
                                                            </span>
                                                        )}
                                                        <Text size="sm" c="#191F28" fw={600} truncate>
                                                            {fac.name}
                                                        </Text>
                                                    </Group>
                                                    <Text size="xs" c="#8B95A1" truncate>
                                                        {fac.address}
                                                    </Text>
                                                </Box>
                                                <Text
                                                    size="sm"
                                                    fw={700}
                                                    style={{
                                                        color: priceInfo.hasPrice ? '#191F28' : '#8B95A1',
                                                        flexShrink: 0,
                                                        whiteSpace: 'nowrap',
                                                        letterSpacing: '-0.3px',
                                                    }}
                                                >
                                                    {priceInfo.text}
                                                </Text>
                                            </Group>
                                        </Box>
                                    );
                                })}
                            </Box>
                        )}

                        {/* 아무것도 없을 때 */}
                        {recentSearches.length === 0 && recentFacilities.length === 0 && (
                            <Center py="xl" px="md">
                                <Box ta="center">
                                    <Search size={32} color="#D1D6DB" style={{ marginBottom: 12 }} />
                                    <Text size="sm" c="#6B7684" fw={500}>
                                        시설명, 지역명으로 검색하세요
                                    </Text>
                                    <Text size="xs" c="#8B95A1" mt={4}>
                                        위의 추천 검색어를 눌러 바로 찾아볼 수 있습니다
                                    </Text>
                                </Box>
                            </Center>
                        )}
                    </Box>
                )}
            </Box>
        </Box>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<Center h="100dvh"><Loader size="lg" /></Center>}>
            <SearchPageContent />
        </Suspense>
    );
}
