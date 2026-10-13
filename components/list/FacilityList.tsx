'use client';

import { ActionIcon, Affix, Transition, Stack, Text, Box, ScrollArea, Center, Loader, Button, Checkbox } from '@mantine/core';
import { useWindowScroll, useMediaQuery } from '@mantine/hooks';
import { ArrowUp } from 'lucide-react';
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
                backgroundColor: isSelected ? '#F0F6FF' : '#FFFFFF',
                borderBottom: '1px solid #F2F4F6',
                borderLeft: isSelected ? '3px solid #2563EB' : '3px solid transparent',
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
            <Center h="100%">
                <Loader size="md" color="blue" />
            </Center>
        );
    }

    if (facilities.length === 0) {
        return (
            <Center h="100%" px="md">
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
        <Box pos="relative" h="100%" bg="#FFFFFF">
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
                            조회된 시설 <span style={{ color: '#2563EB', fontWeight: 700 }}>{facilities.length.toLocaleString()}</span>곳
                        </Text>
                        {setHideInquiry && (
                            <Checkbox
                                label="가격문의 제외"
                                checked={hideInquiry ?? false}
                                onChange={() => setHideInquiry(!hideInquiry)}
                                size="xs"
                                color="blue"
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

                    {/* 하단 여백 */}
                    <Box h={96} />
                </Stack>
            </ScrollArea>

            <Transition transition="slide-up" mounted={scrollPosition.y > 160}>
                {(transitionStyles) => (
                    <ActionIcon
                        style={{
                            ...transitionStyles,
                            position: 'absolute',
                            bottom: 80,
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

