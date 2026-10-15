'use client';

import { useState, useEffect } from 'react';
import { Box, Text, Group, Stack, ActionIcon } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { Clock, Trash2, ChevronLeft, BookmarkCheck } from 'lucide-react';
import Image from 'next/image';
import BottomNav from '@/components/common/BottomNav';
import { FACILITY_CATEGORY_LABELS } from '@/types';
import { getFacilityImageUrl } from '@/lib/supabaseImage';
import { useAuth } from '@/components/auth/AuthProvider';
import LoginModal from '@/components/auth/LoginModal';

interface HistoryItem {
    id: string;
    name: string;
    address: string;
    category: string;
    minPrice: number;
    isPublic?: boolean;
    thumbnail?: string;
    visitedAt: number;
}

const CATEGORY_BADGE_PALETTE: Record<string, { bg: string; text: string }> = {
    CHARNEL_HOUSE: { bg: '#F2F4F6', text: '#4E5968' },
    NATURAL_BURIAL: { bg: '#F2F4F6', text: '#4E5968' },
    FAMILY_GRAVE: { bg: '#F2F4F6', text: '#4E5968' },
    CREMATORIUM: { bg: '#F2F4F6', text: '#4E5968' },
    FUNERAL_HOME: { bg: '#F2F4F6', text: '#4E5968' },
    OTHER: { bg: '#F2F4F6', text: '#4E5968' },
};

// 가격 포맷
const formatPrice = (price: number): { text: string; hasPrice: boolean } => {
    if (!price || price <= 0) return { text: '가격문의', hasPrice: false };
    const manwon = price < 10000 ? price : Math.round(price / 10000);
    return { text: `${manwon.toLocaleString()}만원~`, hasPrice: true };
};

