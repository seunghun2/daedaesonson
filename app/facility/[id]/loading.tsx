'use client';

import { Box, Skeleton, Stack, Group } from '@mantine/core';

export default function FacilityLoading() {
    return (
        <Box bg="white" style={{ height: '100dvh', overflow: 'hidden', position: 'fixed', inset: 0, zIndex: 1000 }}>
            {/* 헤더 */}
            <Group h={56} px="md" justify="space-between" style={{ borderBottom: '1px solid #e9ecef' }}>
                <Group gap="sm">
                    <Skeleton circle w={32} h={32} />
                    <Skeleton w={40} h={24} radius="xl" />
                    <Skeleton w={120} h={20} radius="sm" />
                </Group>
                <Group gap="xs">
                    <Skeleton circle w={32} h={32} />
                    <Skeleton circle w={32} h={32} />
                </Group>
            </Group>
            {/* 액션 바 */}
            <Group h={48} justify="space-around" px="md" style={{ borderBottom: '1px solid #e9ecef' }}>
                <Skeleton w={80} h={20} radius="sm" />
                <Skeleton w={60} h={20} radius="sm" />
                <Skeleton w={60} h={20} radius="sm" />
            </Group>
            {/* 카테고리 뱃지 + 조회수 */}
            <Group justify="space-between" px="md" py="sm">
                <Skeleton w={70} h={24} radius="xl" />
                <Skeleton w={160} h={16} radius="sm" />
            </Group>
            {/* 예상 이용 비용 */}
            <Box px="md" py="md" style={{ borderBottom: '8px solid #f8f9fa' }}>
                <Skeleton w={90} h={14} mb="sm" radius="sm" />
                <Skeleton w={200} h={24} mb={8} radius="sm" />
                <Skeleton w={170} h={24} mb="xs" radius="sm" />
                <Skeleton w={260} h={12} mt="sm" radius="sm" />
            </Box>
            {/* 시설 정보 아이콘 */}
            <Box px="md" py="lg" style={{ borderBottom: '8px solid #f8f9fa' }}>
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
            <Box px="md" py="md" style={{ borderBottom: '8px solid #f8f9fa' }}>
                <Skeleton w={70} h={18} mb="md" radius="sm" />
                <Group gap="sm" wrap="nowrap">
                    <Skeleton w="48%" h={180} radius="md" />
                    <Skeleton w="48%" h={180} radius="md" />
                </Group>
            </Box>
            {/* 가격 탭 */}
            <Box px="md" py="md">
                <Group gap="lg" mb="md">
                    <Skeleton w={60} h={32} radius="sm" />
                    <Skeleton w={60} h={32} radius="sm" />
                    <Skeleton w={60} h={32} radius="sm" />
                </Group>
                <Skeleton h={200} radius="md" />
            </Box>
        </Box>
    );
}
