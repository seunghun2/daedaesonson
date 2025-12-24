'use client';

import { Box, Text, Stack, Group, Table } from '@mantine/core';
import { ArrowLeft, Check, ChevronRight, Truck, Pickaxe, FileText } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import BottomNav from '@/components/common/BottomNav';

export default function IjangPage() {
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
                    src="/images/glossary/ijang_hero.png"
                    alt="묘지 풍경"
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
                    <Text size="xs" c="brand" fw={600} mb={4}>#4 묘지 이전</Text>
                    <Text size="xl" fw={700} mb="xs">이장과 개장</Text>
                    <Text size="sm" c="dimmed">
                        묘지를 옮기는 두 가지 방법
                    </Text>
                </Box>

                {/* 섹션들 */}
                <Stack gap="xl">
                    <Box>
                        <Text size="lg" fw={700} mb="md">이장과 개장의 차이</Text>
                        <Text size="sm" c="dark.6" lh={1.9} mb="md">
                            묘지를 옮길 때 '이장'과 '개장'이라는 용어를 자주 듣게 됩니다.
                            비슷해 보이지만 의미가 조금 다릅니다.
                        </Text>
                    </Box>

                    {/* 이장 vs 개장 */}
                    <Stack gap="md">
                        <Box bg="gray.0" p="lg" style={{ borderRadius: 16 }}>
                            <Group gap="sm" mb="md">
                                <Box
                                    style={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: 12,
                                        backgroundColor: '#1D009815',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Truck size={22} color="#1D0098" />
                                </Box>
                                <Text size="md" fw={700}>이장 (移葬)</Text>
                            </Group>
                            <Text size="sm" c="dark.6" lh={1.8}>
                                <Text component="span" fw={600}>다른 묘지로 옮겨 다시 매장</Text>하는 것입니다.
                                기존 묘에서 유골이나 시신을 수습하여 새로운 장소에 다시 묘를 만듭니다.
                                매장 형태를 그대로 유지합니다.
                            </Text>
                        </Box>

                        <Box bg="gray.0" p="lg" style={{ borderRadius: 16 }}>
                            <Group gap="sm" mb="md">
                                <Box
                                    style={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: 12,
                                        backgroundColor: '#1D009815',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Pickaxe size={22} color="#1D0098" />
                                </Box>
                                <Text size="md" fw={700}>개장 (改葬)</Text>
                            </Group>
                            <Text size="sm" c="dark.6" lh={1.8}>
                                <Text component="span" fw={600}>묘를 파서 다른 형태로 변경</Text>하는 것입니다.
                                매장된 시신이나 유골을 화장하여 봉안당, 수목장 등 다른 형태로 전환합니다.
                                현재 대부분의 묘지 이전은 개장에 해당합니다.
                            </Text>
                        </Box>
                    </Stack>

                    {/* 비교 테이블 */}
                    <Box>
                        <Text size="lg" fw={700} mb="md">비교 정리</Text>
                        <Box style={{ overflowX: 'auto' }}>
                            <Table
                                withColumnBorders
                                withTableBorder
                                style={{ fontSize: 13 }}
                            >
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th style={{ width: 80 }}>구분</Table.Th>
                                        <Table.Th>이장</Table.Th>
                                        <Table.Th>개장</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    <Table.Tr>
                                        <Table.Td fw={500}>의미</Table.Td>
                                        <Table.Td>다른 곳으로 옮김</Table.Td>
                                        <Table.Td>형태를 변경</Table.Td>
                                    </Table.Tr>
                                    <Table.Tr>
                                        <Table.Td fw={500}>결과</Table.Td>
                                        <Table.Td>새 묘지에 재매장</Table.Td>
                                        <Table.Td>화장 후 봉안/수목장</Table.Td>
                                    </Table.Tr>
                                    <Table.Tr>
                                        <Table.Td fw={500}>현황</Table.Td>
                                        <Table.Td>감소 추세</Table.Td>
                                        <Table.Td>증가 추세</Table.Td>
                                    </Table.Tr>
                                </Table.Tbody>
                            </Table>
                        </Box>
                    </Box>

                    {/* 절차 */}
                    <Box>
                        <Text size="lg" fw={700} mb="md">개장 절차</Text>

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
                                    <Text size="sm" fw={600}>개장 허가 신청</Text>
                                </Group>
                                <Text size="sm" c="dark.6" lh={1.7}>
                                    묘지 소재지 관할 읍면동 사무소에 개장 신고를 합니다.
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
                                    <Text size="sm" fw={600}>유골 수습</Text>
                                </Group>
                                <Text size="sm" c="dark.6" lh={1.7}>
                                    전문 업체를 통해 기존 묘를 파고 유골을 수습합니다.
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
                                    <Text size="sm" fw={600}>화장 진행</Text>
                                </Group>
                                <Text size="sm" c="dark.6" lh={1.7}>
                                    수습한 유골을 화장시설로 옮겨 화장합니다.
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
                                    <Text size="sm" fw={600}>새 장소에 안치</Text>
                                </Group>
                                <Text size="sm" c="dark.6" lh={1.7}>
                                    봉안당, 수목장 등 원하는 장소에 유골을 안치합니다.
                                </Text>
                            </Box>
                        </Stack>
                    </Box>

                    {/* 필요 서류 */}
                    <Box>
                        <Text size="lg" fw={700} mb="md">필요 서류</Text>
                        <Stack gap="sm">
                            <Group gap="sm" align="flex-start">
                                <FileText size={16} color="#1D0098" style={{ marginTop: 3 }} />
                                <Text size="sm" c="dark.6" lh={1.6}>
                                    개장 신고서 (읍면동 사무소 비치)
                                </Text>
                            </Group>
                            <Group gap="sm" align="flex-start">
                                <FileText size={16} color="#1D0098" style={{ marginTop: 3 }} />
                                <Text size="sm" c="dark.6" lh={1.6}>
                                    연고자 신분증 사본
                                </Text>
                            </Group>
                            <Group gap="sm" align="flex-start">
                                <FileText size={16} color="#1D0098" style={{ marginTop: 3 }} />
                                <Text size="sm" c="dark.6" lh={1.6}>
                                    묘지 사용 관련 서류 (있는 경우)
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
                            개장 후 유골을 안치할 장소를 미리 정해두시면 좋습니다.
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
                            <Link href="/glossary/hwajang" style={{ textDecoration: 'none' }}>
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
                        </Group>
                    </Box>
                </Stack>
            </Box>

            <BottomNav />
        </Box>
    );
}
