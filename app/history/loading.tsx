import { Box, Skeleton, Stack, Group } from '@mantine/core';

export default function Loading() {
    return (
        <Box style={{ minHeight: '100dvh', backgroundColor: '#f8f9fa', paddingBottom: 70 }}>
            <Box p="md" style={{ backgroundColor: 'white', borderBottom: '1px solid #e9ecef' }}>
                <Skeleton height={24} width={80} />
            </Box>
            <Stack gap="xs" p="md">
                {[1, 2, 3].map(i => (
                    <Box key={i} p="md" bg="white" style={{ borderRadius: 12 }}>
                        <Group gap="md" wrap="nowrap">
                            <Skeleton height={64} width={64} radius={8} />
                            <Box style={{ flex: 1 }}>
                                <Skeleton height={14} width="50%" mb={8} />
                                <Skeleton height={12} width="80%" mb={4} />
                                <Skeleton height={14} width="30%" />
                            </Box>
                        </Group>
                    </Box>
                ))}
            </Stack>
        </Box>
    );
}
