'use client';
import { Box, Text, Stack, Group } from '@mantine/core';
import { ArrowLeft, Check, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import BottomNav from '@/components/common/BottomNav';

export default function HapjangPage() {
    return (
        <Box style={{ minHeight: '100dvh', backgroundColor: 'white', paddingBottom: 80 }}>
            <Box p="md" style={{ backgroundColor: 'white', borderBottom: '1px solid #e9ecef', position: 'sticky', top: 0, zIndex: 100 }}>
                <Group gap="sm">
                    <Link href="/glossary" style={{ display: 'flex', alignItems: 'center' }}><ArrowLeft size={20} color="#495057" /></Link>
                    <Text size="lg" fw={700}>용어 가이드</Text>
                </Group>
            </Box>
            <Box style={{ position: 'relative', width: '100%', height: 220 }}>
                <Image src="/images/glossary/anchi_hero.png" alt="합장" fill style={{ objectFit: 'cover' }} />
                <Box style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, background: 'linear-gradient(transparent, white)' }} />
            </Box>
            <Box px="lg" pb="xl" style={{ marginTop: -30, position: 'relative' }}>
                <Box bg="white" p="md" mb="lg" style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                    <Text size="xs" c="brand" fw={600} mb={4}>#2 장례 절차</Text>
                    <Text size="xl" fw={700} mb="xs">합장</Text>
                    <Text size="sm" c="dimmed">두 분 이상을 함께 모시는 것</Text>
                </Box>
                <Stack gap="xl">
                    <Box>
                        <Text size="lg" fw={700} mb="md">합장이란?</Text>
                        <Text size="sm" c="dark.6" lh={1.9}>
                            합장은 <Text component="span" fw={600}>두 분 이상의 유골을 같은 공간에 함께 모시는 것</Text>입니다.
                            주로 부부가 함께 영면하기 위해 선택합니다. '합봉'이라고도 합니다.
                        </Text>
                    </Box>
                    <Box>
                        <Text size="lg" fw={700} mb="md">합장 유형</Text>
                        <Stack gap="sm">
                            <Group gap="sm" align="flex-start">
                                <Check size={16} color="#1D0098" style={{ marginTop: 3 }} />
                                <Text size="sm" c="dark.6">부부 합장 - 부부 두 분을 함께</Text>
                            </Group>
                            <Group gap="sm" align="flex-start">
                                <Check size={16} color="#1D0098" style={{ marginTop: 3 }} />
                                <Text size="sm" c="dark.6">가족 합장 - 가족 여러 분을 함께</Text>
                            </Group>
                        </Stack>
                    </Box>
                    <Box p="lg" style={{ borderRadius: 16, backgroundColor: '#f8f8ff', border: '1px solid #e8e8ff' }}>
                        <Text size="sm" fw={700} c="brand" mb="sm">대대손손 TIP</Text>
                        <Text size="sm" c="dark.6" lh={1.8}>합장은 부부형/가족형 봉안당이나 수목장에서 가능합니다.</Text>
                    </Box>
                </Stack>
            </Box>
            <BottomNav />
        </Box>
    );
}
