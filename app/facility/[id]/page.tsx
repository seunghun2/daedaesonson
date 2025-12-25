'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Center, Loader, Text } from '@mantine/core';
import FacilityDetail from '@/components/detail/FacilityDetail';

interface FacilityPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default function FacilityPage({ params }: FacilityPageProps) {
    const router = useRouter();
    const [facility, setFacility] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        params.then(p => {
            // 시설 데이터 로드
            import('@/data/facilities.json').then(module => {
                const facilities = module.default as any[];
                const found = facilities.find((f: any) => f.id === p.id);
                setFacility(found);
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
        <Box style={{ height: '100dvh', overflow: 'auto' }}>
            <FacilityDetail
                facility={facility}
                onClose={() => router.back()}
            />
        </Box>
    );
}
