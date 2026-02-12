import { Box, Skeleton, Stack } from '@mantine/core';

export default function Loading() {
    return (
        <Box style={{ minHeight: '100dvh', backgroundColor: '#f8f9fa', paddingBottom: 70 }}>
            <Box p="md" style={{ backgroundColor: 'white', borderBottom: '1px solid #e9ecef' }}>
                <Skeleton height={24} width={120} />
            </Box>
            <Stack gap="xs" p="md">
                {[1, 2, 3, 4, 5].map(i => (
                    <Box key={i} p="md" bg="white" style={{ borderRadius: 12 }}>
                        <Skeleton height={16} width="60%" mb={8} />
                        <Skeleton height={12} width="90%" mb={4} />
                        <Skeleton height={12} width="40%" />
                    </Box>
                ))}
            </Stack>
        </Box>
    );
}
