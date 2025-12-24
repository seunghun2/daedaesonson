'use client';

import { Box, Text, Stack, Group, SimpleGrid } from '@mantine/core';
import {
    ArrowLeft, Building2, TreePine, Shovel, Banknote,
    Building, Trees, ParkingSquare, Mountain, Leaf, Shrub,
    Flame, Heart, Box as BoxIcon, Users, Archive,
    Truck, Pickaxe,
    Wallet, FileText, Clock, Infinity
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import BottomNav from '@/components/common/BottomNav';

// 카테고리별 용어 그룹
const GLOSSARY_GROUPS = [
    {
        category: '장지 유형',
        icon: Building2,
        color: '#1D0098',
        terms: [
            {
                term: '봉안당',
                Icon: Building,
                simple: '유골을 모시는 실내 시설',
                detail: '화장 후 유골을 봉안함에 모시는 실내 시설입니다. 날씨에 관계없이 참배가 가능하며, 1인용부터 가족용까지 다양합니다.',
            },
            {
                term: '수목장',
                Icon: Trees,
                simple: '나무 아래에 유골을 묻는 자연장',
                detail: '화장 후 유골을 나무 주변이나 아래에 묻는 친환경 장법입니다. 나무가 자라면서 고인을 추모합니다.',
            },
            {
                term: '자연장',
                Icon: Leaf,
                simple: '자연으로 돌려보내는 친환경 장법',
                detail: '화장 후 유골을 수목, 화초, 잔디 등의 아래에 묻어 자연으로 돌려보내는 장법입니다. 수목장, 잔디장, 화초장 등이 있습니다.',
            },
            {
                term: '공원묘지',
                Icon: ParkingSquare,
                simple: '공원처럼 조성된 묘지',
                detail: '잔디와 조경으로 공원처럼 조성된 묘지입니다. 봉분 형태 또는 평장(잔디장) 형태로 조성됩니다.',
            },
            {
                term: '추모공원',
                Icon: Mountain,
                simple: '종합 장묘시설',
                detail: '묘지, 봉안당, 수목장, 추모 공간 등이 함께 조성된 종합 장묘시설입니다.',
            },
            {
                term: '잔디장',
                Icon: Shrub,
                simple: '잔디밭 아래에 유골을 묻는 것',
                detail: '화장 후 유골을 잔디밭 아래에 묻는 자연장의 한 형태입니다. 평장묘와 비슷한 형태입니다.',
            },
        ],
    },
    {
        category: '장례 절차',
        icon: TreePine,
        color: '#0ca678',
        terms: [
            {
                term: '화장',
                Icon: Flame,
                simple: '시신을 유골로 만드는 것',
                detail: '시신을 화장시설(승화원)에서 태워 유골로 만드는 장법입니다. 이후 봉안당, 수목장 등에 안장합니다.',
            },
            {
                term: '안치 / 봉안',
                Icon: Heart,
                simple: '유골을 시설에 모시는 것',
                detail: '화장 후 유골을 봉안당이나 봉안묘 등에 정성스럽게 모시는 것을 말합니다.',
            },
            {
                term: '봉안함',
                Icon: BoxIcon,
                simple: '유골을 담는 용기',
                detail: '화장 후 유골을 담아 모시는 용기입니다. 대리석, 옥, 도자기 등 다양한 재질이 있습니다.',
            },
            {
                term: '합장',
                Icon: Users,
                simple: '두 분 이상을 함께 모시는 것',
                detail: '부부나 가족 등 두 분 이상을 한 곳에 함께 모시는 것입니다. 부부합장이 대표적입니다.',
            },
            {
                term: '납골',
                Icon: Archive,
                simple: '유골을 봉안함에 담는 것',
                detail: '화장 후 남은 유골을 봉안함이나 용기에 담는 것을 말합니다. 봉안(奉安)이라고도 합니다.',
            },
        ],
    },
    {
        category: '묘지 이전',
        icon: Shovel,
        color: '#f59f00',
        terms: [
            {
                term: '이장',
                Icon: Truck,
                simple: '묘를 다른 곳으로 옮기는 것',
                detail: '기존에 안장된 시신이나 유골을 다른 묘지로 옮겨 다시 매장하는 것입니다.',
            },
            {
                term: '개장',
                Icon: Pickaxe,
                simple: '묘를 열어 유골을 수습하는 것',
                detail: '매장된 시신이나 유골을 파내어 화장하거나, 봉안당/수목장 등 다른 형태로 옮기는 것입니다. 현재 대부분의 묘지 이전은 개장에 해당합니다.',
            },
        ],
    },
    {
        category: '비용',
        icon: Banknote,
        color: '#228be6',
        terms: [
            {
                term: '사용료',
                Icon: Wallet,
                simple: '안치 공간 이용 비용',
                detail: '봉안당이나 수목장 등 시설의 안치 공간을 사용하기 위해 납부하는 초기 비용입니다.',
            },
            {
                term: '관리비',
                Icon: FileText,
                simple: '시설 유지관리 비용',
                detail: '묘지나 봉안시설의 유지관리를 위해 정기적으로 납부하는 비용입니다. 연간 또는 일정 기간 단위로 부과됩니다.',
            },
            {
                term: '영구사용',
                Icon: Infinity,
                simple: '기간 제한 없이 계속 사용',
                detail: '기간 제한 없이 시설을 계속 사용할 수 있는 것을 말합니다. 일부 시설에서 제공합니다.',
            },
            {
                term: '기간제',
                Icon: Clock,
                simple: '일정 기간 사용 후 갱신',
                detail: '15년, 30년 등 일정 기간 사용 후 재계약하는 방식입니다. 영구사용보다 초기 비용이 저렴합니다.',
            },
        ],
    },
];

type TermType = {
    term: string;
    Icon: React.ComponentType<{ size?: number; color?: string }>;
    simple: string;
    detail: string;
};

export default function GlossaryPage() {
    const [selectedTerm, setSelectedTerm] = useState<TermType | null>(null);
    const [selectedColor, setSelectedColor] = useState<string>('#1D0098');

    const handleSelect = (term: TermType, color: string) => {
        if (selectedTerm?.term === term.term) {
            setSelectedTerm(null);
        } else {
            setSelectedTerm(term);
            setSelectedColor(color);
        }
    };

    return (
        <Box style={{ minHeight: '100dvh', backgroundColor: '#f8f9fa', paddingBottom: 70 }}>
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
                    <Link href="/menu" style={{ display: 'flex', alignItems: 'center' }}>
                        <ArrowLeft size={20} color="#495057" />
                    </Link>
                    <Text size="lg" fw={700}>용어 가이드</Text>
                </Group>
            </Box>

            {/* 선택된 용어 상세 */}
            {selectedTerm && (
                <Box
                    p="md"
                    bg="white"
                    mb="sm"
                    style={{ borderBottom: '1px solid #e9ecef' }}
                >
                    <Group gap="sm" mb="sm">
                        <Box
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: 10,
                                backgroundColor: `${selectedColor}15`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <selectedTerm.Icon size={22} color={selectedColor} />
                        </Box>
                        <Box>
                            <Text size="md" fw={700}>{selectedTerm.term}</Text>
                            <Text size="xs" c="dimmed">{selectedTerm.simple}</Text>
                        </Box>
                    </Group>
                    <Text size="sm" c="dark.6" lh={1.7} pl={52}>
                        {selectedTerm.detail}
                    </Text>
                    <Text
                        size="xs"
                        c="dimmed"
                        mt="sm"
                        style={{ cursor: 'pointer' }}
                        onClick={() => setSelectedTerm(null)}
                    >
                        ✕ 닫기
                    </Text>
                </Box>
            )}

            {/* 안내 문구 */}
            {!selectedTerm && (
                <Box p="md" bg="white" mb="sm">
                    <Text size="sm" fw={500} mb={4}>장묘 용어가 어려우셨나요?</Text>
                    <Text size="xs" c="dimmed">
                        용어를 탭하면 쉬운 설명을 볼 수 있어요.
                    </Text>
                </Box>
            )}

            {/* 카테고리별 용어 */}
            <Stack gap="sm" p="md">
                {GLOSSARY_GROUPS.map((group, gIdx) => {
                    const GroupIcon = group.icon;
                    return (
                        <Box key={gIdx} bg="white" p="md" style={{ borderRadius: 12 }}>
                            <Group gap="sm" mb="md">
                                <Box
                                    style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: 8,
                                        backgroundColor: `${group.color}15`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <GroupIcon size={18} color={group.color} />
                                </Box>
                                <Text size="sm" fw={600}>{group.category}</Text>
                            </Group>

                            <SimpleGrid cols={2} spacing="xs">
                                {group.terms.map((term, tIdx) => {
                                    const TermIcon = term.Icon;
                                    const isSelected = selectedTerm?.term === term.term;
                                    return (
                                        <Box
                                            key={tIdx}
                                            p="sm"
                                            bg={isSelected ? `${group.color}10` : 'gray.0'}
                                            style={{
                                                borderRadius: 8,
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                border: isSelected ? `1.5px solid ${group.color}` : '1.5px solid transparent',
                                            }}
                                            onClick={() => handleSelect(term, group.color)}
                                        >
                                            <Group gap="xs" wrap="nowrap">
                                                <TermIcon size={18} color={isSelected ? group.color : '#868e96'} />
                                                <Box style={{ flex: 1, minWidth: 0 }}>
                                                    <Text size="xs" fw={600} truncate c={isSelected ? 'dark' : 'dark.6'}>
                                                        {term.term}
                                                    </Text>
                                                    <Text size="xs" c="dimmed" truncate>{term.simple}</Text>
                                                </Box>
                                            </Group>
                                        </Box>
                                    );
                                })}
                            </SimpleGrid>
                        </Box>
                    );
                })}
            </Stack>

            {/* 하단 안내 */}
            <Box ta="center" py="md">
                <Text size="xs" c="dimmed">
                    더 궁금한 용어가 있으면{' '}
                    <Link href="/contact" style={{ color: '#1D0098', textDecoration: 'underline' }}>
                        문의하기
                    </Link>
                </Text>
            </Box>

            <BottomNav />
        </Box>
    );
}
