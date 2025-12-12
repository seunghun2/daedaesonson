'use client';

import { useState, useEffect } from 'react';
import { SimpleGrid, Paper, Group, Text, ThemeIcon, Table, Badge, Card, RingProgress, Center, LoadingOverlay } from '@mantine/core';
import { Database, TrendingUp, UserCheck, AlertCircle } from 'lucide-react';
import { FACILITY_CATEGORY_LABELS, Facility } from '@/types';

export default function AdminDashboard() {
    const [data, setData] = useState<Facility[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch('/api/facilities');
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const totalCount = data.length;
    // 최근 등록 순 (API가 최신순 정렬이라 가정하거나 클라이언트 정렬)
    const recentItems = [...data].slice(0, 5);

    // 카테고리 통계 계산
    const categoryCounts = data.reduce((acc, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const getPercent = (count: number) => totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;

    const charnelCount = categoryCounts['CHARNEL_HOUSE'] || 0;
    const naturalCount = categoryCounts['NATURAL_BURIAL'] || 0;
    const parkCount = categoryCounts['FAMILY_GRAVE'] || 0;
    const otherCount = totalCount - (charnelCount + naturalCount + parkCount);

    const stats = [
        { title: '총 등록 시설', value: totalCount.toLocaleString(), icon: Database, color: 'blue', diff: 12 },
        { title: '이번 달 조회수', value: '42,910', icon: TrendingUp, color: 'teal', diff: 5.4 },
        { title: '활성 사용자', value: '1,290', icon: UserCheck, color: 'grape', diff: -2.1 },
        { title: '신고/수정 요청', value: '3', icon: AlertCircle, color: 'red', diff: 0 },
    ];

    if (loading) return <LoadingOverlay visible />;

    return (
        <div>
            <Text size="xl" fw={800} mb="lg">대시보드</Text>

            {/* 상단 통계 카드 */}
            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} mb="lg">
                {stats.map((stat) => (
                    <Paper withBorder p="md" radius="md" key={stat.title}>
                        <Group justify="space-between">
                            <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                                {stat.title}
                            </Text>
                            <ThemeIcon color="gray" variant="light" size="sm">
                                <stat.icon size={16} />
                            </ThemeIcon>
                        </Group>

                        <Group align="flex-end" gap="xs" mt={25}>
                            <Text size="2xl" fw={700} lh={1}>
                                {stat.value}
                            </Text>
                            <Text c={stat.diff > 0 ? 'teal' : 'red'} size="sm" fw={700} fz="xs">
                                <span>{stat.diff > 0 ? '+' : ''}{stat.diff}%</span>
                            </Text>
                        </Group>

                        <Text size="xs" c="dimmed" mt={7}>
                            지난 달 대비
                        </Text>
                    </Paper>
                ))}
            </SimpleGrid>

            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                {/* 최근 등록 시설 */}
                <Card withBorder radius="md">
                    <Card.Section withBorder inheritPadding py="xs">
                        <Group justify="space-between">
                            <Text fw={700}>최근 등록/수정된 시설</Text>
                            <Badge>Live</Badge>
                        </Group>
                    </Card.Section>
                    <Table mt="sm">
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>시설명</Table.Th>
                                <Table.Th>카테고리</Table.Th>
                                <Table.Th>평점</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {recentItems.map((item) => (
                                <Table.Tr key={item.id}>
                                    <Table.Td>{item.name}</Table.Td>
                                    <Table.Td>
                                        <Badge size="xs" variant="dot" color="gray">
                                            {FACILITY_CATEGORY_LABELS[item.category] || item.category}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>⭐ {item.rating}</Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                </Card>

                {/* 카테고리 현황 (RingProgress) */}
                <Card withBorder radius="md">
                    <Card.Section withBorder inheritPadding py="xs">
                        <Text fw={700}>카테고리별 비중</Text>
                    </Card.Section>
                    <Center py="xl">
                        <Group>
                            <RingProgress
                                size={180}
                                thickness={16}
                                roundCaps
                                sections={[
                                    { value: getPercent(charnelCount), color: 'blue', tooltip: '봉안당' },
                                    { value: getPercent(naturalCount), color: 'teal', tooltip: '수목장' },
                                    { value: getPercent(parkCount), color: 'grape', tooltip: '가족묘' },
                                    { value: getPercent(otherCount), color: 'gray', tooltip: '기타' },
                                ]}
                                label={
                                    <Center>
                                        <Text fw={900} size="xl">100%</Text>
                                    </Center>
                                }
                            />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <Group gap="xs"><Badge color="blue" variant="dot" /> 봉안당 ({getPercent(charnelCount)}%)</Group>
                                <Group gap="xs"><Badge color="teal" variant="dot" /> 수목장 ({getPercent(naturalCount)}%)</Group>
                                <Group gap="xs"><Badge color="grape" variant="dot" /> 공원묘지 ({getPercent(parkCount)}%)</Group>
                                <Group gap="xs"><Badge color="gray" variant="dot" /> 기타 ({getPercent(otherCount)}%)</Group>
                            </div>
                        </Group>
                    </Center>
                </Card>
            </SimpleGrid>
        </div>
    );
}
