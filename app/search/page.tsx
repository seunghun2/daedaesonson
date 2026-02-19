'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { Box, Text, Group, ActionIcon, Center, Loader } from '@mantine/core';
import { ChevronLeft, Search, X, Clock, MapPin, Building } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Facility, FACILITY_CATEGORY_LABELS } from '@/types';
import { searchRegions, ensureRegionDataLoaded, RegionResult } from '@/lib/regionSearch';
import { useDebouncedCallback } from 'use-debounce';
import React from 'react';

const BRAND_COLOR = '#1D0098';

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

        // 시설 데이터 (캐시 우선)
        const cached = sessionStorage.getItem('facilitiesCache');
        if (cached) {
            try { setAllFacilities(JSON.parse(cached)); } catch { }
        } else {
            fetch('/api/facilities').then(r => r.json()).then(data => {
                setAllFacilities(data);
                try { sessionStorage.setItem('facilitiesCache', JSON.stringify(data)); } catch { }
            });
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

        // 지역 검색
        const regions = await searchRegions(keyword);
        setRegionResults(regions);

        // 시설 검색
        const searchKey = keyword.trim().toLowerCase().normalize('NFC');
        const facilities = allFacilities
            .filter(f => f.isActive !== false)
            .filter(f => {
                const name = (f.name || '').toLowerCase().normalize('NFC');
                const addr = (f.address || '').toLowerCase().normalize('NFC');
                return name.includes(searchKey) || addr.includes(searchKey);
            })
            .slice(0, 10);
        setFacilityResults(facilities);

        setIsLoading(false);
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

    // 최근 검색어 클릭
    const handleRecentSearchClick = (keyword: string) => {
        setQuery(keyword);
        handleSearch(keyword);
        saveRecentSearch(keyword);
    };

    // 최근 본 시설 클릭
    const handleRecentFacilityClick = (fac: any) => {
        router.push(`/?id=${fac.id}`);
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
                    borderBottom: '1px solid #e9ecef',
                    flexShrink: 0,
                }}
            >
                <Group wrap="nowrap" gap={8} align="center">
                    <ActionIcon
                        variant="transparent"
                        onClick={() => router.back()}
                        style={{ color: '#495057', flexShrink: 0 }}
                    >
                        <ChevronLeft size={26} strokeWidth={2} />
                    </ActionIcon>

                    <Box
                        style={{
                            flex: 1,
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '10px',
                            border: '1.5px solid #e9ecef',
                            padding: '0 12px',
                            height: '44px',
                            transition: 'border-color 0.2s',
                        }}
                    >
                        <Search size={18} color="#adb5bd" style={{ flexShrink: 0 }} />
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
                                fontSize: '16px',
                                padding: '0 8px',
                                color: '#212529',
                            }}
                            autoFocus
                        />
                        {query && (
                            <ActionIcon
                                variant="transparent"
                                size="sm"
                                onClick={() => { setQuery(''); setRegionResults([]); setFacilityResults([]); inputRef.current?.focus(); }}
                                style={{ color: '#adb5bd', flexShrink: 0 }}
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
                        <Loader size="sm" color="gray" />
                    </Center>
                )}

                {/* 검색 결과 */}
                {!isLoading && hasResults && (
                    <Box>
                        {/* 지역 결과 (최대 4개) */}
                        {regionResults.length > 0 && (
                            <Box>
                                <Box px="md" py={8} bg="#f8f9fa">
                                    <Text size="xs" c="dimmed" fw={600}>지역</Text>
                                </Box>
                                {regionResults.slice(0, 4).map((region, i) => (
                                    <Box
                                        key={`reg-${i}`}
                                        px="md"
                                        py={14}
                                        onClick={() => handleSelectRegion(region)}
                                        style={{
                                            cursor: 'pointer',
                                            borderBottom: '1px solid #f8f9fa',
                                            transition: 'background-color 0.15s',
                                        }}
                                    >
                                        <Text size="md" c="dark.9" fw={500} truncate>
                                            {highlightKeyword(region.fullName, query)}
                                        </Text>
                                    </Box>
                                ))}
                            </Box>
                        )}

                        {/* 시설 결과 */}
                        {facilityResults.length > 0 && (
                            <Box>
                                <Box px="md" py={8} bg="#f8f9fa">
                                    <Text size="xs" c="dimmed" fw={600}>시설</Text>
                                </Box>
                                {facilityResults.map((fac, i) => (
                                    <Box
                                        key={`fac-${fac.id}-${i}`}
                                        px="md"
                                        py={14}
                                        onClick={() => handleSelectFacility(fac)}
                                        style={{
                                            cursor: 'pointer',
                                            borderBottom: '1px solid #f8f9fa',
                                            transition: 'background-color 0.15s',
                                        }}
                                    >
                                        <Group gap={10} wrap="nowrap" justify="space-between">
                                            <Box style={{ flex: 1, minWidth: 0 }}>
                                                <Text size="md" c="dark.9" fw={500} truncate>
                                                    {highlightKeyword(fac.name, query)}
                                                </Text>
                                                <Text size="13px" c="dimmed" truncate>
                                                    {fac.address}
                                                </Text>
                                            </Box>
                                            <Text
                                                size="12px"
                                                c="gray.6"
                                                style={{
                                                    whiteSpace: 'nowrap',
                                                    backgroundColor: '#f1f3f5',
                                                    padding: '2px 8px',
                                                    borderRadius: '4px',
                                                    flexShrink: 0,
                                                }}
                                            >
                                                {FACILITY_CATEGORY_LABELS[fac.category]}
                                            </Text>
                                        </Group>
                                    </Box>
                                ))}
                            </Box>
                        )}
                    </Box>
                )}

                {/* 검색 결과 없음 */}
                {showEmpty && (
                    <Center py="xl" px="md">
                        <Box ta="center">
                            <Text size="sm" c="dimmed">
                                &apos;{query}&apos;에 대한 검색 결과가 없습니다.
                            </Text>
                            <Text size="xs" c="dimmed" mt={4}>
                                시설명, 지역명으로 검색해보세요
                            </Text>
                        </Box>
                    </Center>
                )}

                {/* 기본 화면: 최근 검색 + 최근 본 시설 */}
                {!query.trim() && !isLoading && (
                    <Box>
                        {/* 최근 검색어 */}
                        {recentSearches.length > 0 && (
                            <Box>
                                <Box px="md" py={10}>
                                    <Group justify="space-between" align="center">
                                        <Text size="xs" c="dimmed" fw={600}>최근 검색</Text>
                                        <Text
                                            size="xs"
                                            c="dimmed"
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
                                        py={12}
                                        style={{
                                            cursor: 'pointer',
                                            borderBottom: '1px solid #f8f9fa',
                                        }}
                                    >
                                        <Group justify="space-between" wrap="nowrap">
                                            <Group
                                                gap={10}
                                                wrap="nowrap"
                                                style={{ flex: 1, minWidth: 0 }}
                                                onClick={() => handleRecentSearchClick(keyword)}
                                            >
                                                <Clock size={14} color="#adb5bd" style={{ flexShrink: 0 }} />
                                                <Text size="sm" c="dark.7" truncate>{keyword}</Text>
                                            </Group>
                                            <ActionIcon
                                                variant="transparent"
                                                size="xs"
                                                onClick={(e) => { e.stopPropagation(); removeRecentSearch(keyword); }}
                                                style={{ color: '#ced4da', flexShrink: 0 }}
                                            >
                                                <X size={14} />
                                            </ActionIcon>
                                        </Group>
                                    </Box>
                                ))}
                            </Box>
                        )}

                        {/* 최근 본 시설 */}
                        {recentFacilities.length > 0 && (
                            <Box mt={recentSearches.length > 0 ? 'md' : 0}>
                                <Box px="md" py={10}>
                                    <Text size="xs" c="dimmed" fw={600}>최근 본 시설</Text>
                                </Box>
                                {recentFacilities.map((fac: any, i: number) => (
                                    <Box
                                        key={`hist-${fac.id}-${i}`}
                                        px="md"
                                        py={12}
                                        onClick={() => handleRecentFacilityClick(fac)}
                                        style={{
                                            cursor: 'pointer',
                                            borderBottom: '1px solid #f8f9fa',
                                        }}
                                    >
                                        <Group gap={10} wrap="nowrap">
                                            <Box
                                                style={{
                                                    width: 40,
                                                    height: 40,
                                                    borderRadius: '8px',
                                                    overflow: 'hidden',
                                                    backgroundColor: '#f1f3f5',
                                                    flexShrink: 0,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                {fac.thumbnail ? (
                                                    <Image
                                                        src={fac.thumbnail}
                                                        alt={fac.name}
                                                        width={40}
                                                        height={40}
                                                        style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                                                    />
                                                ) : (
                                                    <Building size={18} color="#adb5bd" />
                                                )}
                                            </Box>
                                            <Box style={{ flex: 1, minWidth: 0 }}>
                                                <Text size="sm" c="dark.9" fw={500} truncate>
                                                    {fac.name}
                                                </Text>
                                                <Text size="11px" c="dimmed" truncate>
                                                    {fac.address}
                                                </Text>
                                            </Box>
                                            <Text size="xs" c={fac.minPrice > 0 ? "brand.6" : "dimmed"} fw={600} style={{ flexShrink: 0 }}>
                                                {fac.minPrice > 0
                                                    ? (fac.minPrice >= 10000
                                                        ? `${Math.floor(fac.minPrice / 10000)}만원~`
                                                        : `${fac.minPrice.toLocaleString()}원~`)
                                                    : '가격문의'
                                                }
                                            </Text>
                                        </Group>
                                    </Box>
                                ))}
                            </Box>
                        )}

                        {/* 아무것도 없을 때 */}
                        {recentSearches.length === 0 && recentFacilities.length === 0 && (
                            <Center py="xl" px="md">
                                <Box ta="center">
                                    <Search size={32} color="#dee2e6" style={{ marginBottom: 12 }} />
                                    <Text size="sm" c="dimmed">
                                        시설명, 지역명으로 검색하세요
                                    </Text>
                                    <Text size="xs" c="dimmed" mt={4}>
                                        예: 서울 봉안당, 경기 수목장, 부산 공원묘지
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
