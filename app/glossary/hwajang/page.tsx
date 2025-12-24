'use client';

import { Box, Text, Stack, Group, Table } from '@mantine/core';
import { ArrowLeft, Check, ChevronRight, Clock, MapPin, Phone } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import BottomNav from '@/components/common/BottomNav';

export default function HwajangPage() {
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
                    src="/images/glossary/hwajang_hero.png"
                    alt="화장시설 외관"
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
                    <Text size="xs" c="brand" fw={600} mb={4}>#3 장례 절차</Text>
                    <Text size="xl" fw={700} mb="xs">화장</Text>
                    <Text size="sm" c="dimmed">
                        현대 장례의 첫 단계, 시신을 유골로
                    </Text>
                </Box>

                {/* 섹션들 */}
                <Stack gap="xl">
                    <Box>
                        <Text size="lg" fw={700} mb="md">화장이란?</Text>
                        <Text size="sm" c="dark.6" lh={1.9} mb="md">
                            화장은 <Text component="span" fw={600}>시신을 화장시설(승화원)에서 고온으로 처리하여 유골로 만드는 장법</Text>입니다.
                            한국에서는 '승화원', '화장장', '화장시설' 등으로 불립니다.
                        </Text>
                        <Text size="sm" c="dark.6" lh={1.9}>
                            과거에는 매장이 주류였지만, 현재는 <Text component="span" fw={600}>화장률이 90%를 넘어</Text>
                            가장 보편적인 장례 방식이 되었습니다. 화장 후에는 봉안당, 수목장, 산골 등
                            다양한 방식으로 유골을 안치하거나 자연으로 돌려보낼 수 있습니다.
                        </Text>
                    </Box>

                    {/* 중간 이미지 */}
                    <Box style={{ borderRadius: 16, overflow: 'hidden' }}>
                        <Image
                            src="/images/glossary/hwajang_section.png"
                            alt="화장시설 대기실"
                            width={400}
                            height={200}
                            style={{ width: '100%', height: 'auto' }}
                        />
                    </Box>

                    {/* 화장 절차 */}
                    <Box>
                        <Text size="lg" fw={700} mb="md">화장 절차</Text>

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
                                    <Text size="sm" fw={600}>화장 예약</Text>
                                </Group>
                                <Text size="sm" c="dark.6" lh={1.7}>
                                    장례식장 또는 직접 화장시설에 연락하여 예약합니다.
                                    공영 시설은 예약이 빨리 차는 경우가 있습니다.
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
                                    <Text size="sm" fw={600}>시설 도착 및 접수</Text>
                                </Group>
                                <Text size="sm" c="dark.6" lh={1.7}>
                                    예약 시간에 맞춰 시설에 도착하여 접수합니다.
                                    사망진단서와 신분증이 필요합니다.
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
                                    <Text size="sm" fw={600}>입관 및 화장</Text>
                                </Group>
                                <Text size="sm" c="dark.6" lh={1.7}>
                                    관을 화장로에 입관하고 화장이 진행됩니다.
                                    약 1~2시간 정도 소요됩니다.
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
                                        <Text size="xs" fw={700} c="brand">4</Text>
                                    </Box>
                                    <Text size="sm" fw={600}>유골 인수</Text>
                                </Group>
                                <Text size="sm" c="dark.6" lh={1.7}>
                                    화장이 완료되면 유골(골분)을 봉안함에 담아 인수합니다.
                                </Text>
                            </Box>
                        </Stack>
                    </Box>

                    {/* 소요 시간 및 비용 */}
                    <Box>
                        <Text size="lg" fw={700} mb="md">소요 시간 및 비용</Text>

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
                                    <Clock size={22} color="#1D0098" />
                                </Box>
                                <Box>
                                    <Text size="sm" fw={600} mb={4}>소요 시간</Text>
                                    <Text size="sm" c="dark.6" lh={1.7}>
                                        화장 자체는 약 1~2시간,
                                        전체 과정(접수~인수)은 3~4시간 정도 소요됩니다.
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
                                    <MapPin size={22} color="#1D0098" />
                                </Box>
                                <Box>
                                    <Text size="sm" fw={600} mb={4}>비용</Text>
                                    <Text size="sm" c="dark.6" lh={1.7}>
                                        공영 시설: 약 5~15만원<br />
                                        사설 시설: 약 20~50만원
                                    </Text>
                                </Box>
                            </Group>
                        </Stack>
                    </Box>

                    {/* 화장 후 선택 */}
                    <Box>
                        <Text size="lg" fw={700} mb="md">화장 후 유골 안치 방법</Text>
                        <Stack gap="sm">
                            <Group gap="sm" align="flex-start">
                                <Check size={16} color="#1D0098" style={{ marginTop: 3 }} />
                                <Text size="sm" c="dark.6" lh={1.6}>
                                    <Text component="span" fw={600}>봉안당:</Text> 실내 시설에 유골을 안치
                                </Text>
                            </Group>
                            <Group gap="sm" align="flex-start">
                                <Check size={16} color="#1D0098" style={{ marginTop: 3 }} />
                                <Text size="sm" c="dark.6" lh={1.6}>
                                    <Text component="span" fw={600}>수목장:</Text> 나무 아래에 유골을 안치
                                </Text>
                            </Group>
                            <Group gap="sm" align="flex-start">
                                <Check size={16} color="#1D0098" style={{ marginTop: 3 }} />
                                <Text size="sm" c="dark.6" lh={1.6}>
                                    <Text component="span" fw={600}>산골:</Text> 바다나 산 등에 유골을 뿌림
                                </Text>
                            </Group>
                            <Group gap="sm" align="flex-start">
                                <Check size={16} color="#1D0098" style={{ marginTop: 3 }} />
                                <Text size="sm" c="dark.6" lh={1.6}>
                                    <Text component="span" fw={600}>봉안묘:</Text> 묘지 형태로 유골을 안치
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
                            화장 후 유골을 어디에 안치할지 미리 결정해두시면 좋습니다.
                            <Text component="span" fw={600}>대대손손에서 봉안당, 수목장 가격을 비교</Text>해보세요!
                        </Text>
                        <Link href="/">
                            <Group gap={4} mt="md">
                                <Text size="sm" fw={600} c="brand">안치 시설 비교하기</Text>
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
                            <Link href="/glossary/sumokjang" style={{ textDecoration: 'none' }}>
                                <Box
                                    px="md"
                                    py="xs"
                                    style={{
                                        borderRadius: 20,
                                        backgroundColor: '#f1f3f5',
                                    }}
                                >
                                    <Text size="xs" c="dark">수목장</Text>
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
                                    <Text size="xs" c="dark">봉안함</Text>
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
