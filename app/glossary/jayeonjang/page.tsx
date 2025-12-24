'use client';

import { Box, Text, Stack, Group } from '@mantine/core';
import { ArrowLeft, Check, ChevronRight, TreePine, Flower2, Leaf } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import BottomNav from '@/components/common/BottomNav';

export default function JayeonjangPage() {
    return (
        <Box style={{ minHeight: '100dvh', backgroundColor: 'white', paddingBottom: 80 }}>
            {/* 헤더 */}
            <Box
                p="md"
                style={{
                    backgroundColor: 'white',
                    borderBottom: '1px solid #e9ecef',
                    position: 'sticky',
                    top: 0,
                    zIndex: 100,
                }}
            >
                <Group gap="sm">
                    <Link href="/glossary" style={{ display: 'flex', alignItems: 'center' }}>
                        <ArrowLeft size={20} color="#495057" />
                    </Link>
                    <Text size="lg" fw={700}>용어 가이드</Text>
                </Group>
            </Box>

            {/* 히어로 이미지 */}
            <Box style={{ position: 'relative', width: '100%', height: 220 }}>
                <Image
                    src="/images/glossary/jayeonjang_hero.png"
                    alt="자연장 풍경"
                    fill
                    style={{ objectFit: 'cover' }}
                />
                <Box
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: 80,
                        background: 'linear-gradient(transparent, white)',
                    }}
                />
            </Box>

            {/* 본문 */}
            <Box px="lg" pb="xl" style={{ marginTop: -30, position: 'relative' }}>
                <Box
                    bg="white"
                    p="md"
                    mb="lg"
                    style={{
                        borderRadius: 16,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    }}
                >
                    <Text size="xs" c="brand" fw={600} mb={4}>#1 장지 유형</Text>
                    <Text size="xl" fw={700} mb="xs">자연장</Text>
                    <Text size="sm" c="dimmed">
                        자연으로 돌아가는 친환경 장법의 총칭
                    </Text>
                </Box>

                <Stack gap="xl">
                    <Box>
                        <Text size="lg" fw={700} mb="md">자연장이란?</Text>
                        <Text size="sm" c="dark.6" lh={1.9} mb="md">
                            자연장은 <Text component="span" fw={600}>화장 후 유골을 나무, 화초, 잔디 등의 밑이나 주변에 묻는 친환경 장법</Text>을 총칭합니다.
                            비석이나 시설물 없이 자연 그대로의 모습을 유지하면서 고인을 추모합니다.
                        </Text>
                        <Text size="sm" c="dark.6" lh={1.9}>
                            수목장, 잔디장, 화초장 등이 자연장에 해당합니다.
                            환경 보존과 후손들에게 아름다운 자연을 물려주기 위한 장례 문화로 주목받고 있습니다.
                        </Text>
                    </Box>

                    <Box>
                        <Text size="lg" fw={700} mb="md">자연장의 종류</Text>

                        <Stack gap="md">
                            <Group gap="md" align="flex-start">
                                <Box
                                    style={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: 12,
                                        backgroundColor: '#f0f0ff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                    }}
                                >
                                    <TreePine size={22} color="#1D0098" />
                                </Box>
                                <Box>
                                    <Text size="sm" fw={600} mb={4}>수목장</Text>
                                    <Text size="sm" c="dark.6" lh={1.7}>
                                        나무 밑이나 주변에 유골을 안치합니다.
                                    </Text>
                                </Box>
                            </Group>

                            <Group gap="md" align="flex-start">
                                <Box
                                    style={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: 12,
                                        backgroundColor: '#f0f0ff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                    }}
                                >
                                    <Leaf size={22} color="#1D0098" />
                                </Box>
                                <Box>
                                    <Text size="sm" fw={600} mb={4}>잔디장</Text>
                                    <Text size="sm" c="dark.6" lh={1.7}>
                                        잔디밭 아래에 유골을 안치합니다.
                                    </Text>
                                </Box>
                            </Group>

                            <Group gap="md" align="flex-start">
                                <Box
                                    style={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: 12,
                                        backgroundColor: '#f0f0ff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                    }}
                                >
                                    <Flower2 size={22} color="#1D0098" />
                                </Box>
                                <Box>
                                    <Text size="sm" fw={600} mb={4}>화초장</Text>
                                    <Text size="sm" c="dark.6" lh={1.7}>
                                        화초 밑이나 주변에 유골을 안치합니다.
                                    </Text>
                                </Box>
                            </Group>
                        </Stack>
                    </Box>

                    <Box>
                        <Text size="lg" fw={700} mb="md">자연장의 장점</Text>
                        <Stack gap="sm">
                            <Group gap="sm" align="flex-start">
                                <Check size={16} color="#1D0098" style={{ marginTop: 3 }} />
                                <Text size="sm" c="dark.6" lh={1.6}>
                                    <Text component="span" fw={600}>친환경:</Text> 자연 훼손 없이 환경을 보존합니다
                                </Text>
                            </Group>
                            <Group gap="sm" align="flex-start">
                                <Check size={16} color="#1D0098" style={{ marginTop: 3 }} />
                                <Text size="sm" c="dark.6" lh={1.6}>
                                    <Text component="span" fw={600}>경제적:</Text> 묘지 관리 부담이 적습니다
                                </Text>
                            </Group>
                            <Group gap="sm" align="flex-start">
                                <Check size={16} color="#1D0098" style={{ marginTop: 3 }} />
                                <Text size="sm" c="dark.6" lh={1.6}>
                                    <Text component="span" fw={600}>치유:</Text> 자연 속에서 고인을 추모합니다
                                </Text>
                            </Group>
                        </Stack>
                    </Box>

                    <Box
                        p="lg"
                        style={{
                            borderRadius: 16,
                            backgroundColor: '#f8f8ff',
                            border: '1px solid #e8e8ff',
                        }}
                    >
                        <Text size="sm" fw={700} c="brand" mb="sm">
                            대대손손 TIP
                        </Text>
                        <Text size="sm" c="dark.6" lh={1.8}>
                            자연장은 국립자연장지(공영)와 사설 자연장지로 나뉩니다.
                            <Text component="span" fw={600}> 대대손손에서 전국 자연장지 가격을 비교</Text>해보세요!
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
                            <Link href="/glossary/sumokjang" style={{ textDecoration: 'none' }}>
                                <Box px="md" py="xs" style={{ borderRadius: 20, backgroundColor: '#f1f3f5' }}>
                                    <Text size="xs" c="dark">수목장</Text>
                                </Box>
                            </Link>
                            <Link href="/glossary/bongandang" style={{ textDecoration: 'none' }}>
                                <Box px="md" py="xs" style={{ borderRadius: 20, backgroundColor: '#f1f3f5' }}>
                                    <Text size="xs" c="dark">봉안당</Text>
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
