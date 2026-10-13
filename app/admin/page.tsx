'use client';

import { useState, useEffect } from 'react';
import {
    SimpleGrid, Paper, Group, Text, ThemeIcon, Table, Badge, Card,
    RingProgress, Center, LoadingOverlay, Stack, ScrollArea, Button, Progress, Box
} from '@mantine/core';
import {
    Database, UserCheck, AlertCircle, PhoneCall, MessageCircle, Star,
    Briefcase, ShieldCheck, AlertTriangle, PhoneOff, ImageOff, DollarSign,
    ArrowRight, ExternalLink, CheckCircle2, Bell
} from 'lucide-react';
import { FACILITY_CATEGORY_LABELS, FacilityCategory } from '@/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface DashboardStats {
    totalFacilities: number;
    membersCount: number;
    consultsCount: number;
    inquiriesCount: number;
    reviewsCount: number;
    correctionsCount: number;
    partnershipCount: number;
}

interface PendingCounts {
    inquiriesUnanswered?: number;
    inquiries?: number;
    unansweredInquiries?: number;
    pendingInquiries?: number;
    consultsPending?: number;
    consults?: number;
    pendingConsults?: number;
    correctionsPending?: number;
    corrections?: number;
    pendingCorrections?: number;
    partnershipPending?: number;
    partnership?: number;
    partnerships?: number;
    pendingPartnership?: number;
    pendingPartnerships?: number;
}

interface IssueFacilityItem {
    id: string;
    name: string;
    category?: string;
    address?: string;
    issueType?: string;
    detail?: string;
    issues?: string[] | string;
    completeness?: number;
    score?: number;
    minPrice?: number;
    maxPrice?: number;
    phone?: string;
}

interface DataIntegrityData {
    activeFacilities?: number;
    avgCompletenessScore?: number;
    averageCompleteness?: number;
    avgCompleteness?: number;
    completenessScore?: number;
    averageScore?: number;
    score?: number;
    noPriceCount?: number;
    missingPriceCount?: number;
    zeroPriceCount?: number;
    noPrice?: number;
    priceInversionCount?: number;
    invertedPriceCount?: number;
    minGtMaxCount?: number;
    priceInversion?: number;
    noPhoneCount?: number;
    missingPhoneCount?: number;
    noPhone?: number;
    noImageCount?: number;
    missingImageCount?: number;
    noImagesCount?: number;
    noImage?: number;
    verifiedCount?: number;
    unverifiedCount?: number;
    unreviewedCount?: number;
    issueFacilities?: IssueFacilityItem[];
}

interface RecentFacility {
    id: string;
    name: string;
    category: string;
    rating: number;
}

