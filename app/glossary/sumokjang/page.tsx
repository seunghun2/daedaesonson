'use client';

import { Box, Text, Stack, Group, Divider, Table } from '@mantine/core';
import { ArrowLeft, Check, ChevronRight, TreePine, Leaf, Clock } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import BottomNav from '@/components/common/BottomNav';

export default function SumokjangPage() {
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
                    src="/images/glossary/sumokjang_hero.png"
                    alt="수목장 숲 사진"
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
                {/* 제목 */}
                <Box
                    bg="white"
                    p="md"
                    mb="lg"
                    style={{
                        borderRadius: 16,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    }}
                >
                    <Text size="xs" c="brand" fw={600} mb={4}>#2 장지 유형</Text>
                    <Text size="xl" fw={700} mb="xs">수목장</Text>
                    <Text size="sm" c="dimmed">
                        나무와 함께 자연으로 돌아가는 친환경 장법
                    </Text>
                </Box>

                {/* 섹션들 */}
                <Stack gap="xl">
                    <Box>
                        <Text size="lg" fw={700} mb="md">수목장이란?</Text>
                        <Text size="sm" c="dark.6" lh={1.9} mb="md">
                            수목장은 <Text component="span" fw={600}>화장 후 유골을 나무 밑이나 주변에 묻는 친환경 장법</Text>입니다.
                            자연의 일부인 나무를 고인의 상징으로 삼아, 자연과 함께 상생하는 숭고한 방법으로 여겨집니다.
                        </Text>
                        <Text size="sm" c="dark.6" lh={1.9}>
                            스위스에서 시작되어 유럽 전역으로 퍼졌으며, 한국에서도 환경을 생각하는
                            현대적인 장례 문화로 주목받고 있습니다. 후손들에게 아름다운 자연을 물려주면서
                            고인을 추모할 수 있는 장점이 있습니다.
                        </Text>
                    </Box>

                    {/* 중간 이미지 */}
                    <Box style={{ borderRadius: 16, overflow: 'hidden' }}>
                        <Image
                            src="/images/glossary/sumokjang_section.png"
                            alt="수목장 나무 사진"
                            width={400}
                            height={200}
                            style={{ width: '100%', height: 'auto' }}
                        />
                    </Box>

                    {/* 수목장 절차 */}
                    <Box>
                        <Text size="lg" fw={700} mb="md">수목장 절차</Text>
                        <Text size="sm" c="dark.6" lh={1.9} mb="lg">
                            수목장은 다음과 같은 절차로 진행됩니다.
                        </Text>

                        <Stack gap="md">
                            <Box bg="gray.0" p="md" style={{ borderRadius: 12 }}>
                                <Group gap="sm" mb="xs">
                                    <Box
                                        style={{
                                            width: 28,
                                            height: 28,
                                            borderRadius: 8,
                                            backgroundColor: '#1D009815',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <Text size="xs" fw={700} c="brand">1</Text>
                                    </Box>
                                    <Text size="sm" fw={600}>화장</Text>
                                </Group>
                                <Text size="sm" c="dark.6" lh={1.7}>
                                    먼저 화장을 진행하여 유골(골분)을 수습합니다.
                                </Text>
                            </Box>

                            <Box bg="gray.0" p="md" style={{ borderRadius: 12 }}>
                                <Group gap="sm" mb="xs">
                                    <Box
                                        style={{
                                            width: 28,
                                            height: 28,
                                            borderRadius: 8,
                                            backgroundColor: '#1D009815',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <Text size="xs" fw={700} c="brand">2</Text>
                                    </Box>
                                    <Text size="sm" fw={600}>생분해 용기에 담기</Text>
                                </Group>
                                <Text size="sm" c="dark.6" lh={1.7}>
                                    유골을 자연분해되는 친환경 용기에 담습니다.
                                    용기 없이 흙과 섞어 안치하기도 합니다.
                                </Text>
                            </Box>

                            <Box bg="gray.0" p="md" style={{ borderRadius: 12 }}>
                                <Group gap="sm" mb="xs">
                                    <Box
                                        style={{
                                            width: 28,
                                            height: 28,
                                            borderRadius: 8,
                                            backgroundColor: '#1D009815',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <Text size="xs" fw={700} c="brand">3</Text>
                                    </Box>
                                    <Text size="sm" fw={600}>나무 밑에 안치</Text>
                                </Group>
                                <Text size="sm" c="dark.6" lh={1.7}>
                                    30~50cm 깊이로 땅을 파서 유골을 안치하고,
                                    나무에 고인의 이름이 새겨진 표지를 설치합니다.
                                </Text>
                            </Box>
                        </Stack>
                    </Box>

                    {/* 수목장 유형 */}
                    <Box>
                        <Text size="lg" fw={700} mb="md">수목장 유형</Text>

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
                                    <Text size="sm" fw={600} mb={4}>개인목</Text>
                                    <Text size="sm" c="dark.6" lh={1.7}>
                                        한 분만을 위한 전용 나무입니다.
                                        가장 프라이빗한 형태입니다.
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
                                    <Text size="sm" fw={600} mb={4}>부부목 / 가족목</Text>
                                    <Text size="sm" c="dark.6" lh={1.7}>
                                        부부나 가족이 함께 한 나무 아래에 영면할 수 있습니다.
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
                                    <Clock size={22} color="#1D0098" />
                                </Box>
                                <Box>
                                    <Text size="sm" fw={600} mb={4}>공동목</Text>
                                    <Text size="sm" c="dark.6" lh={1.7}>
                                        여러 분이 한 나무 주변에 함께 안치됩니다.
                                        비용이 가장 저렴합니다.
                                    </Text>
                                </Box>
                            </Group>
                        </Stack>
                    </Box>

                    {/* 장점 */}
                    <Box>
                        <Text size="lg" fw={700} mb="md">수목장의 장점</Text>
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
                                    <Text component="span" fw={600}>영구적:</Text> 기간 제한 없이 이용 가능한 곳이 많습니다
                                </Text>
                            </Group>
                            <Group gap="sm" align="flex-start">
                                <Check size={16} color="#1D0098" style={{ marginTop: 3 }} />
                                <Text size="sm" c="dark.6" lh={1.6}>
                                    <Text component="span" fw={600}>치유:</Text> 숲에서 고인을 추모하며 마음의 위안을 얻습니다
                                </Text>
                            </Group>
                            <Group gap="sm" align="flex-start">
                                <Check size={16} color="#1D0098" style={{ marginTop: 3 }} />
                                <Text size="sm" c="dark.6" lh={1.6}>
                                    <Text component="span" fw={600}>경제적:</Text> 묘지 관리 부담이 적습니다
                                </Text>
                            </Group>
                        </Stack>
                    </Box>

                    {/* 팁 박스 */}
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
                            수목장은 국립수목장림(공영)과 사설 수목장으로 나뉩니다.
                            국립수목장림은 비용이 저렴하지만 대기 기간이 있을 수 있어요.
                            <Text component="span" fw={600}>대대손손에서 전국 수목장 가격을 비교</Text>해보세요!
                        </Text>
                        <Link href="/">
                            <Group gap={4} mt="md">
                                <Text size="sm" fw={600} c="brand">수목장 가격 비교하기</Text>
                                <ChevronRight size={16} color="#1D0098" />
                            </Group>
                        </Link>
                    </Box>

                    {/* 다른 용어 보기 */}
                    <Box>
                        <Text size="sm" fw={600} mb="md">다른 용어도 알아보세요</Text>
                        <Group gap="xs">
                            <Link href="/glossary/bongandang" style={{ textDecoration: 'none' }}>
                                <Box
                                    px="md"
                                    py="xs"
                                    style={{
                                        borderRadius: 20,
                                        backgroundColor: '#f1f3f5',
                                    }}
                                >
                                    <Text size="xs" c="dark">봉안당</Text>
                                </Box>
                            </Link>
                            <Link href="/glossary" style={{ textDecoration: 'none' }}>
                                <Box
                                    px="md"
                                    py="xs"
                                    style={{
                                        borderRadius: 20,
                                        backgroundColor: '#f1f3f5',
                                    }}
                                >
                                    <Text size="xs" c="dark">공원묘지</Text>
                                </Box>
                            </Link>
                            <Link href="/glossary" style={{ textDecoration: 'none' }}>
                                <Box
                                    px="md"
                                    py="xs"
                                    style={{
                                        borderRadius: 20,
                                        backgroundColor: '#f1f3f5',
                                    }}
                                >
                                    <Text size="xs" c="dark">자연장</Text>
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
