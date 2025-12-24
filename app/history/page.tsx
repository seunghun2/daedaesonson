'use client';

import { useState, useEffect } from 'react';
import { Box, Text, Group, Stack, Badge } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { Clock, Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import BottomNav from '@/components/common/BottomNav';
import { FACILITY_CATEGORY_LABELS } from '@/types';

interface HistoryItem {
    id: string;
    name: string;
    address: string;
    category: string;
    minPrice: number;
    thumbnail?: string;
    visitedAt: number;
}

// 가격 포맷
const formatPrice = (price: number) => {
    if (!price || price <= 0) return '문의';
    const manwon = price < 10000 ? price : Math.round(price / 10000);
    return `${manwon.toLocaleString()}만원~`;
};

export default function HistoryPage() {
    const router = useRouter();
    const [history, setHistory] = useState<HistoryItem[]>([]);

    useEffect(() => {
        const stored = localStorage.getItem('facilityHistory');
        if (stored) {
            try {
                setHistory(JSON.parse(stored));
            } catch { }
        }
    }, []);

    const clearHistory = () => {
        localStorage.removeItem('facilityHistory');
        setHistory([]);
    };

    const removeItem = (id: string) => {
        const updated = history.filter(h => h.id !== id);
        localStorage.setItem('facilityHistory', JSON.stringify(updated));
        setHistory(updated);
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
                <Group justify="space-between" align="center">
                    <Group gap="sm">
                        <Link href="/" style={{ display: 'flex', alignItems: 'center' }}>
                            <ArrowLeft size={20} color="#495057" />
                        </Link>
                        <Text size="lg" fw={700}>기록</Text>
                    </Group>
                    {history.length > 0 && (
                        <Text
                            size="sm"
                            c="dimmed"
                            style={{ cursor: 'pointer' }}
                            onClick={clearHistory}
                        >
                            전체 삭제
                        </Text>
                    )}
                </Group>
            </Box>

            {/* 리스트 */}
            {history.length === 0 ? (
                <Box ta="center" py={100}>
                    <Clock size={48} color="#dee2e6" />
                    <Text size="lg" c="dimmed" mt="md">
                        아직 둘러본 시설이 없어요
                    </Text>
                    <Text size="sm" c="dimmed" mt={4}>
                        시설을 탭하면 여기에 기록됩니다
                    </Text>
                </Box>
            ) : (
                <Stack gap={0} p="md">
                    <Text size="xs" c="dimmed" mb="sm">
                        최근 본 시설 {history.length}개
                    </Text>
                    {history.map((item) => (
                        <Box
                            key={item.id}
                            p="sm"
                            mb="xs"
                            bg="white"
                            style={{
                                borderRadius: 12,
                                cursor: 'pointer',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                            }}
                            onClick={() => router.push(`/?id=${item.id}`)}
                        >
                            <Group wrap="nowrap" gap="sm">
                                {/* 썸네일 */}
                                <Box
                                    style={{
                                        width: 64,
                                        height: 64,
                                        borderRadius: 8,
                                        overflow: 'hidden',
                                        backgroundColor: '#f1f3f5',
                                        flexShrink: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    {item.thumbnail ? (
                                        <img
                                            src={item.thumbnail}
                                            alt={item.name}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <Image
                                            src="/logo-horizontal.svg"
                                            alt="로고"
                                            width={40}
                                            height={20}
                                            style={{ opacity: 0.3 }}
                                        />
                                    )}
                                </Box>

                                {/* 정보 */}
                                <Box style={{ flex: 1, minWidth: 0 }}>
                                    <Group gap={6} mb={4}>
                                        <Text size="sm" fw={600} lineClamp={1}>
                                            {item.name}
                                        </Text>
                                        <Badge size="xs" variant="light" color="gray">
                                            {FACILITY_CATEGORY_LABELS[item.category] || item.category}
                                        </Badge>
                                    </Group>
                                    <Text size="xs" c="dimmed" lineClamp={1}>
                                        {item.address}
                                    </Text>
                                    <Group justify="space-between" mt={4}>
                                        <Text size="sm" fw={600} c="brand.8">
                                            {formatPrice(item.minPrice)}
                                        </Text>
                                        <Text size="xs" c="dimmed">
                                            {new Date(item.visitedAt).toLocaleDateString('ko-KR', {
                                                month: 'short',
                                                day: 'numeric',
                                            })}
                                        </Text>
                                    </Group>
                                </Box>

                                {/* 삭제 버튼 */}
                                <Box
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeItem(item.id);
                                    }}
                                    style={{
                                        padding: 8,
                                        cursor: 'pointer',
                                    }}
                                >
                                    <Trash2 size={16} color="#adb5bd" />
                                </Box>
                            </Group>
                        </Box>
                    ))}
                </Stack>
            )}

            {/* 하단 탭바 */}
            <BottomNav historyCount={history.length} />
        </Box>
    );
}
