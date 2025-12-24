'use client';
import { Box, Text, Stack, Group } from '@mantine/core';
import { ArrowLeft, Check, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import BottomNav from '@/components/common/BottomNav';

export default function BonganhamPage() {
    return (
        <Box style={{ minHeight: '100dvh', backgroundColor: 'white', paddingBottom: 80 }}>
            <Box p="md" style={{ backgroundColor: 'white', borderBottom: '1px solid #e9ecef', position: 'sticky', top: 0, zIndex: 100 }}>
                <Group gap="sm">
                    <Link href="/glossary" style={{ display: 'flex', alignItems: 'center' }}><ArrowLeft size={20} color="#495057" /></Link>
                    <Text size="lg" fw={700}>용어 가이드</Text>
                </Group>
            </Box>
            <Box style={{ position: 'relative', width: '100%', height: 220 }}>
                <Image src="/images/glossary/bonganham_hero.png" alt="봉안함" fill style={{ objectFit: 'cover' }} />
                <Box style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, background: 'linear-gradient(transparent, white)' }} />
            </Box>
            <Box px="lg" pb="xl" style={{ marginTop: -30, position: 'relative' }}>
                <Box bg="white" p="md" mb="lg" style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                    <Text size="xs" c="brand" fw={600} mb={4}>#2 장례 절차</Text>
                    <Text size="xl" fw={700} mb="xs">봉안함</Text>
                    <Text size="sm" c="dimmed">유골을 담는 용기</Text>
                </Box>
                <Stack gap="xl">
                    <Box>
                        <Text size="lg" fw={700} mb="md">봉안함이란?</Text>
                        <Text size="sm" c="dark.6" lh={1.9}>
                            봉안함은 <Text component="span" fw={600}>화장 후 유골(골분)을 담는 용기</Text>입니다.
                            '유골함', '납골함'이라고도 부릅니다. 도자기, 대리석, 옥 등 다양한 재질로 제작됩니다.
                        </Text>
                    </Box>
                    <Box>
                        <Text size="lg" fw={700} mb="md">봉안함 종류</Text>
                        <Stack gap="sm">
                            <Group gap="sm" align="flex-start">
                                <Check size={16} color="#1D0098" style={{ marginTop: 3 }} />
                                <Text size="sm" c="dark.6">도자기 봉안함 - 가장 일반적</Text>
                            </Group>
                            <Group gap="sm" align="flex-start">
                                <Check size={16} color="#1D0098" style={{ marginTop: 3 }} />
                                <Text size="sm" c="dark.6">대리석/옥 봉안함 - 고급형</Text>
                            </Group>
                            <Group gap="sm" align="flex-start">
                                <Check size={16} color="#1D0098" style={{ marginTop: 3 }} />
                                <Text size="sm" c="dark.6">생분해성 봉안함 - 자연장용</Text>
                            </Group>
                        </Stack>
                    </Box>
                    <Box p="lg" style={{ borderRadius: 16, backgroundColor: '#f8f8ff', border: '1px solid #e8e8ff' }}>
                        <Text size="sm" fw={700} c="brand" mb="sm">대대손손 TIP</Text>
                        <Text size="sm" c="dark.6" lh={1.8}>봉안함은 봉안당에서 제공하거나 별도 구매할 수 있습니다.</Text>
                    </Box>
                </Stack>
            </Box>
            <BottomNav />
        </Box>
    );
}
