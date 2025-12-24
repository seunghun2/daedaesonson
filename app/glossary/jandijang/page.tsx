'use client';
import { Box, Text, Stack, Group } from '@mantine/core';
import { ArrowLeft, Check, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import BottomNav from '@/components/common/BottomNav';

export default function JandijangPage() {
    return (
        <Box style={{ minHeight: '100dvh', backgroundColor: 'white', paddingBottom: 80 }}>
            <Box p="md" style={{ backgroundColor: 'white', borderBottom: '1px solid #e9ecef', position: 'sticky', top: 0, zIndex: 100 }}>
                <Group gap="sm">
                    <Link href="/glossary" style={{ display: 'flex', alignItems: 'center' }}><ArrowLeft size={20} color="#495057" /></Link>
                    <Text size="lg" fw={700}>용어 가이드</Text>
                </Group>
            </Box>
            <Box style={{ position: 'relative', width: '100%', height: 220 }}>
                <Image src="/images/glossary/jandijang_hero.png" alt="잔디장" fill style={{ objectFit: 'cover' }} />
                <Box style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, background: 'linear-gradient(transparent, white)' }} />
            </Box>
            <Box px="lg" pb="xl" style={{ marginTop: -30, position: 'relative' }}>
                <Box bg="white" p="md" mb="lg" style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                    <Text size="xs" c="brand" fw={600} mb={4}>#1 장지 유형</Text>
                    <Text size="xl" fw={700} mb="xs">잔디장</Text>
                    <Text size="sm" c="dimmed">잔디밭 아래에 유골을 모시는 자연장</Text>
                </Box>
                <Stack gap="xl">
                    <Box>
                        <Text size="lg" fw={700} mb="md">잔디장이란?</Text>
                        <Text size="sm" c="dark.6" lh={1.9}>
                            잔디장은 <Text component="span" fw={600}>화장 후 유골을 잔디밭 아래에 안치하는 자연장의 한 종류</Text>입니다.
                            넓은 잔디밭에 작은 표지석만 설치하여 자연스러운 경관을 유지합니다.
                        </Text>
                    </Box>
                    <Box>
                        <Text size="lg" fw={700} mb="md">잔디장의 특징</Text>
                        <Stack gap="sm">
                            <Group gap="sm" align="flex-start">
                                <Check size={16} color="#1D0098" style={{ marginTop: 3 }} />
                                <Text size="sm" c="dark.6">넓은 잔디밭에서 평화로운 추모</Text>
                            </Group>
                            <Group gap="sm" align="flex-start">
                                <Check size={16} color="#1D0098" style={{ marginTop: 3 }} />
                                <Text size="sm" c="dark.6">자연친화적이고 관리가 용이</Text>
                            </Group>
                            <Group gap="sm" align="flex-start">
                                <Check size={16} color="#1D0098" style={{ marginTop: 3 }} />
                                <Text size="sm" c="dark.6">수목장보다 비용이 저렴한 경우가 많음</Text>
                            </Group>
                        </Stack>
                    </Box>
                    <Box p="lg" style={{ borderRadius: 16, backgroundColor: '#f8f8ff', border: '1px solid #e8e8ff' }}>
                        <Text size="sm" fw={700} c="brand" mb="sm">대대손손 TIP</Text>
                        <Text size="sm" c="dark.6" lh={1.8}><Text component="span" fw={600}>대대손손에서 잔디장 가격을 비교</Text>해보세요!</Text>
                        <Link href="/"><Group gap={4} mt="md"><Text size="sm" fw={600} c="brand">가격 비교하기</Text><ChevronRight size={16} color="#1D0098" /></Group></Link>
                    </Box>
                </Stack>
            </Box>
            <BottomNav />
        </Box>
    );
}
