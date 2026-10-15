'use client';

import { ActionIcon, Affix, Transition, Stack, Text, Box, ScrollArea, Center, Loader, Button, Checkbox } from '@mantine/core';
import { useWindowScroll, useMediaQuery } from '@mantine/hooks';
import { ArrowUp, BookmarkCheck, Calculator, ChevronRight, ShieldCheck } from 'lucide-react';
import { Facility } from '@/types';
import FacilityCard from './FacilityCard';
import { useState, useEffect, useRef, memo, useCallback } from 'react';

interface FacilityListProps {
    facilities: Facility[];
    loading?: boolean;
    onFacilityClick: (facility: Facility) => void;
    selectedId?: string | null;
    hideInquiry?: boolean;
    setHideInquiry?: (val: boolean) => void;
    compareIds?: string[];
    onToggleCompare?: (facility: Facility, e: React.MouseEvent) => void;
    isLoggedIn?: boolean;
    favoritesCount?: number;
    onOpenLogin?: (reason?: string) => void;
    onOpenMyInfo?: () => void;
}

interface FacilityListItemProps {
    facility: Facility;
    isSelected: boolean;
    onSelect: (f: Facility) => void;
    isCompared?: boolean;
    onToggleCompare?: (facility: Facility, e: React.MouseEvent) => void;
}

const FacilityListItem = memo(function FacilityListItem({
    facility,
    isSelected,
    onSelect,
    isCompared = false,
    onToggleCompare,
}: FacilityListItemProps) {
    const handleClick = useCallback(() => {
        onSelect(facility);
    }, [facility, onSelect]);

    return (
        <Box
            className="facility-card-item"
            onClick={handleClick}
            style={{
                cursor: 'pointer',
                padding: '14px 16px',
                backgroundColor: isSelected ? '#F8FAFC' : '#FFFFFF',
                borderBottom: '1px solid #F2F4F6',
                borderLeft: isSelected ? '3px solid #191F28' : '3px solid transparent',
                transition: 'background-color 0.15s ease, border-color 0.15s ease',
                contain: 'content',
            }}
        >
            <FacilityCard
                facility={facility}
                onClick={handleClick}
                isCompared={isCompared}
                onToggleCompare={onToggleCompare}
            />
        </Box>
    );
});

