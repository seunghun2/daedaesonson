'use client';

import { useState, useEffect } from 'react';
import { SimpleGrid, Paper, Group, Text, ThemeIcon, Table, Badge, Card, RingProgress, Center, LoadingOverlay, Stack } from '@mantine/core';
import { Database, TrendingUp, UserCheck, AlertCircle, PhoneCall, MessageCircle, Star, Briefcase } from 'lucide-react';
import { FACILITY_CATEGORY_LABELS, Facility } from '@/types';

interface DashboardData {
    facilities: Facility[];
    membersCount: number;
    consultsCount: number;
    inquiriesCount: number;
    reviewsCount: number;
    correctionsCount: number;
    partnershipCount: number;
}

export default function AdminDashboard() {
    const [data, setData] = useState<DashboardData>({
        facilities: [],
        membersCount: 0,
        consultsCount: 0,
        inquiriesCount: 0,
        reviewsCount: 0,
        correctionsCount: 0,
        partnershipCount: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAll() {
            try {
                const [
                    facilitiesRes,
                    membersRes,
                    consultsRes,
                    inquiriesRes,
                    reviewsRes,
                    correctionsRes,
                    partnershipRes,
                ] = await Promise.all([
                    fetch('/api/facilities').then(r => r.ok ? r.json() : []),
                    fetch('/api/admin/members').then(r => r.ok ? r.json() : []),
                    fetch('/api/consult').then(r => r.ok ? r.json() : { consults: [] }),
                    fetch('/api/admin/inquiries/count').then(r => r.ok ? r.json() : { count: 0 }),
                    fetch('/api/admin/reviews').then(r => r.ok ? r.json() : { reviews: [] }),
                    fetch('/api/corrections').then(r => r.ok ? r.json() : { data: [] }),
                    fetch('/api/partnership').then(r => r.ok ? r.json() : { inquiries: [] }),
                ]);

                setData({
                    facilities: Array.isArray(facilitiesRes) ? facilitiesRes : [],
                    membersCount: Array.isArray(membersRes) ? membersRes.length : 0,
                    consultsCount: consultsRes?.consults?.length ?? 0,
                    inquiriesCount: inquiriesRes?.count ?? 0,
                    reviewsCount: reviewsRes?.reviews?.length ?? 0,
                    correctionsCount: correctionsRes?.data?.length ?? 0,
                    partnershipCount: partnershipRes?.inquiries?.length ?? 0,
                });
            } catch (e) {
                console.error('Dashboard fetch error:', e);
            } finally {
                setLoading(false);
            }
        }
        fetchAll();
    }, []);

    const { facilities, membersCount, consultsCount, inquiriesCount, reviewsCount, correctionsCount, partnershipCount } = data;
    const totalCount = facilities.length;

    // 최근 등록 시설
    const recentItems = [...facilities].slice(0, 5);

    // 카테고리 통계
    const categoryCounts = facilities.reduce((acc, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const getPercent = (count: number) => totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;

    const charnelCount = categoryCounts['CHARNEL_HOUSE'] || 0;
    const naturalCount = categoryCounts['NATURAL_BURIAL'] || 0;
    const parkCount = categoryCounts['FAMILY_GRAVE'] || 0;
    const otherCount = totalCount - (charnelCount + naturalCount + parkCount);

    const stats = [
        { title: '총 등록 시설', value: totalCount.toLocaleString(), icon: Database, color: 'blue' },
        { title: '가입 회원', value: membersCount.toLocaleString(), icon: UserCheck, color: 'grape' },
        { title: '상담 신청', value: consultsCount.toLocaleString(), icon: PhoneCall, color: 'teal' },
        { title: '수정 요청', value: correctionsCount.toLocaleString(), icon: AlertCircle, color: 'red' },
        { title: '댓글 문의', value: inquiriesCount.toLocaleString(), icon: MessageCircle, color: 'cyan' },
        { title: '방문 후기', value: reviewsCount.toLocaleString(), icon: Star, color: 'yellow' },
        { title: '제휴 문의', value: partnershipCount.toLocaleString(), icon: Briefcase, color: 'indigo' },
    ];

    if (loading) return <LoadingOverlay visible />;

    return (
        <div>
            <Text size="xl" fw={800} mb="lg">대시보드</Text>

            {/* 상단 통계 카드 */}
            <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} mb="lg">
                {stats.map((stat) => (
                    <Paper withBorder p="md" radius="md" key={stat.title}>
                        <Group justify="space-between">
                            <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                                {stat.title}
                            </Text>
                            <ThemeIcon color={stat.color} variant="light" size="sm">
                                <stat.icon size={16} />
                            </ThemeIcon>
                        </Group>

                        <Text size="2xl" fw={700} lh={1} mt={25}>
                            {stat.value}
                        </Text>

                        <Text size="xs" c="dimmed" mt={7}>
                            실시간
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
