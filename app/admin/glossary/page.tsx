'use client';

import { useState } from 'react';
import { Container, Title, Text, TextInput, Group, Badge, Box, Stack, Paper, Tabs, Divider } from '@mantine/core';
import Link from 'next/link';

interface GlossaryItem {
    term: string;
    description: string;
    category: string;
}

const glossaryData: GlossaryItem[] = [
    // 장지 유형
    { term: '매장묘', description: '시신을 땅에 묻는 전통 장법입니다. 단분(1인), 합장(2인 1기), 쌍분(나란히 2기) 등으로 나뉩니다.', category: '장지 유형' },
    { term: '봉안당(납골당)', description: '화장 후 유골을 봉안당(납골당)에 안치하는 방식입니다. 단수가 높을수록 가격이 낮아지는 경향이 있습니다.', category: '장지 유형' },
    { term: '수목장(자연장)', description: '화장 후 유골을 나무 밑이나 잔디밭 등 자연에 매장하는 친환경 장법입니다.', category: '장지 유형' },
    { term: '공원묘지', description: '공원 형태로 조성된 묘지로, 매장묘와 봉안당을 함께 운영하는 경우가 많습니다.', category: '장지 유형' },
    { term: '추모공원', description: '추모 시설이 갖춰진 공원으로, 봉안당·수목장·잔디장 등 다양한 장법을 제공합니다.', category: '장지 유형' },

    // 매장 관련
    { term: '단분', description: '1인의 시신을 매장하는 독립 무덤입니다.', category: '매장 관련' },
    { term: '합장', description: '2인의 시신을 하나의 봉분에 함께 매장하는 방식입니다. 주로 부부가 이용합니다.', category: '매장 관련' },
    { term: '쌍분', description: '2개의 봉분을 나란히 배치하는 방식으로, 합장과 달리 각각 독립된 무덤입니다.', category: '매장 관련' },
    { term: '평장묘', description: '봉분(흙무덤)을 만들지 않고 평평하게 조성하는 묘지입니다. 잔디장이라고도 합니다.', category: '매장 관련' },

    // 봉안 관련
    { term: '봉안담', description: '화장 후 유골함을 담 형태의 시설에 안치하는 방식입니다. 봉안당보다 저렴한 편입니다.', category: '봉안 관련' },
    { term: '개인단', description: '봉안당에서 1인의 유골을 안치하는 개인 칸입니다.', category: '봉안 관련' },
    { term: '부부단', description: '봉안당에서 2인의 유골을 함께 안치할 수 있는 부부용 칸입니다.', category: '봉안 관련' },
    { term: '1단~8단', description: '봉안당 내 유골함이 놓이는 높이(층)를 뜻합니다. 낮은 단(1~3단)이 접근성이 좋아 가격이 높고, 높은 단(5단 이상)은 상대적으로 저렴합니다.', category: '봉안 관련' },
    { term: '특별실', description: '봉안당 내 별도로 구분된 고급 안치실로, 일반실보다 넓고 시설이 좋습니다.', category: '봉안 관련' },
    { term: '일반실', description: '봉안당의 기본 안치실입니다.', category: '봉안 관련' },

    // 비용 관련
    { term: '사용료', description: '장지(묘지, 봉안당 등)를 일정 기간 사용하는 데 드는 비용입니다.', category: '비용 관련' },
    { term: '관리비', description: '장지의 유지·관리를 위해 정기적으로 납부하는 비용입니다. 연납 또는 일시납으로 납부합니다.', category: '비용 관련' },
    { term: '안치료', description: '유골함을 봉안당에 안치하는 데 드는 비용입니다. 사용료에 포함되는 경우도 있습니다.', category: '비용 관련' },
    { term: '설치비', description: '묘지 조성 시 비석, 상석 등을 설치하는 비용입니다.', category: '비용 관련' },

    // 시설 관련
    { term: '관내', description: '해당 시설이 위치한 지역(시·군·구) 주민을 의미합니다. 관내 주민은 사용료 할인을 받는 경우가 많습니다.', category: '시설 관련' },
    { term: '관외', description: '해당 시설이 위치한 지역 외 주민을 의미합니다. 관외 주민은 관내보다 높은 요금이 적용됩니다.', category: '시설 관련' },
    { term: '유공자', description: '국가유공자, 보훈대상자 등에게 장지 사용료 감면 혜택이 적용되는 경우입니다.', category: '시설 관련' },
    { term: '공설', description: '지방자치단체에서 설립·운영하는 공공 장사시설입니다. 민간 시설보다 저렴한 편입니다.', category: '시설 관련' },
    { term: '민간(사설)', description: '민간 법인 또는 종교단체 등에서 설립·운영하는 장사시설입니다.', category: '시설 관련' },

    // 장례 절차
    { term: '화장', description: '시신을 불로 태워 유골로 만드는 과정입니다. 화장장(승화원)에서 진행됩니다.', category: '장례 절차' },
    { term: '승화원', description: '화장을 진행하는 시설의 공식 명칭입니다. 화장장이라고도 합니다.', category: '장례 절차' },
    { term: '빈소', description: '고인을 안치하고 조문객을 맞이하는 장소입니다. 주로 장례식장 내에 마련됩니다.', category: '장례 절차' },
    { term: '발인', description: '장례 마지막 날, 시신을 장지로 운구하는 절차입니다.', category: '장례 절차' },
    { term: '49재', description: '불교에서 사후 49일간 치르는 의식으로, 극락왕생을 기원합니다.', category: '장례 절차' },

    // 기간 관련
    { term: '사용기간', description: '장지를 사용할 수 있는 기간입니다. 매장묘는 15~30년, 봉안당은 15~30년이 일반적이며, 갱신이 가능합니다.', category: '기간 관련' },
    { term: '연장(갱신)', description: '사용기간 만료 후 추가 비용을 납부하여 계속 사용하는 것입니다.', category: '기간 관련' },
];

