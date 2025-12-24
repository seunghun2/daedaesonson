'use client';
import { Box, Text, Stack, Group } from '@mantine/core';
import { ArrowLeft, Check, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import BottomNav from '@/components/common/BottomNav';

export default function AnchiPage() {
    return (
        <Box style={{ minHeight: '100dvh', backgroundColor: 'white', paddingBottom: 80 }}>
            <Box p="md" style={{ backgroundColor: 'white', borderBottom: '1px solid #e9ecef', position: 'sticky', top: 0, zIndex: 100 }}>
                <Group gap="sm">
                    <Link href="/glossary" style={{ display: 'flex', alignItems: 'center' }}><ArrowLeft size={20} color="#495057" /></Link>
                    <Text size="lg" fw={700}>용어 가이드</Text>
                </Group>
            </Box>
            <Box style={{ position: 'relative', width: '100%', height: 220 }}>
                <Image src="/images/glossary/anchi_hero.png" alt="안치/봉안" fill style={{ objectFit: 'cover' }} />
                <Box style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, background: 'linear-gradient(transparent, white)' }} />
            </Box>
            <Box px="lg" pb="xl" style={{ marginTop: -30, position: 'relative' }}>
                <Box bg="white" p="md" mb="lg" style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                    <Text size="xs" c="brand" fw={600} mb={4}>#2 장례 절차</Text>
                    <Text size="xl" fw={700} mb="xs">안치 / 봉안</Text>
                    <Text size="sm" c="dimmed">유골을 시설에 모시는 것</Text>
                </Box>
                <Stack gap="xl">
                    <Box>
                        <Text size="lg" fw={700} mb="md">안치와 봉안이란?</Text>
                        <Text size="sm" c="dark.6" lh={1.9}>
                            <Text component="span" fw={600}>안치</Text>는 유골을 시설에 모시는 것을 말합니다.
                            <Text component="span" fw={600}> 봉안</Text>은 유골을 봉안함에 담아 봉안당에 모시는 것을 특별히 지칭합니다.
                            비슷한 의미로 혼용되어 사용됩니다.
                        </Text>
                    </Box>
                    <Box>
                        <Text size="lg" fw={700} mb="md">안치 유형</Text>
                        <Stack gap="sm">
                            <Group gap="sm" align="flex-start">
                                <Check size={16} color="#1D0098" style={{ marginTop: 3 }} />
                                <Text size="sm" c="dark.6">봉안당에 안치</Text>
                            </Group>
                            <Group gap="sm" align="flex-start">
                                <Check size={16} color="#1D0098" style={{ marginTop: 3 }} />
                                <Text size="sm" c="dark.6">수목장에 안치</Text>
                            </Group>
                            <Group gap="sm" align="flex-start">
                                <Check size={16} color="#1D0098" style={{ marginTop: 3 }} />
                                <Text size="sm" c="dark.6">봉안묘에 안치</Text>
                            </Group>
                        </Stack>
                    </Box>
                    <Box p="lg" style={{ borderRadius: 16, backgroundColor: '#f8f8ff', border: '1px solid #e8e8ff' }}>
                        <Text size="sm" fw={700} c="brand" mb="sm">대대손손 TIP</Text>
                        <Text size="sm" c="dark.6" lh={1.8}><Text component="span" fw={600}>대대손손에서 안치 시설 가격을 비교</Text>해보세요!</Text>
                        <Link href="/"><Group gap={4} mt="md"><Text size="sm" fw={600} c="brand">가격 비교하기</Text><ChevronRight size={16} color="#1D0098" /></Group></Link>
                    </Box>
                </Stack>
            </Box>
            <BottomNav />
        </Box>
    );
}
