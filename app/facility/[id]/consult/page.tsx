'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Center, Loader, Text } from '@mantine/core';
import FacilityDetail from '@/components/detail/FacilityDetail';

interface ConsultPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default function ConsultPage({ params }: ConsultPageProps) {
    const router = useRouter();
    const [facility, setFacility] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // 마운트 후 애니메이션 시작
        requestAnimationFrame(() => {
            setMounted(true);
        });

        params.then(p => {
            // 시설 개별 데이터 로드 (10.9MB 번들 청크 방지)
            fetch(`/api/facilities/${p.id}`)
                .then(res => res.ok ? res.json() : null)
                .then(data => {
                    setFacility(data);
                    setLoading(false);
                })
                .catch(() => {
                    setLoading(false);
                });
        });
    }, [params]);

    if (loading) {
        return (
            <Center style={{ height: '100dvh' }}>
                <Loader color="brand" size="lg" />
            </Center>
        );
    }

    if (!facility) {
        return (
            <Box p="xl" ta="center">
                <Text size="xl" fw={700}>시설을 찾을 수 없습니다</Text>
            </Box>
        );
    }

    return (
        <Box
            style={{
                height: '100dvh',
                overflow: 'hidden',
                // 슬라이드 인 애니메이션
                transform: mounted ? 'translateX(0)' : 'translateX(100%)',
                transition: 'transform 0.3s ease-out',
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 1001,
                background: 'white'
            }}
        >
            <FacilityDetail
                facility={facility}
                onClose={() => router.back()}
                initialConsultOpen={true}
            />
        </Box>
    );
}
