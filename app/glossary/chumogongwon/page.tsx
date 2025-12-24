'use client';
import { Box, Text, Stack, Group } from '@mantine/core';
import { ArrowLeft, Check, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import BottomNav from '@/components/common/BottomNav';

export default function ChumogongwonPage() {
    return (
        <Box style={{ minHeight: '100dvh', backgroundColor: 'white', paddingBottom: 80 }}>
            <Box p="md" style={{ backgroundColor: 'white', borderBottom: '1px solid #e9ecef', position: 'sticky', top: 0, zIndex: 100 }}>
                <Group gap="sm">
                    <Link href="/glossary" style={{ display: 'flex', alignItems: 'center' }}><ArrowLeft size={20} color="#495057" /></Link>
                    <Text size="lg" fw={700}>용어 가이드</Text>
                </Group>
            </Box>
            <Box style={{ position: 'relative', width: '100%', height: 220 }}>
                <Image src="/images/glossary/chumogongwon_hero.png" alt="추모공원" fill style={{ objectFit: 'cover' }} />
                <Box style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, background: 'linear-gradient(transparent, white)' }} />
            </Box>
            <Box px="lg" pb="xl" style={{ marginTop: -30, position: 'relative' }}>
                <Box bg="white" p="md" mb="lg" style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                    <Text size="xs" c="brand" fw={600} mb={4}>#1 장지 유형</Text>
                    <Text size="xl" fw={700} mb="xs">추모공원</Text>
                    <Text size="sm" c="dimmed">다양한 장묘시설을 갖춘 종합 시설</Text>
                </Box>
                <Stack gap="xl">
                    <Box>
                        <Text size="lg" fw={700} mb="md">추모공원이란?</Text>
                        <Text size="sm" c="dark.6" lh={1.9}>
                            추모공원은 <Text component="span" fw={600}>봉안당, 수목장, 봉안묘 등 다양한 장묘시설을 한 곳에 갖춘 종합 시설</Text>입니다.
                            공원처럼 조경이 잘 되어 있고, 편의시설도 갖추고 있어 편안하게 참배할 수 있습니다.
                        </Text>
                    </Box>
                    <Box>
                        <Text size="lg" fw={700} mb="md">추모공원의 특징</Text>
                        <Stack gap="sm">
                            <Group gap="sm" align="flex-start">
                                <Check size={16} color="#1D0098" style={{ marginTop: 3 }} />
                                <Text size="sm" c="dark.6">다양한 안치 방식 선택 가능</Text>
                            </Group>
                            <Group gap="sm" align="flex-start">
                                <Check size={16} color="#1D0098" style={{ marginTop: 3 }} />
                                <Text size="sm" c="dark.6">주차장, 휴게실, 카페 등 편의시설</Text>
                            </Group>
                            <Group gap="sm" align="flex-start">
                                <Check size={16} color="#1D0098" style={{ marginTop: 3 }} />
                                <Text size="sm" c="dark.6">아름다운 조경과 산책로</Text>
                            </Group>
                        </Stack>
                    </Box>
                    <Box p="lg" style={{ borderRadius: 16, backgroundColor: '#f8f8ff', border: '1px solid #e8e8ff' }}>
                        <Text size="sm" fw={700} c="brand" mb="sm">대대손손 TIP</Text>
                        <Text size="sm" c="dark.6" lh={1.8}><Text component="span" fw={600}>대대손손에서 전국 추모공원 가격을 비교</Text>해보세요!</Text>
                        <Link href="/"><Group gap={4} mt="md"><Text size="sm" fw={600} c="brand">가격 비교하기</Text><ChevronRight size={16} color="#1D0098" /></Group></Link>
                    </Box>
                </Stack>
            </Box>
            <BottomNav />
        </Box>
    );
}