export default function HistoryPage() {
    const router = useRouter();
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [publicMap, setPublicMap] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const stored = localStorage.getItem('facilityHistory');
        if (stored) {
            try {
                setHistory(JSON.parse(stored));
            } catch { }
        }

        // 캐시된 시설 데이터에서 공설/사설 여부 보강
        try {
            const cached = typeof window !== 'undefined' ? sessionStorage.getItem('facilitiesCache') : null;
            if (cached) {
                const parsed = JSON.parse(cached);
                const list = parsed.facilities || parsed || [];
                if (Array.isArray(list)) {
                    const map: Record<string, boolean> = {};
                    list.forEach((f: any) => {
                        if (f && f.id !== undefined) {
                            map[String(f.id)] = !!f.isPublic;
                        }
                    });
                    setPublicMap(map);
                }
            }
        } catch { }
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

    const resolveIsPublic = (item: HistoryItem): boolean => {
        if (typeof item.isPublic === 'boolean') return item.isPublic;
        if (publicMap[String(item.id)] !== undefined) return publicMap[String(item.id)];
        return /(공설|시립|구립|군립|도립|국립)/.test(item.name || '');
    };

    return (
        <Box
            style={{
                minHeight: '100dvh',
                backgroundColor: '#F2F4F6',
                paddingBottom: 'calc(76px + env(safe-area-inset-bottom))',
            }}
        >
            <Box style={{ maxWidth: 640, margin: '0 auto' }}>
                {/* 헤더 */}
                <Box
                    px="md"
                    py={12}
                    style={{
                        backgroundColor: 'white',
                        borderBottom: '1px solid #E5E8EB',
                        position: 'sticky',
                        top: 0,
                        zIndex: 100,
                    }}
                >
                    <Group justify="space-between" align="center">
                        <Group gap="xs" align="center">
                            <ActionIcon
                                variant="subtle"
                                color="gray"
                                size={38}
                                radius="md"
                                onClick={() => {
                                    if (typeof window !== 'undefined' && window.history.length <= 1) {
                                        router.push('/menu');
                                    } else {
                                        router.back();
                                    }
                                }}
                                aria-label="뒤로가기"
                            >
                                <ChevronLeft size={22} color="#191F28" />
                            </ActionIcon>
                            <Text size="lg" fw={700} c="#191F28" style={{ letterSpacing: '-0.3px' }}>
                                최근 본 시설
                            </Text>
                        </Group>
                        {history.length > 0 && (
                            <Text
                                size="xs"
                                fw={600}
                                c="#8B95A1"
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
                    <Box ta="center" py={100} px="md">
                        <Clock size={44} color="#D1D6DB" style={{ margin: '0 auto' }} />
                        <Text size="md" fw={600} c="#4E5968" mt="md">
                            아직 둘러본 시설이 없어요
                        </Text>
                        <Text size="xs" c="#8B95A1" mt={6}>
                            시설을 탭하면 최근 본 시설에 자동으로 기록됩니다
                        </Text>
                    </Box>
                ) : (
                    <Stack gap={10} p="md">
                        <Text size="xs" fw={700} c="#6B7684" px={2}>
                            전체 <span style={{ color: '#2563EB' }}>{history.length}</span>개
                        </Text>
                        {history.map((item) => {
                            const thumbUrl = getFacilityImageUrl(item.thumbnail);
                            const isPublic = resolveIsPublic(item);
                            const catPalette = CATEGORY_BADGE_PALETTE[item.category] || CATEGORY_BADGE_PALETTE.OTHER;
                            const priceInfo = formatPrice(item.minPrice);

                            return (
                                <Box
                                    key={item.id}
                                    p={14}
                                    bg="white"
                                    style={{
                                        borderRadius: 16,
                                        cursor: 'pointer',
                                        border: '1px solid rgba(15, 23, 42, 0.06)',
                                        transition: 'transform 0.15s ease',
                                    }}
                                    onClick={() => router.push(`/facility/${item.id}`)}
                                >
                                    <Group wrap="nowrap" gap={14} align="stretch">
                                        {/* 88x88 라운드 썸네일 + 공설/사설 배지 */}
                                        <Box
                                            style={{
                                                width: 88,
                                                height: 88,
                                                borderRadius: 12,
                                                overflow: 'hidden',
                                                backgroundColor: '#F2F4F6',
                                                border: '1px solid rgba(15, 23, 42, 0.07)',
                                                flexShrink: 0,
                                                position: 'relative',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            {thumbUrl ? (
                                                <img
                                                    src={thumbUrl}
                                                    alt={item.name}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <Image
                                                    src="/logo-horizontal.svg"
                                                    alt="대대손손"
                                                    width={48}
                                                    height={20}
                                                    style={{ opacity: 0.25, filter: 'grayscale(100%)' }}
                                                />
                                            )}

                                            {/* 공설/사설 배지 */}
                                            <Box
                                                pos="absolute"
                                                top={6}
                                                left={6}
                                                style={{
                                                    backgroundColor: isPublic ? 'rgba(37, 99, 235, 0.92)' : 'rgba(25, 31, 40, 0.78)',
                                                    backdropFilter: 'blur(4px)',
                                                    color: '#FFFFFF',
                                                    fontSize: '10px',
                                                    fontWeight: 700,
                                                    padding: '2px 6px',
                                                    borderRadius: '5px',
                                                    lineHeight: 1.3,
                                                    letterSpacing: '-0.2px',
                                                }}
                                            >
                                                {isPublic ? '공설' : '사설'}
                                            </Box>
                                        </Box>

                                        {/* 정보 */}
                                        <Box
                                            style={{
                                                flex: 1,
                                                minWidth: 0,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'space-between',
                                                paddingTop: 1,
                                                paddingBottom: 1,
                                            }}
                                        >
                                            <Box>
                                                <Group gap={6} mb={4} wrap="nowrap">
                                                    <span
                                                        style={{
                                                            display: 'inline-block',
                                                            backgroundColor: catPalette.bg,
                                                            color: catPalette.text,
                                                            fontSize: '11px',
                                                            fontWeight: 700,
                                                            padding: '2px 7px',
                                                            borderRadius: '5px',
                                                            lineHeight: 1.35,
                                                            letterSpacing: '-0.2px',
                                                            flexShrink: 0,
                                                        }}
                                                    >
                                                        {(FACILITY_CATEGORY_LABELS as Record<string, string>)[item.category] || item.category}
                                                    </span>
                                                    <Text size="xs" c="#8B95A1" style={{ fontSize: '11px' }}>
                                                        {new Date(item.visitedAt).toLocaleDateString('ko-KR', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                        })}
                                                    </Text>
                                                </Group>
                                                <Text
                                                    fw={700}
                                                    lineClamp={1}
                                                    style={{
                                                        fontSize: '15px',
                                                        color: '#191F28',
                                                        letterSpacing: '-0.3px',
                                                        lineHeight: 1.3,
                                                    }}
                                                >
                                                    {item.name}
                                                </Text>
                                                <Text
                                                    size="xs"
                                                    c="#6B7684"
                                                    lineClamp={1}
                                                    mt={2}
                                                    style={{ fontSize: '12px' }}
                                                >
                                                    {item.address}
                                                </Text>
                                            </Box>

                                            <Group gap={4} align="baseline" mt={4}>
                                                {priceInfo.hasPrice && (
                                                    <Text
                                                        component="span"
                                                        style={{
                                                            fontSize: '11px',
                                                            fontWeight: 600,
                                                            color: '#8B95A1',
                                                        }}
                                                    >
                                                        대표가격
                                                    </Text>
                                                )}
                                                <Text
                                                    fw={800}
                                                    style={{
                                                        fontSize: priceInfo.hasPrice ? '16px' : '14px',
                                                        color: priceInfo.hasPrice ? '#2563EB' : '#8B95A1',
                                                        letterSpacing: '-0.4px',
                                                    }}
                                                >
                                                    {priceInfo.text}
                                                </Text>
                                            </Group>
                                        </Box>

                                        {/* 삭제 버튼 */}
                                        <ActionIcon
                                            variant="subtle"
                                            color="gray"
                                            size={36}
                                            radius="md"
                                            aria-label="기록 삭제"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeItem(item.id);
                                            }}
                                            style={{ alignSelf: 'center', flexShrink: 0, color: '#8B95A1' }}
                                        >
                                            <Trash2 size={16} />
                                        </ActionIcon>
                                    </Group>
                                </Box>
                            );
                        })}
                    </Stack>
                )}
            </Box>

            {/* 하단 탭바 */}
            <BottomNav historyCount={history.length} />
        </Box>
    );
}
