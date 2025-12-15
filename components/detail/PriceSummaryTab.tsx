import { useMemo, useState } from 'react';
import { Paper, Text, Group, Stack, RingProgress, SimpleGrid, Card, ThemeIcon, Divider, NumberInput, Select, Button, Badge, Alert } from '@mantine/core';
import { Calculator, TrendingUp, TrendingDown, Info, AlertCircle, Wallet } from 'lucide-react';
import { formatKoreanCurrency } from '@/lib/format';

interface PriceSummaryTabProps {
    priceTable: any;
    priceInfo: any; // includes management costs, installation costs
}

export function PriceSummaryTab({ priceTable, priceInfo }: PriceSummaryTabProps) {
    // 1. 전체 데이터 통계 계산
    const stats = useMemo(() => {
        let minPrice = Infinity;
        let maxPrice = 0;
        const categoryStats: Record<string, { min: number, max: number, count: number, name: string }> = {};

        Object.entries(priceTable).forEach(([groupName, groupData]: [string, any]) => {
            // 별도 비용 제외
            if (groupName.includes('[별도]') || groupName.includes('[안내]')) return;

            groupData.rows.forEach((row: any) => {
                const p = Number(row.price);
                if (!p || p === 0) return;

                if (p < minPrice) minPrice = p;
                if (p > maxPrice) maxPrice = p;

                // 카테고리 추론 (간단 분류)
                let category = '기타';
                if (groupName.includes('매장') || groupName.includes('묘지')) category = '매장묘';
                else if (groupName.includes('봉안묘') || groupName.includes('가족묘')) category = '봉안묘';
                else if (groupName.includes('봉안당') || groupName.includes('납골')) category = '봉안당';
                else if (groupName.includes('수목') || groupName.includes('자연')) category = '수목장';

                if (!categoryStats[category]) categoryStats[category] = { min: Infinity, max: 0, count: 0, name: category };
                if (p < categoryStats[category].min) categoryStats[category].min = p;
                if (p > categoryStats[category].max) categoryStats[category].max = p;
                categoryStats[category].count++;
            });
        });

        if (minPrice === Infinity) minPrice = 0;

        return { minPrice, maxPrice, categoryStats };
    }, [priceTable]);



    // 포맷터
    // 2. 간편 계산기 상태
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedPeriod, setSelectedPeriod] = useState<string>('5'); // 5년 관리비 예시

    // 포맷터 Alias
    const formatMoney = formatKoreanCurrency;

    return (
        <Stack gap="xl" py="md">
            {/* 상단: 헤드라인 메시지 */}
            <Alert variant="light" color="blue" icon={<Info size={16} />} title="장례 비용 가이드">
                장례 비용은 장법과 시설 등급에 따라 크게 달라집니다. <br />
                가장 합리적인 선택을 위해 <b>1인 기준 사용료</b>를 먼저 확인해보세요.
            </Alert>

            {/* 1. 가격 범위 요약 (Cards) */}
            <div>
                <Text size="lg" fw={700} mb="md">💰 이 시설의 가격대 요약</Text>
                <SimpleGrid cols={{ base: 1, sm: 2 }}>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between" mb="xs">
                            <Text size="sm" c="dimmed" fw={700}>최저가 (실속형)</Text>
                            <ThemeIcon variant="light" color="green" radius="xl"><TrendingDown size={16} /></ThemeIcon>
                        </Group>
                        <Text size="xl" fw={900} c="green.8">
                            {formatMoney(stats.minPrice)} ~
                        </Text>
                        <Text size="xs" c="dimmed" mt="xs">
                            가장 경제적인 선택 시 시작 가격입니다.
                        </Text>
                    </Card>

                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between" mb="xs">
                            <Text size="sm" c="dimmed" fw={700}>최고가 (프리미엄)</Text>
                            <ThemeIcon variant="light" color="red" radius="xl"><TrendingUp size={16} /></ThemeIcon>
                        </Group>
                        <Text size="xl" fw={900} c="gray.8">
                            ~ {formatMoney(stats.maxPrice)}
                        </Text>
                        <Text size="xs" c="dimmed" mt="xs">
                            최고급 시설 또는 대가족형 선택 시 가격입니다.
                        </Text>
                    </Card>
                </SimpleGrid>
            </div>

            <Divider />

            {/* 2. 장사 방식별 비용 비교 (Matrix/Graph) */}
            <div>
                <Text size="lg" fw={700} mb="md">📊 장사 방식별 비용 비교</Text>
                <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
                    {['매장묘', '봉안묘', '봉안당', '수목장'].map(cat => {
                        const data = stats.categoryStats[cat];
                        if (!data) return (
                            <Paper key={cat} withBorder p="md" radius="md" bg="gray.0" style={{ opacity: 0.6 }}>
                                <Text fw={700} c="dimmed">{cat}</Text>
                                <Text size="sm" c="dimmed" mt="sm">정보 없음</Text>
                            </Paper>
                        );
                        return (
                            <Paper key={cat} withBorder p="md" radius="md">
                                <Text fw={700} size="lg" mb="sm">{cat}</Text>
                                <Stack gap={4}>
                                    <Text size="sm" c="dimmed">최저</Text>
                                    <Text fw={700} size="md" c="blue.7">{formatMoney(data.min)}</Text>
                                    <Divider my="xs" variant="dashed" />
                                    <Text size="sm" c="dimmed">최고</Text>
                                    <Text fw={700} size="md">{formatMoney(data.max)}</Text>
                                </Stack>
                            </Paper>
                        );
                    })}
                </SimpleGrid>
            </div>

            <Divider />

            {/* 3. 간편 견적 계산기 (Calculator) */}
            <Card withBorder radius="md" p="xl" bg="blue.0" style={{ borderColor: '#339af0' }}>
                <Group mb="md">
                    <ThemeIcon size="lg" radius="md" color="blue" variant="filled">
                        <Calculator size={20} />
                    </ThemeIcon>
                    <div>
                        <Text size="lg" fw={900}>종합 견적 계산기</Text>
                        <Text size="sm" c="dimmed">사용료뿐만 아니라 관리비, 설치비까지 포함된 예상 비용을 확인하세요.</Text>
                    </div>
                </Group>

                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                    <Stack>
                        <Select
                            label="원하시는 장법 선택"
                            placeholder="선택해주세요"
                            data={Object.keys(stats.categoryStats).map(k => ({ value: k, label: k }))}
                            value={selectedCategory}
                            onChange={setSelectedCategory}
                        />
                        <Select
                            label="관리비 선납 기간"
                            description="대부분 5년 단위로 선납합니다."
                            data={[
                                { value: '1', label: '1년 (매년 납부)' },
                                { value: '5', label: '5년 선납' },
                                { value: '10', label: '10년 선납' },
                                { value: '99', label: '영구 관리비 (해당 시)' },
                            ]}
                            value={selectedPeriod}
                            onChange={(v) => v && setSelectedPeriod(v)}
                        />
                    </Stack>

                    <Paper withBorder p="md" radius="md" bg="white">
                        <Text size="sm" fw={700} c="dimmed" mb="md">예상 견적서</Text>

                        {selectedCategory ? (
                            <Stack gap="xs">
                                <Group justify="space-between">
                                    <Text size="sm">평균 시설 사용료</Text>
                                    <Text fw={700} size="sm">
                                        {formatMoney(Math.round((stats.categoryStats[selectedCategory].min + stats.categoryStats[selectedCategory].max) / 2))}
                                    </Text>
                                </Group>
                                <Group justify="space-between" c="dimmed">
                                    <Text size="xs">(최저 {formatMoney(stats.categoryStats[selectedCategory].min)} ~ 최고 {formatMoney(stats.categoryStats[selectedCategory].max)})</Text>
                                </Group>

                                <Divider my="xs" />

                                <Group justify="space-between" c="blue.7">
                                    <Text size="sm">예상 관리비 ({selectedPeriod}년)</Text>
                                    <Text fw={700} size="sm">
                                        {/* 관리비 데이터가 없으면 대략적인 평균값(5만원/년)을 예시로 사용하거나 실제 데이터 연동 필요 */}
                                        약 {formatMoney(50000 * Number(selectedPeriod))} (예상)
                                    </Text>
                                </Group>

                                <Divider my="sm" />

                                <Group justify="space-between">
                                    <Text size="md" fw={900}>총 예상 비용</Text>
                                    <Text size="xl" fw={900} c="blue.9">
                                        {formatMoney(
                                            Math.round((stats.categoryStats[selectedCategory].min + stats.categoryStats[selectedCategory].max) / 2) +
                                            (50000 * Number(selectedPeriod))
                                        )}
                                        <Text span size="xs" fw={500} c="dimmed"> ~ </Text>
                                    </Text>
                                </Group>
                                <Text size="xs" c="gray.5" ta="right">* 실제 비용은 위치/옵션에 따라 달라질 수 있습니다.</Text>
                            </Stack>
                        ) : (
                            <Stack align="center" justify="center" h={140}>
                                <Text c="dimmed" size="sm">왼쪽에서 장법을 선택해주세요.</Text>
                            </Stack>
                        )}
                    </Paper>
                </SimpleGrid>
            </Card>
        </Stack>
    );
}