export default function AdminDashboard() {
    const router = useRouter();
    const [statsData, setStatsData] = useState<DashboardStats>({
        totalFacilities: 0,
        membersCount: 0,
        consultsCount: 0,
        inquiriesCount: 0,
        reviewsCount: 0,
        correctionsCount: 0,
        partnershipCount: 0,
    });
    const [pendingCounts, setPendingCounts] = useState<PendingCounts>({});
    const [dataIntegrity, setDataIntegrity] = useState<DataIntegrityData>({});
    const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
    const [recentItems, setRecentItems] = useState<RecentFacility[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await fetch('/api/admin/stats');
                if (res.ok) {
                    const json = await res.json();
                    if (json.stats) setStatsData(json.stats);
                    if (json.categoryCounts) setCategoryCounts(json.categoryCounts);
                    if (json.recentFacilities) setRecentItems(json.recentFacilities);
                    if (json.pendingCounts) setPendingCounts(json.pendingCounts);

                    if (json.dataIntegrity) {
                        setDataIntegrity({
                            ...json.dataIntegrity,
                            issueFacilities: json.dataIntegrity?.issueFacilities || json.issueFacilities || [],
                        });
                    }
                }
            } catch (e) {
                console.error('Dashboard fetch error:', e);
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, []);

    const totalCount = statsData.totalFacilities;
    const getPercent = (count: number) => totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;

    const charnelCount = categoryCounts['CHARNEL_HOUSE'] || 0;
    const naturalCount = categoryCounts['NATURAL_BURIAL'] || 0;
    const parkCount = categoryCounts['FAMILY_GRAVE'] || 0;
    const otherCount = Math.max(0, totalCount - (charnelCount + naturalCount + parkCount));

    // 미처리 리드 카운트 (pendingCounts 안전 옵셔널 체이닝 처리)
    const pendingInquiriesCount =
        pendingCounts?.inquiriesUnanswered ??
        pendingCounts?.inquiries ??
        pendingCounts?.unansweredInquiries ??
        pendingCounts?.pendingInquiries ??
        0;
    const pendingConsultsCount =
        pendingCounts?.consultsPending ??
        pendingCounts?.consults ??
        pendingCounts?.pendingConsults ??
        0;
    const pendingCorrectionsCount =
        pendingCounts?.correctionsPending ??
        pendingCounts?.corrections ??
        pendingCounts?.pendingCorrections ??
        0;
    const pendingPartnershipCount =
        pendingCounts?.partnershipPending ??
        pendingCounts?.partnership ??
        pendingCounts?.partnerships ??
        pendingCounts?.pendingPartnership ??
        pendingCounts?.pendingPartnerships ??
        0;

    const totalPendingLeads =
        pendingInquiriesCount +
        pendingConsultsCount +
        pendingCorrectionsCount +
        pendingPartnershipCount;

    const actionItems = [
        {
            label: '미답변 댓글문의',
            pending: pendingInquiriesCount,
            total: statsData.inquiriesCount,
            href: '/admin/inquiries',
            icon: MessageCircle,
            color: 'cyan',
            accent: '#0891B2',
        },
        {
            label: '대기중 상담신청',
            pending: pendingConsultsCount,
            total: statsData.consultsCount,
            href: '/admin/consults',
            icon: PhoneCall,
            color: 'blue',
            accent: '#2563EB',
        },
        {
            label: '미처리 정보수정요청',
            pending: pendingCorrectionsCount,
            total: statsData.correctionsCount,
            href: '/admin/corrections',
            icon: AlertCircle,
            color: 'red',
            accent: '#DC2626',
        },
        {
            label: '대기중 제휴문의',
            pending: pendingPartnershipCount,
            total: statsData.partnershipCount,
            href: '/admin/partnership',
            icon: Briefcase,
            color: 'indigo',
            accent: '#4F46E5',
        },
    ];

    // 데이터 무결성 지표 추출
    const avgCompleteness = Math.min(
        100,
        Math.max(
            0,
            Math.round(
                Number(
                    dataIntegrity?.avgCompletenessScore ??
                    dataIntegrity?.averageCompleteness ??
                    dataIntegrity?.avgCompleteness ??
                    dataIntegrity?.completenessScore ??
                    dataIntegrity?.averageScore ??
                    dataIntegrity?.score ??
                    0
                ) * 10
            ) / 10
        )
    );
    const noPriceCount =
        dataIntegrity?.missingPriceCount ??
        dataIntegrity?.noPriceCount ??
        dataIntegrity?.zeroPriceCount ??
        dataIntegrity?.noPrice ??
        0;
    const priceInversionCount =
        dataIntegrity?.priceInversionCount ??
        dataIntegrity?.invertedPriceCount ??
        dataIntegrity?.minGtMaxCount ??
        dataIntegrity?.priceInversion ??
        0;
    const noPhoneCount =
        dataIntegrity?.missingPhoneCount ??
        dataIntegrity?.noPhoneCount ??
        dataIntegrity?.noPhone ??
        0;
    const noImageCount =
        dataIntegrity?.missingImageCount ??
        dataIntegrity?.noImageCount ??
        dataIntegrity?.noImagesCount ??
        dataIntegrity?.noImage ??
        0;
    const unreviewedCount =
        dataIntegrity?.unreviewedCount ??
        dataIntegrity?.unverifiedCount ??
        0;
    const issueFacilities: IssueFacilityItem[] = Array.isArray(dataIntegrity?.issueFacilities)
        ? dataIntegrity.issueFacilities
        : [];

    const integrityCards = [
        {
            title: '가격 미보유 (가격 문의)',
            count: noPriceCount,
            desc: '대표가격 및 최소가격 0원 시설',
            icon: DollarSign,
            color: 'orange',
            filterHref: '/admin/upload?defect=no_price',
        },
        {
            title: '가격 역전 오류 (min > max)',
            count: priceInversionCount,
            desc: '최소가격이 최대가격보다 큰 시설',
            icon: AlertTriangle,
            color: 'red',
            filterHref: '/admin/upload?defect=no_price',
        },
        {
            title: '전화번호 누락',
            count: noPhoneCount,
            desc: '연락처 정보가 비어있는 시설',
            icon: PhoneOff,
            color: 'yellow',
            filterHref: '/admin/upload?defect=no_phone',
        },
        {
            title: '이미지 미보유',
            count: noImageCount,
            desc: '시설 갤러리/썸네일 미등록 시설',
            icon: ImageOff,
            color: 'grape',
            filterHref: '/admin/upload?defect=no_image',
        },
    ];

    const stats = [
        { title: '총 등록 시설', value: totalCount.toLocaleString(), icon: Database, color: 'blue' },
        { title: '가입 회원', value: statsData.membersCount.toLocaleString(), icon: UserCheck, color: 'grape' },
        { title: '상담 신청 (누적)', value: statsData.consultsCount.toLocaleString(), icon: PhoneCall, color: 'teal' },
        { title: '수정 요청 (누적)', value: statsData.correctionsCount.toLocaleString(), icon: AlertCircle, color: 'red' },
        { title: '댓글 문의 (누적)', value: statsData.inquiriesCount.toLocaleString(), icon: MessageCircle, color: 'cyan' },
        { title: '방문 후기', value: statsData.reviewsCount.toLocaleString(), icon: Star, color: 'yellow' },
        { title: '제휴 문의 (누적)', value: statsData.partnershipCount.toLocaleString(), icon: Briefcase, color: 'indigo' },
    ];

    if (loading) return <LoadingOverlay visible />;

    return (
        <Stack gap="lg">
            <Group justify="space-between" align="center">
                <div>
                    <Text size="xl" fw={800} c="#0F172A">통합 운영 대시보드</Text>
                    <Text size="sm" c="dimmed">실시간 고객 리드 대응 및 시설 데이터 품질 관리 현황</Text>
                </div>
                <Button
                    component={Link}
                    href="/admin/upload"
                    size="sm"
                    radius="md"
                    rightSection={<ArrowRight size={16} />}
                    style={{ backgroundColor: '#2563EB' }}
                >
                    시설 데이터 통합관리
                </Button>
            </Group>

            {/* 1. 상단 '미처리 고객 리드 알림 바 (Action Required)' 섹션 */}
            <Paper
                withBorder
                p="md"
                radius="md"
                style={{
                    backgroundColor: totalPendingLeads > 0 ? '#EFF6FF' : '#FFFFFF',
                    borderColor: totalPendingLeads > 0 ? '#93C5FD' : '#E2E8F0',
                }}
            >
                <Group justify="space-between" mb="sm">
                    <Group gap="xs">
                        <ThemeIcon
                            size="md"
                            radius="md"
                            style={{
                                backgroundColor: totalPendingLeads > 0 ? '#2563EB' : '#64748B',
                                color: '#FFFFFF',
                            }}
                        >
                            <Bell size={16} />
                        </ThemeIcon>
                        <div>
                            <Group gap="xs">
                                <Text fw={800} size="sm" c="#0F172A">
                                    미처리 고객 리드 알림 바 (Action Required)
                                </Text>
                                <Badge
                                    size="sm"
                                    color={totalPendingLeads > 0 ? 'red' : 'teal'}
                                    variant="filled"
                                >
                                    {totalPendingLeads > 0 ? `미처리 ${totalPendingLeads}건` : '모두 처리됨'}
                                </Badge>
                            </Group>
                            <Text size="xs" c="dimmed">
                                카드를 클릭하면 해당 고객 문의 및 신청 관리 페이지로 즉시 이동합니다.
                            </Text>
                        </div>
                    </Group>
                </Group>

                <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }} spacing="sm">
                    {actionItems.map((item) => {
                        const hasPending = item.pending > 0;
                        return (
                            <Paper
                                key={item.href}
                                component={Link}
                                href={item.href}
                                withBorder
                                p="sm"
                                radius="md"
                                style={{
                                    backgroundColor: '#FFFFFF',
                                    borderColor: hasPending ? item.accent : '#E2E8F0',
                                    borderWidth: hasPending ? 1.5 : 1,
                                    textDecoration: 'none',
                                    color: 'inherit',
                                    cursor: 'pointer',
                                    transition: 'transform 0.12s ease, box-shadow 0.12s ease',
                                }}
                            >
                                <Group justify="space-between" wrap="nowrap">
                                    <Group gap="sm" wrap="nowrap">
                                        <ThemeIcon color={item.color} variant="light" size="lg" radius="md">
                                            <item.icon size={18} />
                                        </ThemeIcon>
                                        <div>
                                            <Text size="xs" c="dimmed" fw={600}>
                                                {item.label}
                                            </Text>
                                            <Group gap={6} align="baseline" mt={2}>
                                                <Text size="lg" fw={800} c={hasPending ? 'red.7' : '#0F172A'}>
                                                    {item.pending.toLocaleString()}건
                                                </Text>
                                                <Text size="xs" c="dimmed">
                                                    / 누적 {item.total.toLocaleString()}건
                                                </Text>
                                            </Group>
                                        </div>
                                    </Group>
                                    <ArrowRight size={16} color="#94A3B8" />
                                </Group>
                            </Paper>
                        );
                    })}
                </SimpleGrid>
            </Paper>

            {/* 2. 전체 누적 통계 요약 카드 */}
            <SimpleGrid cols={{ base: 2, sm: 4, md: 7 }} spacing="sm">
                {stats.map((stat) => (
                    <Paper withBorder p="md" radius="md" key={stat.title} bg="white">
                        <Group justify="space-between" wrap="nowrap">
                            <Text size="xs" c="dimmed" fw={700} lineClamp={1}>
                                {stat.title}
                            </Text>
                            <ThemeIcon color={stat.color} variant="light" size="sm" radius="sm">
                                <stat.icon size={14} />
                            </ThemeIcon>
                        </Group>

                        <Text size="xl" fw={800} lh={1.2} mt="md" c="#0F172A">
                            {stat.value}
                        </Text>

                        <Text size="xs" c="dimmed" mt={4}>
                            실시간 집계
                        </Text>
                    </Paper>
                ))}
            </SimpleGrid>

            {/* 3. 중앙 '시설 데이터 무결성 & 정확도 검수 현황 (Data Integrity Center)' 섹션 */}
            <Card withBorder radius="md" p="lg" bg="white">
                <Card.Section withBorder inheritPadding py="md" bg="#F8FAFC">
                    <Group justify="space-between" align="center">
                        <Group gap="sm">
                            <ThemeIcon size="lg" radius="md" style={{ backgroundColor: '#2563EB', color: '#FFFFFF' }}>
                                <ShieldCheck size={20} />
                            </ThemeIcon>
                            <div>
                                <Text fw={800} size="md" c="#0F172A">
                                    시설 데이터 무결성 & 정확도 검수 현황 (Data Integrity Center)
                                </Text>
                                <Text size="xs" c="dimmed">
                                    전국 장사시설 DB의 가격·연락처·이미지 누락 및 가격 역전 오류를 실시간 모니터링합니다.
                                </Text>
                            </div>
                        </Group>
                        <Button
                            component={Link}
                            href="/admin/upload"
                            size="xs"
                            radius="md"
                            variant="filled"
                            style={{ backgroundColor: '#2563EB' }}
                            rightSection={<ExternalLink size={14} />}
                        >
                            시설 데이터 관리에서 검수하기
                        </Button>
                    </Group>
                </Card.Section>

                <SimpleGrid cols={{ base: 1, lg: 3 }} spacing="lg" mt="md">
                    {/* 좌측: 평균 데이터 완성도 점수 RingProgress */}
                    <Paper withBorder p="md" radius="md" bg="#F8FAFC">
                        <Stack align="center" justify="center" h="100%" gap="xs">
                            <Text size="sm" fw={700} c="#0F172A">
                                평균 데이터 완성도 점수
                            </Text>
                            <RingProgress
                                size={156}
                                thickness={16}
                                roundCaps
                                sections={[
                                    {
                                        value: avgCompleteness,
                                        color: avgCompleteness >= 80 ? 'teal' : avgCompleteness >= 60 ? 'blue' : 'orange',
                                    },
                                ]}
                                label={
                                    <Center>
                                        <div style={{ textAlign: 'center' }}>
                                            <Text fw={900} size="xl" c="#0F172A">
                                                {avgCompleteness}점
                                            </Text>
                                            <Text size="11px" c="dimmed">
                                                / 100점 만점
                                            </Text>
                                        </div>
                                    </Center>
                                }
                            />
                            <Box w="100%" px="sm">
                                <Progress
                                    value={avgCompleteness}
                                    color={avgCompleteness >= 80 ? 'teal' : avgCompleteness >= 60 ? 'blue' : 'orange'}
                                    size="sm"
                                    radius="xl"
                                />
                                <Group justify="space-between" mt={6}>
                                    <Text size="xs" c="dimmed">
                                        미검토 시설: {unreviewedCount.toLocaleString()}개
                                    </Text>
                                    <Badge size="xs" variant="light" color={avgCompleteness >= 80 ? 'teal' : 'blue'}>
                                        {avgCompleteness >= 80 ? '양호' : '보완 권장'}
                                    </Badge>
                                </Group>
                            </Box>
                        </Stack>
                    </Paper>

                    {/* 우측 2칸: 4대 결함 요약 지표 카드 */}
                    <Box style={{ gridColumn: 'span 2' }}>
                        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm" h="100%">
                            {integrityCards.map((card) => (
                                <Paper
                                    key={card.title}
                                    withBorder
                                    p="md"
                                    radius="md"
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => router.push(card.filterHref)}
                                >
                                    <Group justify="space-between" align="flex-start">
                                        <div>
                                            <Text size="xs" c="dimmed" fw={700}>
                                                {card.title}
                                            </Text>
                                            <Group gap="xs" align="baseline" mt={8}>
                                                <Text size="2xl" fw={800} c={card.count > 0 ? 'red.7' : 'teal.7'}>
                                                    {card.count.toLocaleString()}
                                                </Text>
                                                <Text size="sm" fw={600} c="dimmed">
                                                    개 시설
                                                </Text>
                                            </Group>
                                            <Text size="xs" c="dimmed" mt={6}>
                                                {card.desc}
                                            </Text>
                                        </div>
                                        <ThemeIcon color={card.color} variant="light" size="lg" radius="md">
                                            <card.icon size={18} />
                                        </ThemeIcon>
                                    </Group>
                                    <Group justify="space-between" mt="sm" pt="xs" style={{ borderTop: '1px solid #F1F5F9' }}>
                                        <Text size="xs" c="dimmed">
                                            비중: {getPercent(card.count)}%
                                        </Text>
                                        <Group gap={4}>
                                            <Text size="xs" fw={600} c="#2563EB">
                                                필터링 검수
                                            </Text>
                                            <ArrowRight size={12} color="#2563EB" />
                                        </Group>
                                    </Group>
                                </Paper>
                            ))}
                        </SimpleGrid>
                    </Box>
                </SimpleGrid>

                {/* 즉시 점검 필요 시설 (issueFacilities) 리스트 테이블 */}
                <Box mt="lg">
                    <Group justify="space-between" mb="xs">
                        <Group gap="xs">
                            <Text fw={700} size="sm" c="#0F172A">
                                즉시 점검 필요 시설 리스트
                            </Text>
                            <Badge size="xs" color="red" variant="light">
                                {issueFacilities.length}개 표시
                            </Badge>
                        </Group>
                        <Button
                            component={Link}
                            href="/admin/upload"
                            variant="subtle"
                            size="xs"
                            color="blue"
                            rightSection={<ArrowRight size={14} />}
                        >
                            시설 데이터 관리에서 검수하기
                        </Button>
                    </Group>

                    <Paper withBorder radius="md" style={{ overflow: 'hidden' }}>
                        <ScrollArea>
                            <Table striped highlightOnHover verticalSpacing="xs" style={{ minWidth: 680 }}>
                                <Table.Thead bg="#F8FAFC">
                                    <Table.Tr>
                                        <Table.Th style={{ width: 100 }}>ID</Table.Th>
                                        <Table.Th>시설명</Table.Th>
                                        <Table.Th style={{ width: 120 }}>카테고리</Table.Th>
                                        <Table.Th style={{ width: 140 }}>결함 유형</Table.Th>
                                        <Table.Th>상세 사유</Table.Th>
                                        <Table.Th style={{ width: 110, textAlign: 'right' }}>바로가기</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {issueFacilities.length > 0 ? (
                                        issueFacilities.map((item) => {
                                            const primaryIssue = item.issueType || (Array.isArray(item.issues) ? item.issues[0] : item.issues) || '점검 필요';
                                            const detailText = item.detail || (Array.isArray(item.issues) ? item.issues.join(', ') : '-');
                                            return (
                                                <Table.Tr key={item.id}>
                                                    <Table.Td>
                                                        <Text size="xs" c="dimmed" ff="monospace">{item.id}</Text>
                                                    </Table.Td>
                                                    <Table.Td fw={600}>{item.name}</Table.Td>
                                                    <Table.Td>
                                                        <Badge size="xs" variant="light" color="blue">
                                                            {FACILITY_CATEGORY_LABELS[item.category as FacilityCategory] || item.category || '기타'}
                                                        </Badge>
                                                    </Table.Td>
                                                    <Table.Td>
                                                        <Badge
                                                            size="xs"
                                                            color={
                                                                primaryIssue.includes('역전') ? 'red' :
                                                                    primaryIssue.includes('가격') || primaryIssue.includes('이상치') ? 'orange' :
                                                                        primaryIssue.includes('전화') ? 'yellow' : 'grape'
                                                            }
                                                            variant="light"
                                                        >
                                                            {primaryIssue}
                                                        </Badge>
                                                    </Table.Td>
                                                    <Table.Td>
                                                        <Text size="xs" c="dimmed">{detailText}</Text>
                                                    </Table.Td>
                                                    <Table.Td align="right">
                                                        <Button
                                                            component={Link}
                                                            href={`/admin/upload?search=${encodeURIComponent(item.name || item.id)}`}
                                                            size="compact-xs"
                                                            variant="light"
                                                            color="blue"
                                                        >
                                                            검수하기
                                                        </Button>
                                                    </Table.Td>
                                                </Table.Tr>
                                            );
                                        })
                                    ) : (
                                        <Table.Tr>
                                            <Table.Td colSpan={6} align="center" py="lg">
                                                <Group justify="center" gap="xs">
                                                    <CheckCircle2 size={16} color="#0D9488" />
                                                    <Text size="sm" c="dimmed">즉시 점검이 필요한 중대 데이터 결함 시설이 없습니다.</Text>
                                                </Group>
                                            </Table.Td>
                                        </Table.Tr>
                                    )}
                                </Table.Tbody>
                            </Table>
                        </ScrollArea>
                    </Paper>
                </Box>
            </Card>

            {/* 4. 하단 최근 등록/수정 시설 & 카테고리 비중 */}
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                {/* 최근 등록 시설 */}
                <Card withBorder radius="md" bg="white">
                    <Card.Section withBorder inheritPadding py="xs">
                        <Group justify="space-between">
                            <Text fw={700} c="#0F172A">최근 등록/수정된 시설</Text>
                            <Badge color="blue" variant="light">Live</Badge>
                        </Group>
                    </Card.Section>
                    <ScrollArea mt="sm">
                        <Table verticalSpacing="xs" highlightOnHover style={{ minWidth: 420 }}>
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
                                        <Table.Td fw={500}>{item.name}</Table.Td>
                                        <Table.Td>
                                            <Badge size="xs" variant="dot" color="gray">
                                                {FACILITY_CATEGORY_LABELS[item.category as FacilityCategory] || item.category}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            <Group gap={4} wrap="nowrap">
                                                <Star size={14} fill="#F59E0B" color="#F59E0B" />
                                                <Text size="sm" fw={500}>
                                                    {item.rating != null ? Number(item.rating).toFixed(1) : '-'}
                                                </Text>
                                            </Group>
                                        </Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    </ScrollArea>
                </Card>

                {/* 카테고리 현황 (RingProgress) */}
                <Card withBorder radius="md" bg="white">
                    <Card.Section withBorder inheritPadding py="xs">
                        <Text fw={700} c="#0F172A">카테고리별 비중</Text>
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
        </Stack>
    );
}

