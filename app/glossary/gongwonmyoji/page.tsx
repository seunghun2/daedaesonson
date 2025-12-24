'use client';

import { Box, Text, Stack, Group } from '@mantine/core';
import { ArrowLeft, Check, ChevronRight, MapPin, TreePine, Building } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import BottomNav from '@/components/common/BottomNav';

export default function GongwonmyojiPage() {
    return (
        <Box style={{ minHeight: '100dvh', backgroundColor: 'white', paddingBottom: 80 }}>
            <Box p="md" style={{ backgroundColor: 'white', borderBottom: '1px solid #e9ecef', position: 'sticky', top: 0, zIndex: 100 }}>
                <Group gap="sm">
                    <Link href="/glossary" style={{ display: 'flex', alignItems: 'center' }}>
                        <ArrowLeft size={20} color="#495057" />
                    </Link>
                    <Text size="lg" fw={700}>용어 가이드</Text>
                </Group>
            </Box>

            <Box style={{ position: 'relative', width: '100%', height: 220 }}>
                <Image src="/images/glossary/gongwonmyoji_hero.png" alt="공원묘지" fill style={{ objectFit: 'cover' }} />
                <Box style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, background: 'linear-gradient(transparent, white)' }} />
            </Box>

            <Box px="lg" pb="xl" style={{ marginTop: -30, position: 'relative' }}>
                <Box bg="white" p="md" mb="lg" style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                    <Text size="xs" c="brand" fw={600} mb={4}>#1 장지 유형</Text>
                    <Text size="xl" fw={700} mb="xs">공원묘지</Text>
                    <Text size="sm" c="dimmed">공원처럼 조성된 현대적 묘지</Text>
                </Box>

                <Stack gap="xl">
                    <Box>
                        <Text size="lg" fw={700} mb="md">공원묘지란?</Text>
                        <Text size="sm" c="dark.6" lh={1.9} mb="md">
                            공원묘지는 <Text component="span" fw={600}>공원처럼 아름답게 조성된 묘지</Text>입니다.
                            전통적인 산소와 달리 잔디밭, 조경, 산책로 등이 갖춰져 있어
                            편안하게 참배할 수 있습니다.
                        </Text>
                        <Text size="sm" c="dark.6" lh={1.9}>
                            봉안당, 수목장, 봉안묘 등 다양한 안치 시설이 함께 있는 경우가 많습니다.
                        </Text>
                    </Box>

                    <Box>
                        <Text size="lg" fw={700} mb="md">공원묘지의 특징</Text>
                        <Stack gap="sm">
                            <Group gap="sm" align="flex-start">
                                <Check size={16} color="#1D0098" style={{ marginTop: 3 }} />
                                <Text size="sm" c="dark.6" lh={1.6}>
                                    <Text component="span" fw={600}>정돈된 환경:</Text> 잔디, 조경, 산책로 완비
                                </Text>
                            </Group>
                            <Group gap="sm" align="flex-start">
                                <Check size={16} color="#1D0098" style={{ marginTop: 3 }} />
                                <Text size="sm" c="dark.6" lh={1.6}>
                                    <Text component="span" fw={600}>편의시설:</Text> 주차장, 휴게실, 화장실 등
                                </Text>
                            </Group>
                            <Group gap="sm" align="flex-start">
                                <Check size={16} color="#1D0098" style={{ marginTop: 3 }} />
                                <Text size="sm" c="dark.6" lh={1.6}>
                                    <Text component="span" fw={600}>다양한 시설:</Text> 봉안당, 수목장, 봉안묘 등 복합 운영
                                </Text>
                            </Group>
                        </Stack>
                    </Box>

                    <Box p="lg" style={{ borderRadius: 16, backgroundColor: '#f8f8ff', border: '1px solid #e8e8ff' }}>
                        <Text size="sm" fw={700} c="brand" mb="sm">대대손손 TIP</Text>
                        <Text size="sm" c="dark.6" lh={1.8}>
                            공원묘지마다 시설과 가격이 다릅니다.
                            <Text component="span" fw={600}> 대대손손에서 전국 공원묘지를 비교</Text>해보세요!
                        </Text>
                        <Link href="/">
                            <Group gap={4} mt="md">
                                <Text size="sm" fw={600} c="brand">가격 비교하기</Text>
                                <ChevronRight size={16} color="#1D0098" />
                            </Group>
                        </Link>
                    </Box>

                    <Box>
                        <Text size="sm" fw={600} mb="md">다른 용어도 알아보세요</Text>
                        <Group gap="xs">
                            <Link href="/glossary/bongandang" style={{ textDecoration: 'none' }}>
                                <Box px="md" py="xs" style={{ borderRadius: 20, backgroundColor: '#f1f3f5' }}>
                                    <Text size="xs" c="dark">봉안당</Text>
                                </Box>
                            </Link>
                            <Link href="/glossary/sumokjang" style={{ textDecoration: 'none' }}>
                                <Box px="md" py="xs" style={{ borderRadius: 20, backgroundColor: '#f1f3f5' }}>
                                    <Text size="xs" c="dark">수목장</Text>
                                </Box>
                            </Link>
                        </Group>
                    </Box>
                </Stack>
            </Box>
            <BottomNav />
        </Box>
    );
}