export default function FacilityList({
    facilities,
    loading,
    onFacilityClick,
    selectedId,
    hideInquiry,
    setHideInquiry,
    compareIds = [],
    onToggleCompare,
}: FacilityListProps) {
    const [visibleCount, setVisibleCount] = useState(20);
    const viewportRef = useRef<HTMLDivElement>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);
    const [scrollPosition, setScrollPosition] = useState({ y: 0 });

    const scrollToTop = () => {
        viewportRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // 검색 결과가 바뀌면 초기화
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setVisibleCount(20);
    }, [facilities]);

    const handleLoadMore = useCallback(() => {
        setVisibleCount((prev) => Math.min(prev + 20, facilities.length));
    }, [facilities.length]);

    // 무한 스크롤 IntersectionObserver
    useEffect(() => {
        const el = sentinelRef.current;
        if (!el || visibleCount >= facilities.length) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) {
                    handleLoadMore();
                }
            },
            { root: viewportRef.current, rootMargin: '240px' }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [visibleCount, facilities.length, handleLoadMore]);

    if (loading) {
        return (
            <Center h="100%" style={{ flex: 1, minHeight: 0 }}>
                <Loader size="md" color="dark" />
            </Center>
        );
    }

    if (facilities.length === 0) {
        return (
            <Center h="100%" px="md" style={{ flex: 1, minHeight: 0 }}>
                <Box ta="center">
                    <Text c="#4E5968" fw={700} size="sm" mb={4}>
                        조건에 맞는 시설이 없습니다
                    </Text>
                    <Text c="#8B95A1" size="xs">
                        지도를 이동하거나 필터 조건을 변경해 보세요.
                    </Text>
                </Box>
            </Center>
        );
    }

    const visibleFacilities = facilities.slice(0, visibleCount);

    return (
        <Box pos="relative" h="100%" bg="#FFFFFF" style={{ flex: 1, minHeight: 0 }}>
            <ScrollArea h="100%" viewportRef={viewportRef} onScrollPositionChange={setScrollPosition} scrollbarSize={6} offsetScrollbars={false}>
                <Stack p={0} gap={0}>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '10px 16px',
                            borderBottom: '1px solid #F2F4F6',
                            backgroundColor: '#FFFFFF',
                        }}
                    >
                        <Text size="xs" c="#6B7684" fw={600}>
                            조회된 시설 <span style={{ color: '#191F28', fontWeight: 700 }}>{facilities.length.toLocaleString()}</span>곳
                        </Text>
                        {setHideInquiry && (
                            <Checkbox
                                label="가격문의 제외"
                                checked={hideInquiry ?? false}
                                onChange={() => setHideInquiry(!hideInquiry)}
                                size="xs"
                                color="brand"
                                styles={{
                                    label: { fontSize: '12px', fontWeight: 600, cursor: 'pointer', color: '#4E5968', paddingLeft: 6 },
                                    input: { cursor: 'pointer', borderRadius: '4px' },
                                }}
                            />
                        )}
                    </div>

                    {visibleFacilities.map((fac) => (
                        <FacilityListItem
                            key={fac.id}
                            facility={fac}
                            isSelected={selectedId === fac.id}
                            onSelect={onFacilityClick}
                            isCompared={compareIds.includes(fac.id)}
                            onToggleCompare={onToggleCompare}
                        />
                    ))}

                    {/* 무한 스크롤 센티널 + 보조 더보기 버튼 */}
                    {visibleCount < facilities.length && (
                        <Box ref={sentinelRef} px={16} pt={14}>
                            <Button
                                variant="light"
                                color="gray"
                                fullWidth
                                radius="md"
                                onClick={handleLoadMore}
                                styles={{
                                    root: {
                                        backgroundColor: '#F2F4F6',
                                        color: '#4E5968',
                                        fontWeight: 700,
                                        fontSize: '13px',
                                        height: '42px',
                                    },
                                }}
                            >
                                시설 더보기 ({Math.min(facilities.length - visibleCount, 20)}곳)
                            </Button>
                        </Box>
                    )}

                    {/* 하단 빠른 링크 & 제휴문의 푸터 */}
                    <Box px={16} pt={20} pb={32}>
                        <Box
                            p={14}
                            style={{
                                backgroundColor: '#F8FAFC',
                                borderRadius: 12,
                                border: '1px solid #EEF1F5',
                                textAlign: 'center',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: 8 }}>
                                <a
                                    href="/partnership"
                                    style={{
                                        padding: '6px 12px',
                                        borderRadius: 8,
                                        backgroundColor: '#FFFFFF',
                                        border: '1px solid #DBEAFE',
                                        color: '#2563EB',
                                        fontSize: 12,
                                        fontWeight: 700,
                                        textDecoration: 'none',
                                    }}
                                >
                                    광고/제휴 문의
                                </a>
                                <a
                                    href="/contact"
                                    style={{
                                        padding: '6px 12px',
                                        borderRadius: 8,
                                        backgroundColor: '#FFFFFF',
                                        border: '1px solid #E2E8F0',
                                        color: '#475569',
                                        fontSize: 12,
                                        fontWeight: 600,
                                        textDecoration: 'none',
                                    }}
                                >
                                    1:1 문의하기
                                </a>
                                <a
                                    href="/about"
                                    style={{
                                        padding: '6px 12px',
                                        borderRadius: 8,
                                        backgroundColor: '#FFFFFF',
                                        border: '1px solid #E2E8F0',
                                        color: '#475569',
                                        fontSize: 12,
                                        fontWeight: 600,
                                        textDecoration: 'none',
                                    }}
                                >
                                    서비스 소개
                                </a>
                            </div>
                            <Text size="11px" c="#94A3B8" fw={500}>
                                대대손손 · 전국 추모시설 가격비교 플랫폼
                            </Text>
                        </Box>
                    </Box>
                </Stack>
            </ScrollArea>

            <Transition transition="slide-up" mounted={scrollPosition.y > 160}>
                {(transitionStyles) => (
                    <ActionIcon
                        style={{
                            ...transitionStyles,
                            position: 'absolute',
                            bottom: 18,
                            right: 16,
                            zIndex: 100,
                            backgroundColor: '#191F28',
                            boxShadow: '0 4px 14px rgba(15, 23, 42, 0.22)',
                        }}
                        variant="filled"
                        size="lg"
                        radius="xl"
                        onClick={scrollToTop}
                        aria-label="맨 위로"
                    >
                        <ArrowUp size={18} color="#FFFFFF" />
                    </ActionIcon>
                )}
            </Transition>
        </Box>
    );
}

