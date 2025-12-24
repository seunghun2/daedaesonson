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
                link: '/glossary/bongandang',
            },
            {
                term: '수목장',
                Icon: Trees,
                simple: '나무 아래에 유골을 묻는 자연장',
                link: '/glossary/sumokjang',
            },
            {
                term: '자연장',
                Icon: Leaf,
                simple: '자연으로 돌려보내는 친환경 장법',
                link: '/glossary/jayeonjang',
            },
            {
                term: '공원묘지',
                Icon: ParkingSquare,
                simple: '공원처럼 조성된 묘지',
                link: '/glossary/gongwonmyoji',
            },
            {
                term: '추모공원',
                Icon: Mountain,
                simple: '종합 장묘시설',
                link: '/glossary/chumogongwon',
            },
            {
                term: '잔디장',
                Icon: Shrub,
                simple: '잔디밭 아래에 유골을 묻는 것',
                link: '/glossary/jandijang',
            },
        ],
    },
    {
        category: '장례 절차',
        icon: TreePine,
        color: '#1D0098',
        terms: [
            {
                term: '화장',
                Icon: Flame,
                simple: '시신을 유골로 만드는 것',
                link: '/glossary/hwajang',
            },
            {
                term: '안치 / 봉안',
                Icon: Heart,
                simple: '유골을 시설에 모시는 것',
                link: '/glossary/anchi',
            },
            {
                term: '봉안함',
                Icon: BoxIcon,
                simple: '유골을 담는 용기',
                link: '/glossary/bonganham',
            },
            {
                term: '합장',
                Icon: Users,
                simple: '두 분 이상을 함께 모시는 것',
                link: '/glossary/hapjang',
            },
            {
                term: '납골',
                Icon: Archive,
                simple: '유골을 봉안함에 담는 것',
                link: '/glossary/napgol',
            },
        ],
    },
    {
        category: '묘지 이전',
        icon: Shovel,
        color: '#1D0098',
        terms: [
            {
                term: '이장',
                Icon: Truck,
                simple: '묘를 다른 곳으로 옮기는 것',
                link: '/glossary/ijang',
            },
            {
                term: '개장',
                Icon: Pickaxe,
                simple: '묘를 열어 유골을 수습하는 것',
                link: '/glossary/ijang',
            },
        ],
    },
    {
        category: '비용',
        icon: Banknote,
        color: '#1D0098',
        terms: [
            {
                term: '사용료',
                Icon: Wallet,
                simple: '안치 공간 이용 비용',
                link: '/glossary/biyong',
            },
            {
                term: '관리비',
                Icon: FileText,
                simple: '시설 유지관리 비용',
                link: '/glossary/biyong',
            },
            {
                term: '영구사용',
                Icon: Infinity,
                simple: '기간 제한 없이 계속 사용',
                link: '/glossary/biyong',
            },
            {
                term: '기간제',
                Icon: Clock,
                simple: '일정 기간 사용 후 갱신',
                link: '/glossary/biyong',
            },
        ],
    },
];

type TermType = {
    term: string;
    Icon: React.ComponentType<{ size?: number; color?: string }>;
    simple: string;
    link: string | null;
};

export default function GlossaryPage() {
    const [selectedTerm, setSelectedTerm] = useState<TermType | null>(null);
    const brandColor = '#1D0098';

    const handleSelect = (term: TermType) => {
        if (term.link) {
            // 상세 페이지가 있으면 이동
            window.location.href = term.link;
        } else {
            // 없으면 모달
            if (selectedTerm?.term === term.term) {
                setSelectedTerm(null);
            } else {
                setSelectedTerm(term);
            }
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

            {/* 모달 팝업 */}
            {selectedTerm && (
                <Box
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        zIndex: 200,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 20,
                        animation: 'fadeIn 0.2s ease',
                    }}
                    onClick={() => setSelectedTerm(null)}
                >
                    <Box
                        bg="white"
                        p="xl"
                        style={{
                            borderRadius: 24,
                            maxWidth: 360,
                            width: '100%',
                            animation: 'slideUp 0.3s ease',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Box ta="center" mb="lg">
                            <Box
                                style={{
                                    width: 80,
                                    height: 80,
                                    borderRadius: 24,
                                    backgroundColor: `${brandColor}12`,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <selectedTerm.Icon size={40} color={brandColor} />
                            </Box>
                        </Box>

                        <Text size="xl" fw={700} ta="center" mb={4}>
                            {selectedTerm.term}
                        </Text>
                        <Text size="sm" c="dimmed" ta="center" mb="lg">
                            {selectedTerm.simple}
                        </Text>

                        <Box bg="gray.0" p="md" style={{ borderRadius: 16 }}>
                            <Text size="sm" c="dark.6" lh={1.8}>
                                상세 설명 페이지 준비 중입니다.
                            </Text>
                        </Box>

                        <Box
                            mt="lg"
                            py="sm"
                            ta="center"
                            style={{
                                backgroundColor: brandColor,
                                borderRadius: 12,
                                cursor: 'pointer',
                            }}
                            onClick={() => setSelectedTerm(null)}
                        >
                            <Text size="sm" fw={500} c="white">확인</Text>
                        </Box>
                    </Box>
                </Box>
            )}

            <style jsx global>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
            `}</style>

            {/* 안내 문구 */}
            <Box p="md" bg="white" mb="sm">
                <Text size="sm" fw={500} mb={4}>장묘 용어가 어려우셨나요?</Text>
                <Text size="xs" c="dimmed">
                    용어를 탭하면 쉬운 설명을 볼 수 있어요.
                </Text>
            </Box>

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
                                    const hasDetail = !!term.link;
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
                                            onClick={() => handleSelect(term)}
                                        >
                                            <Group gap="xs" wrap="nowrap">
                                                <TermIcon size={18} color={isSelected ? group.color : '#868e96'} />
                                                <Box style={{ flex: 1, minWidth: 0 }}>
                                                    <Group gap={4}>
                                                        <Text size="xs" fw={600} truncate c={isSelected ? 'dark' : 'dark.6'}>
                                                            {term.term}
                                                        </Text>
                                                        {hasDetail && (
                                                            <Text size="8px" c="brand" fw={600}>상세</Text>
                                                        )}
                                                    </Group>
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
