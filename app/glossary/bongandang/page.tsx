'use client';

import { Box, Text, Stack, Group, Divider, Table } from '@mantine/core';
import { ArrowLeft, Check, ChevronRight, MapPin, Clock, Banknote } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import BottomNav from '@/components/common/BottomNav';

export default function BongandangPage() {
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
                    src="/images/glossary/bongandang_hero.png"
                    alt="봉안당 일러스트"
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
                    <Text size="xs" c="brand" fw={600} mb={4}>#1 장지 유형</Text>
                    <Text size="xl" fw={700} mb="xs">봉안당</Text>
                    <Text size="sm" c="dimmed">
                        화장 후 유골을 안전하게 모시는 현대적인 추모 공간
                    </Text>
                </Box>

                {/* 섹션 1: 정의 */}
                <Stack gap="xl">
                    <Box>
                        <Text size="lg" fw={700} mb="md">봉안당이란?</Text>
                        <Text size="sm" c="dark.6" lh={1.9} mb="md">
                            봉안당은 <Text component="span" fw={600}>화장 후 유골을 봉안함에 담아 모시는 실내 시설</Text>입니다.
                            '납골당'이라고도 불리며, 현대 장례 문화에서 가장 많이 선택되는 안치 방식 중 하나입니다.
                        </Text>
                        <Text size="sm" c="dark.6" lh={1.9}>
                            실내에 위치하기 때문에 <Text component="span" fw={600}>날씨에 관계없이 언제든 참배</Text>할 수 있고,
                            깨끗하고 정돈된 환경에서 고인을 추모할 수 있습니다.
                            전국적으로 공영 봉안당과 사설 봉안당이 운영되고 있으며,
                            시설의 규모와 서비스 수준에 따라 다양한 선택지가 있습니다.
                        </Text>
                    </Box>

                    {/* 중간 이미지 */}
                    <Box style={{ borderRadius: 16, overflow: 'hidden' }}>
                        <Image
                            src="/images/glossary/bongandang_section.png"
                            alt="봉안당 참배 일러스트"
                            width={400}
                            height={200}
                            style={{ width: '100%', height: 'auto' }}
                        />
                    </Box>

                    {/* 섹션 2: 종류 */}
                    <Box>
                        <Text size="lg" fw={700} mb="md">봉안당의 종류</Text>
                        <Text size="sm" c="dark.6" lh={1.9} mb="lg">
                            봉안당은 안치하는 분의 수에 따라 여러 종류로 나뉩니다.
                            가족 상황과 예산에 맞는 유형을 선택하시면 됩니다.
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
                                    <Text size="sm" fw={600}>개인형 (1인)</Text>
                                </Group>
                                <Text size="sm" c="dark.6" lh={1.7}>
                                    한 분만을 위한 단독 안치 공간입니다. 가장 기본적인 형태로,
                                    비용이 가장 저렴합니다.
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
                                    <Text size="sm" fw={600}>부부형 (2인)</Text>
                                </Group>
                                <Text size="sm" c="dark.6" lh={1.7}>
                                    부부 두 분을 함께 모시는 공간입니다. 합장의 의미를 담아
                                    부부가 나란히 영면하실 수 있습니다.
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
                                        <Text size="xs" fw={700} c="brand">3+</Text>
                                    </Box>
                                    <Text size="sm" fw={600}>가족형 (3인 이상)</Text>
                                </Group>
                                <Text size="sm" c="dark.6" lh={1.7}>
                                    조부모님부터 부모님까지 가족 여러 분을 함께 모시는 공간입니다.
                                    한 곳에서 참배할 수 있어 편리합니다.
                                </Text>
                            </Box>
                        </Stack>
                    </Box>

                    {/* 섹션 3: 공영 vs 사설 */}
                    <Box>
                        <Text size="lg" fw={700} mb="md">공영 봉안당 vs 사설 봉안당</Text>

                        <Box style={{ overflowX: 'auto' }}>
                            <Table
                                withColumnBorders
                                withTableBorder
                                style={{ fontSize: 13 }}
                            >
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th style={{ width: 80 }}>구분</Table.Th>
                                        <Table.Th>공영</Table.Th>
                                        <Table.Th>사설</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    <Table.Tr>
                                        <Table.Td fw={500}>운영</Table.Td>
                                        <Table.Td>지자체</Table.Td>
                                        <Table.Td>민간 기업</Table.Td>
                                    </Table.Tr>
                                    <Table.Tr>
                                        <Table.Td fw={500}>비용</Table.Td>
                                        <Table.Td>저렴</Table.Td>
                                        <Table.Td>다양 (시설별 차이)</Table.Td>
                                    </Table.Tr>
                                    <Table.Tr>
                                        <Table.Td fw={500}>대기</Table.Td>
                                        <Table.Td>대기 기간 있음</Table.Td>
                                        <Table.Td>바로 이용 가능</Table.Td>
                                    </Table.Tr>
                                    <Table.Tr>
                                        <Table.Td fw={500}>시설</Table.Td>
                                        <Table.Td>기본적</Table.Td>
                                        <Table.Td>고급 시설 많음</Table.Td>
                                    </Table.Tr>
                                </Table.Tbody>
                            </Table>
                        </Box>
                    </Box>

                    {/* 섹션 4: 비용 */}
                    <Box>
                        <Text size="lg" fw={700} mb="md">봉안당 이용 비용</Text>
                        <Text size="sm" c="dark.6" lh={1.9} mb="lg">
                            봉안당 이용 시에는 크게 두 가지 비용이 발생합니다.
                        </Text>

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
                                    <Banknote size={22} color="#1D0098" />
                                </Box>
                                <Box>
                                    <Text size="sm" fw={600} mb={4}>사용료 (초기 비용)</Text>
                                    <Text size="sm" c="dark.6" lh={1.7}>
                                        안치 공간을 확보하기 위해 처음에 납부하는 비용입니다.
                                        시설과 위치에 따라 수십만 원에서 수백만 원까지 다양합니다.
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
                                    <Text size="sm" fw={600} mb={4}>관리비 (정기 비용)</Text>
                                    <Text size="sm" c="dark.6" lh={1.7}>
                                        시설 유지관리를 위해 정기적으로 납부하는 비용입니다.
                                        연간 몇만 원 수준이며, 시설에 따라 다릅니다.
                                    </Text>
                                </Box>
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
                            공영 봉안당은 사설보다 저렴하지만 대기 기간이 있을 수 있어요.
                            급하게 결정하지 마시고, <Text component="span" fw={600}>대대손손에서 전국 봉안당 가격을 미리 비교</Text>해보세요.
                            위치, 시설, 비용을 한눈에 확인할 수 있습니다.
                        </Text>
                        <Link href="/">
                            <Group gap={4} mt="md">
                                <Text size="sm" fw={600} c="brand">봉안당 가격 비교하기</Text>
                                <ChevronRight size={16} color="#1D0098" />
                            </Group>
                        </Link>
                    </Box>

                    {/* 다른 용어 보기 */}
                    <Box>
                        <Text size="sm" fw={600} mb="md">다른 용어도 알아보세요</Text>
                        <Group gap="xs">
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
                                    <Text size="xs" c="dark">화장</Text>
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
