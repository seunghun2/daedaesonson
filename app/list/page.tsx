'use client';

import { useState, useMemo, useEffect, useCallback, useTransition, Suspense } from 'react';
import { Box, Group, Text, ScrollArea, Center, Loader, Button, Stack, ActionIcon, Checkbox, Drawer, Popover } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { ChevronLeft, ChevronDown } from 'lucide-react';
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
    const [hideInquiry, setHideInquiry] = useState(true); // 문의제외 기본 ON
    const [isPending, startTransition] = useTransition();

    const [categoryFilterOpen, setCategoryFilterOpen] = useState(false);
    const [tempCategory, setTempCategory] = useState<string[]>(['all']);
    const [tempHideInquiry, setTempHideInquiry] = useState(false);

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

    // Step 3: 문의제외 필터
    const finalFacilities = useMemo(() => {
        if (!hideInquiry) return filteredFacilities;
        return filteredFacilities.filter(f => (f.priceRange?.min ?? 0) > 0);
    }, [filteredFacilities, hideInquiry]);

    const visibleFacilities = finalFacilities.slice(0, visibleCount);

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
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {/* 카테고리 필터 버튼 → Drawer 오픈 */}
                    <button
                        onClick={() => {
                            setTempCategory([...activeCategory]);
                            setTempHideInquiry(hideInquiry);
                            setCategoryFilterOpen(true);
                        }}
                        style={{
                            height: '30px', fontSize: '12px', fontWeight: 600,
                            backgroundColor: activeCategory.includes('all') ? 'white' : '#f1f3f5',
                            color: activeCategory.includes('all') ? '#495057' : '#343a40',
                            border: activeCategory.includes('all') ? '1px solid #dee2e6' : '1.5px solid #868e96',
                            borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s',
                            paddingLeft: '12px', paddingRight: '8px', whiteSpace: 'nowrap',
                            display: 'flex', alignItems: 'center', gap: '4px',
                        }}
                    >
                        {activeCategory.includes('all') ? '전체 시설' :
                            activeCategory.length === 1 ?
                                ({ charnel: '봉안당', natural: '수목장', park: '공원묘지' }[activeCategory[0]] || '전체 시설') :
                                `${({ charnel: '봉안당', natural: '수목장', park: '공원묘지' }[activeCategory[0]] || '')} 외 ${activeCategory.length - 1}`
                        }
                        <ChevronDown size={14} style={{ opacity: 0.6 }} />
                    </button>

                    {/* 문의제외 필터 */}
                    <button
                        onClick={() => setHideInquiry(!hideInquiry)}
                        style={{
                            height: '30px', fontSize: '12px',
                            fontWeight: hideInquiry ? 700 : 500,
                            backgroundColor: hideInquiry ? '#EDE9FF' : 'white',
                            color: hideInquiry ? '#1D0098' : '#495057',
                            border: hideInquiry ? '1.5px solid #1D0098' : '1px solid #dee2e6',
                            borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s',
                            paddingLeft: '14px', paddingRight: '14px', whiteSpace: 'nowrap', flexShrink: 0,
                        }}
                    >
                        문의제외
                    </button>
                </div>

                {/* 필터 Drawer (PC: 왼쪽 사이드바 크기, 모바일: 풀스크린) */}
                <Drawer
                    opened={categoryFilterOpen}
                    onClose={() => setCategoryFilterOpen(false)}
                    position={isMobile ? 'bottom' : 'left'}
                    size={isMobile ? '100%' : 400}
                    withCloseButton={false}
                    zIndex={10000}
                    styles={{
                        content: { borderRadius: isMobile ? '16px 16px 0 0' : 0, display: 'flex', flexDirection: 'column' as const },
                        body: { padding: 0, flex: 1, display: 'flex', flexDirection: 'column' as const },
                    }}
                >
                    {/* 헤더 */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #f1f3f5' }}>
                        <button onClick={() => setCategoryFilterOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28 }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        </button>
                        <Text fw={700} size="md">필터</Text>
                        <div style={{ width: 28 }} />
                    </div>

                    {/* 시설 유형 */}
                    <div style={{ padding: '20px 24px', flex: 1 }}>
                        <Text fw={700} size="sm" mb={16}>시설 유형</Text>
                        <Stack gap={14}>
                            {[
                                { value: 'charnel', label: '봉안당' },
                                { value: 'natural', label: '수목장' },
                                { value: 'park', label: '공원묘지' }
                            ].map(tab => (
                                <Checkbox
                                    key={tab.value}
                                    label={tab.label}
                                    checked={tempCategory.includes('all') || tempCategory.includes(tab.value)}
                                    onChange={() => {
                                        if (tempCategory.includes('all')) {
                                            const others = ['charnel', 'natural', 'park'].filter(v => v !== tab.value);
                                            setTempCategory(others);
                                        } else if (tempCategory.includes(tab.value)) {
                                            const newCats = tempCategory.filter(c => c !== tab.value);
                                            setTempCategory(newCats.length === 0 ? ['all'] : newCats);
                                        } else {
                                            const newCats = [...tempCategory, tab.value];
                                            setTempCategory(newCats.length === 3 ? ['all'] : newCats);
                                        }
                                    }}
                                    size="md"
                                    color="indigo"
                                    styles={{ label: { fontSize: '15px', fontWeight: 500, cursor: 'pointer' }, input: { cursor: 'pointer' } }}
                                />
                            ))}
                        </Stack>

                        <div style={{ height: 1, backgroundColor: '#f1f3f5', margin: '20px 0' }} />

                        <Checkbox
                            label="문의 가격 시설 제외"
                            checked={tempHideInquiry}
                            onChange={() => setTempHideInquiry(!tempHideInquiry)}
                            size="md"
                            color="indigo"
                            styles={{ label: { fontSize: '15px', fontWeight: 500, cursor: 'pointer' }, input: { cursor: 'pointer' } }}
                        />
                    </div>

                    {/* 하단 버튼 */}
                    <div style={{ display: 'flex', gap: 12, padding: '16px 20px', borderTop: '1px solid #f1f3f5', paddingBottom: 'calc(16px + env(safe-area-inset-bottom))', marginTop: 'auto' }}>
                        <button
                            onClick={() => { setTempCategory(['all']); setTempHideInquiry(false); }}
                            style={{ flex: '0 0 auto', height: 48, padding: '0 20px', backgroundColor: 'white', border: '1px solid #dee2e6', borderRadius: 12, fontSize: 14, fontWeight: 600, color: '#495057', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
                            선택해제
                        </button>
                        <button
                            onClick={() => { setVisibleCount(20); startTransition(() => setActiveCategory(tempCategory)); setHideInquiry(tempHideInquiry); setCategoryFilterOpen(false); }}
                            style={{ flex: 1, height: 48, backgroundColor: '#1D0098', color: 'white', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
                        >
                            적용하기
                        </button>
                    </div>
                </Drawer>
            </Box>

            {/* 시설 리스트 */}
            <ScrollArea h="calc(100dvh - 110px)">
                {loading ? (
                    <Center h="200px">
                        <Loader size="lg" />
                    </Center>
                ) : finalFacilities.length === 0 ? (
                    <Center h="200px" px="md">
                        <Text c="dimmed" ta="center">
                            해당 지역에 시설이 없습니다.
                        </Text>
                    </Center>
                ) : (
                    <Stack p="md" gap="md">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text size="sm" c="dimmed" fw={500}>
                                검색 결과 {finalFacilities.length}개
                            </Text>
                            <Checkbox
                                label="문의시설 제외"
                                checked={hideInquiry}
                                onChange={() => setHideInquiry(!hideInquiry)}
                                size="xs"
                                color="indigo"
                                styles={{ label: { fontSize: '12px', color: '#868e96', cursor: 'pointer', paddingLeft: 6 }, input: { cursor: 'pointer' } }}
                            />
                        </div>

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
                        {visibleCount < finalFacilities.length && (
                            <Button
                                variant="light"
                                color="gray"
                                fullWidth
                                onClick={handleLoadMore}
                                mt="md"
                            >
                                더 보기 ({Math.min(finalFacilities.length - visibleCount, 20)}개)
                            </Button>
                        )}

                        {/* 하단 여백 */}
                        <Box h={50} />
                    </Stack>
                )}
            </ScrollArea>

            {/* 상세 페이지 */}
            {
                selectedFacility && (
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
                )
            }
        </Box >
    );
}

export default function ListPage() {
    return (
        <Suspense fallback={<Center h="100dvh"><Loader size="lg" /></Center>}>
            <ListPageContent />
        </Suspense>
    );
}
