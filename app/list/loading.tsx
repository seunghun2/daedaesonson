import { Box, Skeleton, Stack, Group } from '@mantine/core';

export default function Loading() {
    return (
        <Box style={{ minHeight: '100dvh', backgroundColor: '#f8f9fa' }}>
            {/* 헤더 스켈레톤 */}
            <Box p="md" style={{ backgroundColor: 'white', borderBottom: '1px solid #e9ecef' }}>
                <Group justify="space-between">
                    <Skeleton height={24} width={100} />
                    <Skeleton height={32} width={120} radius="xl" />
                </Group>
            </Box>

            {/* 필터 영역 */}
            <Box p="md" bg="white" mb="xs">
                <Group gap="xs">
                    <Skeleton height={32} width={80} radius="xl" />
                    <Skeleton height={32} width={80} radius="xl" />
                    <Skeleton height={32} width={80} radius="xl" />
                </Group>
            </Box>

            {/* 시설 카드 리스트 */}
            <Stack gap="xs" p="md">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <Box key={i} p="md" bg="white" style={{ borderRadius: 12 }}>
                        <Group wrap="nowrap" gap="md">
                            <Skeleton height={90} width={90} radius={8} />
                            <Box style={{ flex: 1 }}>
                                <Skeleton height={18} width="50%" mb={10} />
                                <Skeleton height={12} width="70%" mb={6} />
                                <Skeleton height={12} width="30%" mb={6} />
                                <Skeleton height={14} width="40%" />
                            </Box>
                        </Group>
                    </Box>
                ))}
            </Stack>
        </Box>
    );
}
