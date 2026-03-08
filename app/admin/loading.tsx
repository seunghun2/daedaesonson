import { Box, Skeleton, Stack, Group, SimpleGrid } from '@mantine/core';

export default function Loading() {
    return (
        <Box p="md">
            {/* 대시보드 헤더 */}
            <Skeleton height={28} width={180} mb="lg" />

            {/* 통계 카드 */}
            <SimpleGrid cols={{ base: 2, sm: 4 }} mb="xl">
                {[1, 2, 3, 4].map(i => (
                    <Box key={i} p="md" bg="white" style={{ borderRadius: 12 }}>
                        <Skeleton height={14} width="50%" mb={8} />
                        <Skeleton height={28} width="70%" />
                    </Box>
                ))}
            </SimpleGrid>

            {/* 테이블 스켈레톤 */}
            <Box bg="white" p="md" style={{ borderRadius: 12 }}>
                <Group justify="space-between" mb="md">
                    <Skeleton height={20} width={150} />
                    <Skeleton height={32} width={100} radius="md" />
                </Group>
                <Stack gap="sm">
                    {[1, 2, 3, 4, 5].map(i => (
                        <Group key={i} wrap="nowrap">
                            <Skeleton height={14} width="20%" />
                            <Skeleton height={14} width="40%" />
                            <Skeleton height={14} width="15%" />
                            <Skeleton height={14} width="10%" />
                        </Group>
                    ))}
                </Stack>
            </Box>
        </Box>
    );
}