const categories = [...new Set(glossaryData.map(item => item.category))];

export default function GlossaryPage() {
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState<string | null>('전체');

    const filtered = glossaryData.filter(item => {
        const matchesSearch = !search ||
            item.term.includes(search) ||
            item.description.includes(search);
        const matchesCategory = activeTab === '전체' || item.category === activeTab;
        return matchesSearch && matchesCategory;
    });

    return (
        <Container size="md" py="xl">
            <Group justify="space-between" mb="xl">
                <div>
                    <Title order={2} fw={800}>용어사전</Title>
                    <Text size="sm" c="dimmed" mt={4}>장례·장지 관련 용어를 쉽게 알아보세요</Text>
                </div>
                <Link href="/admin" style={{ textDecoration: 'none' }}>
                    <Text size="sm" c="brand.6">← 관리자</Text>
                </Link>
            </Group>

            <TextInput
                placeholder="용어 검색..."
                value={search}
                onChange={(e) => setSearch(e.currentTarget.value)}
                mb="lg"
                leftSection={<span className="material-symbols-outlined" style={{ fontSize: '18px' }}>search</span>}
                styles={{
                    input: {
                        border: '1px solid #dee2e6',
                        borderRadius: '8px',
                        fontSize: '14px',
                    }
                }}
            />

            <Tabs value={activeTab} onChange={setActiveTab} mb="lg">
                <Tabs.List style={{ overflowX: 'auto', flexWrap: 'nowrap' }}>
                    <Tabs.Tab value="전체">
                        전체 <Badge size="xs" variant="light" ml={4}>{glossaryData.length}</Badge>
                    </Tabs.Tab>
                    {categories.map(cat => (
                        <Tabs.Tab key={cat} value={cat} style={{ whiteSpace: 'nowrap' }}>
                            {cat} <Badge size="xs" variant="light" ml={4}>{glossaryData.filter(i => i.category === cat).length}</Badge>
                        </Tabs.Tab>
                    ))}
                </Tabs.List>
            </Tabs>

            <Stack gap="xs">
                {filtered.length === 0 ? (
                    <Paper p="xl" ta="center" withBorder>
                        <Text c="dimmed">검색 결과가 없습니다</Text>
                    </Paper>
                ) : (
                    filtered.map((item, idx) => (
                        <Paper key={idx} p="md" withBorder radius="md"
                            style={{ borderColor: '#f1f3f5', transition: 'box-shadow 0.15s', cursor: 'default' }}
                            onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)')}
                            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
                        >
                            <Group justify="space-between" align="flex-start" wrap="nowrap">
                                <div style={{ flex: 1 }}>
                                    <Group gap={8} mb={4}>
                                        <Text fw={700} size="sm">{item.term}</Text>
                                        <Badge size="xs" variant="light" color="gray">{item.category}</Badge>
                                    </Group>
                                    <Text size="xs" c="dimmed" style={{ lineHeight: 1.6 }}>
                                        {item.description}
                                    </Text>
                                </div>
                            </Group>
                        </Paper>
                    ))
                )}
            </Stack>

            <Divider my="xl" />
            <Text size="xs" c="dimmed" ta="center">
                총 {filtered.length}개 용어 · 대대손손 용어사전
            </Text>
        </Container>
    );
}
