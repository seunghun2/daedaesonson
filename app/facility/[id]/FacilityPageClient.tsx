'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Center, Loader } from '@mantine/core';
import dynamic from 'next/dynamic';

// 🚀 FacilityDetail 지연 로딩
const FacilityDetail = dynamic(() => import('@/components/detail/FacilityDetail'), {
    ssr: false,
    loading: () => (
        <Center h="100dvh"><Loader color="brand" size="lg" /></Center>
    ),
});

interface FacilityPageClientProps {
    facilityBasic: any;
}

export default function FacilityPageClient({ facilityBasic }: FacilityPageClientProps) {
    const router = useRouter();
    const [facility, setFacility] = useState<any>(facilityBasic);
    const [mounted, setMounted] = useState(false);
    const enriched = useRef(false);

    useEffect(() => {
        // 슬라이드인 애니메이션
        requestAnimationFrame(() => setMounted(true));

        // 🚀 SSR 기본 데이터 위에 상세 데이터 보강 (pricing, reviews 등)
        if (!enriched.current) {
            enriched.current = true;
            fetch(`/api/facilities/${facilityBasic.id}`)
                .then(res => res.ok ? res.json() : null)
                .then(data => {
                    if (data) setFacility(data);
                })
                .catch(() => { /* SSR 데이터로 폴백 */ });
        }
    }, [facilityBasic.id]);

    // 브라우저 기록에 따른 뒤로가기 처리
    const handleClose = () => {
        // 직접 접근 시 (외부 링크, 카카오톡 공유 등) → 메인으로
        if (window.history.length <= 2) {
            router.push('/');
        } else {
            router.back();
        }
    };

    return (
        <Box
            style={{
                height: '100dvh',
                overflow: 'auto',
                transform: mounted ? 'translateX(0)' : 'translateX(100%)',
                transition: 'transform 0.3s ease-out',
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
