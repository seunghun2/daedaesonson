import { Box, Skeleton, Group, Stack } from '@mantine/core';

export default function Loading() {
    return (
        <Box style={{ minHeight: '100dvh', backgroundColor: '#f8f9fa' }}>
            {/* 상단 검색바 스켈레톤 */}
            <Box p="md" style={{ backgroundColor: 'white', borderBottom: '1px solid #e9ecef' }}>
                <Skeleton height={40} radius="xl" />
            </Box>

            {/* 지도 영역 스켈레톤 */}
            <Skeleton height="50vh" radius={0} />

            {/* 하단 시설 카드 스켈레톤 */}
            <Stack gap="xs" p="md">
                {[1, 2, 3].map(i => (
                    <Box key={i} p="md" bg="white" style={{ borderRadius: 12 }}>
                        <Group wrap="nowrap" gap="md">
                            <Skeleton height={80} width={80} radius={8} />
                            <Box style={{ flex: 1 }}>
                                <Skeleton height={16} width="60%" mb={8} />
                                <Skeleton height={12} width="80%" mb={4} />
                                <Skeleton height={12} width="40%" />
                            </Box>
                        </Group>
                    </Box>
                ))}
            </Stack>
        </Box>
    );
}
