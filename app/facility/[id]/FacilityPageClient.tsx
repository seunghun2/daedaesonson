'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Center, Loader, Skeleton, Stack, Group, useMantineTheme } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import dynamic from 'next/dynamic';

const FacilityDetailSkeleton = () => (
    <Box bg="white" style={{ height: '100dvh', overflow: 'hidden' }}>
        {/* 헤더 영역 */}
        <Skeleton h={56} radius={0} />
        {/* 액션 바 */}
        <Skeleton h={48} radius={0} />
        {/* 카테고리 뱃지 + 조회수 */}
        <Group justify="space-between" px="md" py="sm">
            <Skeleton w={70} h={24} radius="xl" />
            <Skeleton w={160} h={16} radius="sm" />
        </Group>
        {/* 예상 이용 비용 */}
        <Box px="md" py="md">
            <Skeleton w={90} h={14} mb="sm" radius="sm" />
            <Skeleton w={200} h={22} mb={6} radius="sm" />
            <Skeleton w={170} h={22} mb="xs" radius="sm" />
            <Skeleton w={260} h={12} mt="sm" radius="sm" />
        </Box>
        {/* 시설 정보 아이콘 */}
        <Box px="md" py="lg" style={{ borderTop: '8px solid #f8f9fa' }}>
            <Skeleton w={70} h={18} mb="md" radius="sm" />
            <Group justify="space-around">
                {[1, 2, 3, 4].map(i => (
                    <Stack key={i} align="center" gap={6}>
                        <Skeleton circle h={52} w={52} />
                        <Skeleton w={36} h={12} radius="sm" />
                    </Stack>
                ))}
            </Group>
        </Box>
        {/* 시설 사진 */}
        <Box px="md" py="md" style={{ borderTop: '8px solid #f8f9fa' }}>
            <Skeleton w={70} h={18} mb="md" radius="sm" />
            <Group gap="sm" wrap="nowrap">
                <Skeleton w="50%" h={180} radius="md" />
                <Skeleton w="50%" h={180} radius="md" />
            </Group>
        </Box>
    </Box>
);

// 🚀 FacilityDetail 지연 로딩
const FacilityDetail = dynamic(() => import('@/components/detail/FacilityDetail'), {
    ssr: false,
    loading: () => <FacilityDetailSkeleton />,
});

interface FacilityPageClientProps {
    facilityBasic: any;
}

export default function FacilityPageClient({ facilityBasic }: FacilityPageClientProps) {
    const router = useRouter();
    const theme = useMantineTheme();
    const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);
    const [facility, setFacility] = useState<any>(facilityBasic);
    const [allFacilities, setAllFacilities] = useState<any[]>([]);
    const [mounted, setMounted] = useState(false);
    const enriched = useRef(false);
    const redirected = useRef(false);

    useEffect(() => {
        // 🖥️ PC에서 직접 접근 시: 메인으로 리다이렉트 → 사이드 패널에서 열기
        // isMobile이 아직 undefined(hydration 중)이면 대기
        if (isMobile === undefined) return;

        // 실제 PC인지 window.innerWidth로 이중 검증 (useMediaQuery 타이밍 이슈 방지)
        if (isMobile === false && window.innerWidth >= 768 && !redirected.current) {
            redirected.current = true;
            sessionStorage.setItem('openFacilityId', facilityBasic.id);
            // 🗺️ 지도 초기 center를 시설 좌표로 설정 (NaverMap initMap에서 pendingMapView 읽음)
            if (facilityBasic.coordinates) {
                sessionStorage.setItem('pendingMapView', JSON.stringify({
                    lat: facilityBasic.coordinates.lat,
                    lng: facilityBasic.coordinates.lng,
                    zoom: 17,
                    facilityId: facilityBasic.id,
                }));
            }
            router.replace('/');
            return;
        }

        // 📱 모바일: 슬라이드인 애니메이션
        if (isMobile) {
            requestAnimationFrame(() => setMounted(true));
        }

        // 🚀 SSR 기본 데이터 위에 상세 데이터 보강 (pricing, reviews 등)
        const fetchFacilityData = () => {
            fetch(`/api/facilities/${facilityBasic.id}`, { cache: 'no-store' })
                .then(res => res.ok ? res.json() : null)
                .then(data => {
                    if (data) setFacility(data);
                })
                .catch(() => { /* SSR 데이터로 폴백 */ });
        };

        if (!enriched.current) {
            enriched.current = true;
            fetchFacilityData();
            // 📱 모바일: 주변 시설 추천용 전체 시설 로드
            fetch('/data/facilities.json')
                .then(res => res.ok ? res.json() : [])
                .then(data => { if (Array.isArray(data)) setAllFacilities(data); })
                .catch(() => {});
        }

        // 뒤로가기 등으로 페이지가 다시 보일 때 데이터 새로고침
        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                fetchFacilityData();
            }
        };
        document.addEventListener('visibilitychange', handleVisibility);

        // popstate (뒤로가기)로 돌아올 때도 새로고침
        const handlePopState = () => fetchFacilityData();
        window.addEventListener('popstate', handlePopState);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibility);
            window.removeEventListener('popstate', handlePopState);
        };
    }, [facilityBasic.id, isMobile]);

    // 브라우저 기록에 따른 뒤로가기 처리
    const handleClose = () => {
        // 직접 접근 시 (외부 링크, 카카오톡 공유 등) → 메인으로
        if (window.history.length <= 2) {
            router.push('/');
        } else {
            router.back();
        }
    };

    const [animationDone, setAnimationDone] = useState(false);

    useEffect(() => {
        if (mounted) {
            const timer = setTimeout(() => setAnimationDone(true), 350);
            return () => clearTimeout(timer);
        }
    }, [mounted]);

    return (
        <Box
            style={{
                height: '100dvh',
                overflow: 'hidden',
                ...(animationDone ? {} : {
                    transform: mounted ? 'translateX(0)' : 'translateX(100%)',
                    transition: 'transform 0.3s ease-out',
                }),
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 1000,
                background: 'white',
            }}
        >
            <FacilityDetail
                facility={facility}
                allFacilities={allFacilities}
                onClose={handleClose}
                onMapView={() => {
                    // 🗺️ 지도보기: 좌표를 sessionStorage에 저장 → 메인 지도에서 해당 위치로 이동
                    if (facility.coordinates) {
                        sessionStorage.setItem('pendingMapView', JSON.stringify({
                            lat: facility.coordinates.lat,
                            lng: facility.coordinates.lng,
                            zoom: 17,
                            facilityId: facility.id,
                        }));
                    }
                    router.push('/');
                }}
                onSelectFacility={(id) => {
                    router.push(`/facility/${id}`);
                }}
            />
        </Box>
    );
}
