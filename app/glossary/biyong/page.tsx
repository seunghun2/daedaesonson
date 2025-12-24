'use client';

import { Box, Text, Stack, Group, Table } from '@mantine/core';
import { ArrowLeft, ChevronRight, Wallet, FileText, Clock, Infinity } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import BottomNav from '@/components/common/BottomNav';

export default function BiyongPage() {
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
                    src="/images/glossary/biyong_hero.png"
                    alt="상담 데스크"
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
                    <Text size="xs" c="brand" fw={600} mb={4}>#5 비용</Text>
                    <Text size="xl" fw={700} mb="xs">장묘 비용 안내</Text>
                    <Text size="sm" c="dimmed">
                        사용료, 관리비, 영구사용 등 비용 용어 정리
                    </Text>
                </Box>

                {/* 섹션들 */}
                <Stack gap="xl">
                    <Box>
                        <Text size="lg" fw={700} mb="md">장묘 비용의 구성</Text>
                        <Text size="sm" c="dark.6" lh={1.9}>
                            장묘시설을 이용할 때는 크게 <Text component="span" fw={600}>사용료</Text>와
                            <Text component="span" fw={600}> 관리비</Text>가 발생합니다.
                            시설마다 비용 구조가 다르므로 미리 확인하는 것이 좋습니다.
                        </Text>
                    </Box>

                    {/* 비용 종류 */}
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
                                    <Wallet size={22} color="#1D0098" />
                                </Box>
                                <Text size="md" fw={700}>사용료</Text>
                            </Group>
                            <Text size="sm" c="dark.6" lh={1.8}>
                                <Text component="span" fw={600}>안치 공간을 확보하기 위해 처음에 납부하는 비용</Text>입니다.
                                봉안당의 안치 공간, 수목장의 나무 사용권 등을 구입하는 초기 비용입니다.
                                시설, 위치, 유형에 따라 수십만 원에서 수천만 원까지 다양합니다.
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
                                    <FileText size={22} color="#1D0098" />
                                </Box>
                                <Text size="md" fw={700}>관리비</Text>
                            </Group>
                            <Text size="sm" c="dark.6" lh={1.8}>
                                <Text component="span" fw={600}>시설 유지관리를 위해 정기적으로 납부하는 비용</Text>입니다.
                                청소, 조경, 시설 유지보수 등에 사용됩니다.
                                연간 또는 일정 기간 단위로 부과되며, 몇만 원 수준입니다.
                            </Text>
                        </Box>
                    </Stack>

                    {/* 사용 기간 */}
                    <Box>
                        <Text size="lg" fw={700} mb="md">사용 기간</Text>

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
                                        <Infinity size={22} color="#1D0098" />
                                    </Box>
                                    <Text size="md" fw={700}>영구사용</Text>
                                </Group>
                                <Text size="sm" c="dark.6" lh={1.8}>
                                    <Text component="span" fw={600}>기간 제한 없이 시설을 계속 사용</Text>할 수 있습니다.
                                    초기 비용이 높지만, 추가 갱신 비용이 없어 장기적으로 경제적일 수 있습니다.
                                    일부 시설에서만 제공합니다.
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
                                        <Clock size={22} color="#1D0098" />
                                    </Box>
                                    <Text size="md" fw={700}>기간제</Text>
                                </Group>
                                <Text size="sm" c="dark.6" lh={1.8}>
                                    <Text component="span" fw={600}>15년, 30년 등 일정 기간 사용 후 재계약</Text>하는 방식입니다.
                                    영구사용보다 초기 비용이 저렴합니다.
                                    기간 만료 시 연장하거나 다른 시설로 이전할 수 있습니다.
                                </Text>
                            </Box>
                        </Stack>
                    </Box>

                    {/* 비교 테이블 */}
                    <Box>
                        <Text size="lg" fw={700} mb="md">영구사용 vs 기간제 비교</Text>
                        <Box style={{ overflowX: 'auto' }}>
                            <Table
                                withColumnBorders
                                withTableBorder
                                style={{ fontSize: 13 }}
                            >
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th style={{ width: 80 }}>구분</Table.Th>
                                        <Table.Th>영구사용</Table.Th>
                                        <Table.Th>기간제</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    <Table.Tr>
                                        <Table.Td fw={500}>초기비용</Table.Td>
                                        <Table.Td>높음</Table.Td>
                                        <Table.Td>낮음</Table.Td>
                                    </Table.Tr>
                                    <Table.Tr>
                                        <Table.Td fw={500}>갱신</Table.Td>
                                        <Table.Td>없음</Table.Td>
                                        <Table.Td>기간마다 필요</Table.Td>
                                    </Table.Tr>
                                    <Table.Tr>
                                        <Table.Td fw={500}>장기비용</Table.Td>
                                        <Table.Td>경제적</Table.Td>
                                        <Table.Td>갱신비 추가</Table.Td>
                                    </Table.Tr>
                                    <Table.Tr>
                                        <Table.Td fw={500}>유연성</Table.Td>
                                        <Table.Td>고정</Table.Td>
                                        <Table.Td>이전 가능</Table.Td>
                                    </Table.Tr>
                                </Table.Tbody>
                            </Table>
                        </Box>
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
                            같은 유형의 시설이라도 위치와 시설 수준에 따라 가격 차이가 큽니다.
                            <Text component="span" fw={600}> 대대손손에서 전국 시설 가격을 한눈에 비교</Text>해보세요!
                        </Text>
                        <Link href="/">
                            <Group gap={4} mt="md">
                                <Text size="sm" fw={600} c="brand">가격 비교하기</Text>
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
                        </Group>
                    </Box>
                </Stack>
            </Box>

            <BottomNav />
        </Box>
    );
}
