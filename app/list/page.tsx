'use client';

import { useState, useMemo, useEffect, useCallback, useTransition, Suspense } from 'react';
import { Box, Group, Text, ScrollArea, Center, Loader, Button, Stack, ActionIcon } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { ChevronLeft } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

import FacilityCard from '@/components/list/FacilityCard';
import FacilityDetail from '@/components/detail/FacilityDetail';
import { Facility, FACILITY_CATEGORY_LABELS, FacilityCategory } from '@/types';

// 거리 계산 함수 (Haversine formula)
function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // 지구 반경 (km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function ListPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isMobile = useMediaQuery('(max-width: 768px)');

    // URL에서 지역명과 좌표 읽기
    const regionName = searchParams.get('region') || '전국';
    const centerLat = parseFloat(searchParams.get('lat') || '37.5');
    const centerLng = parseFloat(searchParams.get('lng') || '127');

    // 데이터
    const [allFacilities, setAllFacilities] = useState<Facility[]>([]);
    const [loading, setLoading] = useState(true);

    // 필터
    const [activeCategory, setActiveCategory] = useState<string[]>(['all']);
    const [isPending, startTransition] = useTransition();

    // 상세 페이지
    const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);

    // 무한 스크롤
    const [visibleCount, setVisibleCount] = useState(20);

    // 슬라이드 인 애니메이션
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 50);
        return () => clearTimeout(timer);
    }, []);

    // 📊 GA4: 리스트 페이지뷰
    useEffect(() => {
        if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', '리스트_페이지_조회', {
                page_title: `리스트 - ${regionName}`,
                page_location: window.location.href,
                page_path: '/list'
            });
        }
    }, [regionName]);

    // 데이터 로드 (캐시 우선)
    useEffect(() => {
        async function fetchData() {
            // 1. 캐시된 데이터가 있으면 먼저 사용
            const cached = sessionStorage.getItem('facilitiesCache');
            if (cached) {
                try {
                    const parsedCache = JSON.parse(cached);
                    setAllFacilities(parsedCache);
                    setLoading(false);
                } catch { }
            }

            // 2. 백그라운드에서 최신 데이터 fetch
            try {
                const res = await fetch('/api/facilities');
                const data = await res.json();
                setAllFacilities(data);
                sessionStorage.setItem('facilitiesCache', JSON.stringify(data));
            } catch (error) {
                console.error('Failed to fetch facilities:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    // URL에서 시설 ID 읽기
    useEffect(() => {
        const facilityId = searchParams.get('id');
        if (facilityId && allFacilities.length > 0) {
            const facility = allFacilities.find(f => f.id === facilityId);
            if (facility) {
                setSelectedFacility(facility);
            }
        } else if (!facilityId) {
            setSelectedFacility(null);
        }
    }, [searchParams, allFacilities]);

    // Step 1: 거리 계산 + 기본 필터 (좌표/지역 변경 시에만 재계산, 탭 변경 시 건너뜀)
    const baseFacilities = useMemo(() => {
        let result = allFacilities.filter(f =>
            f.isActive !== false &&
            f.category !== 'FUNERAL_HOME' &&
            f.category !== 'OTHER'
        );

        // 거리 기반 필터 + 거리 캐싱
        if (centerLat && centerLng) {
            result = result
                .map(f => {
                    if (!f.coordinates) return null;
                    const dist = getDistance(centerLat, centerLng, f.coordinates.lat, f.coordinates.lng);
                    if (dist > 30) return null;
                    return { ...f, _dist: dist };
                })
                .filter(Boolean) as (Facility & { _dist: number })[];

            // 거리순 정렬 (한 번만)
            result.sort((a: any, b: any) => (a._dist || 0) - (b._dist || 0));
        }

        return result;
    }, [allFacilities, centerLat, centerLng]);

    // Step 2: 카테고리 필터만 (탭 클릭 시 이것만 재실행 → 빠름!)
    const filteredFacilities = useMemo(() => {
        if (activeCategory.includes('all')) return baseFacilities;

        const catMap: Record<string, FacilityCategory> = {
            'charnel': 'CHARNEL_HOUSE',
            'natural': 'NATURAL_BURIAL',
            'park': 'FAMILY_GRAVE'
        };
        const selectedDbCategories = activeCategory
            .filter(c => catMap[c])
            .map(c => catMap[c]);
        if (selectedDbCategories.length === 0) return baseFacilities;

        return baseFacilities.filter(f => selectedDbCategories.includes(f.category));
    }, [baseFacilities, activeCategory]);

    const visibleFacilities = filteredFacilities.slice(0, visibleCount);

    const handleFacilityClick = (facility: Facility) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('id', facility.id);
        router.push(`/list?${params.toString()}`, { scroll: false });
        // 🔥 PC에서 상세 페이지 열릴 때 맨 위로 스크롤
        window.scrollTo({ top: 0, behavior: 'instant' });
    };

    const handleCloseDetail = () => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete('id');
        router.push(`/list?${params.toString()}`, { scroll: false });
    };

    const handleLoadMore = () => {
        setVisibleCount(prev => prev + 20);
    };

    const handleBack = () => {
        router.push('/');
    };

    return (
        <Box
            h="100dvh"
            bg="white"
            style={{
                transform: mounted ? 'translateX(0)' : 'translateX(100%)',
                transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
        >
            {/* 상단 헤더 - 흰색 배경 + 지역명 중앙정렬 */}
            <Box
                style={{
                    backgroundColor: 'white',
                    padding: '14px 16px',
                    position: 'sticky',
                    top: 0,
                    zIndex: 100,
                    borderBottom: '1px solid #e9ecef',
                }}
            >
                <Group wrap="nowrap" align="center" justify="space-between">
                    <ActionIcon
                        variant="transparent"
                        onClick={handleBack}
                        style={{ color: '#495057' }}
                    >
                        <ChevronLeft size={28} strokeWidth={2} />
                    </ActionIcon>

                    {/* 중앙: 지역명 + 주변 시설 보기 */}
                    <Text fw={600} size="md" c="dark.9" style={{ flex: 1, textAlign: 'center' }}>
                        {regionName} 주변 시설 보기
                    </Text>

                    {/* 오른쪽 여백 맞추기용 */}
                    <Box w={28} />
                </Group>
            </Box>

            {/* 필터 바 - 메인 모바일과 동일한 디자인 */}
            <Box
                style={{
                    backgroundColor: 'white',
                    padding: '8px 16px',
                    borderBottom: '1px solid #e9ecef',
                    position: 'sticky',
                    top: '57px',
                    zIndex: 99,
                }}
            >
                <Group gap={6} wrap="nowrap" align="center">
                    {/* 전체 버튼 */}
                    <button
                        onClick={() => { startTransition(() => setActiveCategory(['all'])); setVisibleCount(20); }}
                        style={{
                            height: '30px',
                            fontSize: '12px',
                            fontWeight: activeCategory.includes('all') ? 700 : 500,
                            backgroundColor: activeCategory.includes('all') ? '#1D0098' : 'white',
                            color: activeCategory.includes('all') ? 'white' : '#495057',
                            border: activeCategory.includes('all') ? 'none' : '1px solid #dee2e6',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            paddingLeft: '14px',
                            paddingRight: '14px',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        전체
                    </button>

                    {/* 구분선 */}
                    <div style={{ width: '1px', height: '20px', backgroundColor: '#dee2e6' }} />

                    {/* 개별 카테고리 버튼들 */}
                    {[
                        { value: 'charnel', label: '봉안당' },
                        { value: 'natural', label: '수목장' },
                        { value: 'park', label: '공원묘지' }
                    ].map(tab => {
                        const isSelected = activeCategory.includes(tab.value);
                        return (
                            <button
                                key={tab.value}
                                onClick={() => {
                                    setVisibleCount(20);
                                    startTransition(() => {
                                        if (activeCategory.includes('all')) {
                                            setActiveCategory([tab.value]);
                                        } else if (isSelected) {
                                            const newCats = activeCategory.filter(c => c !== tab.value);
                                            setActiveCategory(newCats.length === 0 ? ['all'] : newCats);
                                        } else {
                                            const newCats = [...activeCategory, tab.value];
                                            if (newCats.length === 3) {
                                                setActiveCategory(['all']);
                                            } else {
                                                setActiveCategory(newCats);
                                            }
                                        }
                                    });
                                }}
                                style={{
                                    height: '30px',
                                    fontSize: '12px',
                                    fontWeight: isSelected ? 700 : 500,
                                    backgroundColor: isSelected ? '#1D0098' : 'white',
                                    color: isSelected ? 'white' : '#495057',
                                    border: isSelected ? 'none' : '1px solid #dee2e6',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    paddingLeft: '14px',
                                    paddingRight: '14px',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </Group>
            </Box>

            {/* 시설 리스트 */}
            <ScrollArea h="calc(100dvh - 110px)">
                {loading ? (
                    <Center h="200px">
                        <Loader size="lg" />
                    </Center>
                ) : filteredFacilities.length === 0 ? (
                    <Center h="200px" px="md">
                        <Text c="dimmed" ta="center">
                            해당 지역에 시설이 없습니다.
                        </Text>
                    </Center>
                ) : (
                    <Stack p="md" gap="md">
                        <Text size="sm" c="dimmed" fw={500}>
                            검색 결과 {filteredFacilities.length}개
                        </Text>

                        {visibleFacilities.map((facility) => (
                            <Box
                                key={facility.id}
                                onClick={() => handleFacilityClick(facility)}
                                style={{
                                    cursor: 'pointer',
                                    borderRadius: '8px',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <FacilityCard facility={facility} onClick={() => { }} />
                            </Box>
                        ))}

                        {/* 더 보기 버튼 */}
                        {visibleCount < filteredFacilities.length && (
                            <Button
                                variant="light"
                                color="gray"
                                fullWidth
                                onClick={handleLoadMore}
                                mt="md"
                            >
                                더 보기 ({Math.min(filteredFacilities.length - visibleCount, 20)}개)
                            </Button>
                        )}

                        {/* 하단 여백 */}
                        <Box h={50} />
                    </Stack>
                )}
            </ScrollArea>

            {/* 상세 페이지 */}
            {selectedFacility && (
                <Box
                    pos="fixed"
                    top={0}
                    left={0}
                    w="100%"
                    h="100dvh"
                    bg="white"
                    style={{
                        zIndex: 1000,
                        overflowY: 'auto',
                    }}
                >
                    <FacilityDetail
                        facility={selectedFacility}
                        onClose={handleCloseDetail}
                    />
                </Box>
            )}
        </Box>
    );
}

export default function ListPage() {
    return (
        <Suspense fallback={<Center h="100dvh"><Loader size="lg" /></Center>}>
            <ListPageContent />
        </Suspense>
    );
}
