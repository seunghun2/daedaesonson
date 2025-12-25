'use client';

import { Suspense } from 'react';
import FacilityDetail from '@/components/detail/FacilityDetail';
import { Box, Center, Loader } from '@mantine/core';

// Next.js App Router에서 동적 파라미터를 받기 위한 타입
interface FacilityPageProps {
    params: Promise<{
        id: string;
    }>;
}

// 로딩 컴포넌트
function LoadingFallback() {
    return (
        <Center style={{ height: '100dvh' }}>
            <Loader color="brand" size="lg" />
        </Center>
    );
}

// 메인 페이지 컴포넌트
export default async function FacilityPage({ params }: FacilityPageProps) {
    const { id } = await params;

    // facilities.json에서 시설 데이터 로드 (서버 사이드)
    const facilitiesModule = await import('@/data/facilities.json');
    const facilities = facilitiesModule.default as any[];

    const facility = facilities.find((f: any) => f.id === id);

    if (!facility) {
        return (
            <Box p="xl" ta="center">
                <h1>시설을 찾을 수 없습니다</h1>
                <p>요청하신 시설 ID: {id}</p>
            </Box>
        );
    }

    return (
        <Suspense fallback={<LoadingFallback />}>
            <FacilityDetailWrapper facility={facility} />
        </Suspense>
    );
}

// 클라이언트 래퍼 컴포넌트
function FacilityDetailWrapper({ facility }: { facility: any }) {
    'use client';

    return (
        <Box style={{ height: '100dvh', overflow: 'auto' }}>
            <FacilityDetail
                facility={facility}
                onClose={() => {
                    // 뒤로가기로 홈/지도로 이동
                    if (typeof window !== 'undefined') {
                        window.history.back();
                    }
                }}
            />
        </Box>
    );
}
