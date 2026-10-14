'use client';

import { ActionIcon, Transition, Stack, Text, Box, ScrollArea, Center, Loader, Button, Checkbox } from '@mantine/core';
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
    isLoggedIn?: boolean;
    favoritesCount?: number;
    onOpenLogin?: (reason?: string) => void;
    onOpenMyInfo?: () => void;
}

interface FacilityListItemProps {
    facility: Facility;
    isSelected: boolean;
    onSelect: (f: Facility) => void;
}

const FacilityListItem = memo(function FacilityListItem({ facility, isSelected, onSelect }: FacilityListItemProps) {
    const handleClick = useCallback(() => {
        onSelect(facility);
    }, [facility, onSelect]);

    return (
        <Box
            onClick={handleClick}
            style={{
                cursor: 'pointer',
                border: isSelected ? '2px solid #191F28' : '2px solid transparent',
                borderRadius: '8px',
                transition: 'border-color 0.15s ease',
                contain: 'content',
            }}
        >
            <FacilityCard facility={facility} onClick={handleClick} />
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
}: FacilityListProps) {
    const [visibleCount, setVisibleCount] = useState(20);
    const viewportRef = useRef<HTMLDivElement>(null);
    const [scrollPosition, setScrollPosition] = useState({ y: 0 });

    const scrollToTop = () => {
        viewportRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // 검색 결과가 바뀌면 초기화
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setVisibleCount(20);
    }, [facilities]);

    const handleLoadMore = () => {
        setVisibleCount((prev) => prev + 20);
    };

    if (loading) {
        return (
            <Center h="100%">
                <Loader size="lg" color="dark" />
            </Center>
        );
    }

    if (facilities.length === 0) {
        return (
            <Center h="100%" px="md">
                <Text c="dimmed" ta="center">
                    현재 지도 범위 내에<br />시설이 없습니다.
                </Text>
            </Center>
        );
    }

    const visibleFacilities = facilities.slice(0, visibleCount);

    return (
        <Box pos="relative" h="100%">
            <ScrollArea h="100%" viewportRef={viewportRef} onScrollPositionChange={setScrollPosition} scrollbarSize={8} offsetScrollbars>
                <Stack p="md" gap="md">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text size="sm" c="dimmed" fw={500}>검색 결과 {facilities.length}개</Text>
                        {setHideInquiry && (
                            <Checkbox
                                label="문의시설 제외"
                                checked={hideInquiry ?? false}
                                onChange={() => setHideInquiry(!hideInquiry)}
                                size="xs"
                                color="dark"
                                styles={{ label: { fontSize: '12px', cursor: 'pointer', color: '#868e96', paddingLeft: 6 }, input: { cursor: 'pointer' } }}
                            />
                        )}
                    </div>
                    {visibleFacilities.map((fac) => (
                        <FacilityListItem
                            key={fac.id}
                            facility={fac}
                            isSelected={selectedId === fac.id}
                            onSelect={onFacilityClick}
                        />
                    ))}

                    {/* 더 보기 버튼 */}
                    {visibleCount < facilities.length && (
                        <Button
                            variant="light"
                            color="gray"
                            fullWidth
                            onClick={handleLoadMore}
                            mt="md"
                        >
                            더 보기 ({Math.min(facilities.length - visibleCount, 20)}개)
                        </Button>
                    )}

                    {/* 하단 여백 */}
                    <Box h={100} />
                </Stack>
            </ScrollArea>

            <Transition transition="slide-up" mounted={scrollPosition.y > 100}>
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
                        color="dark"
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
