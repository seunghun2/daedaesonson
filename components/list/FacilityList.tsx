'use client';

import { ActionIcon, Affix, Transition, Stack, Text, Box, ScrollArea, Center, Loader, Button } from '@mantine/core';
import { useWindowScroll, useMediaQuery } from '@mantine/hooks';
import { ArrowUp } from 'lucide-react';
import { Facility } from '@/types';
import FacilityCard from './FacilityCard';
import { useState, useEffect, useRef } from 'react';

interface FacilityListProps {
    facilities: Facility[];
    loading?: boolean;
    onFacilityClick: (facility: Facility) => void;
    selectedId?: string | null;
}

export default function FacilityList({ facilities, loading, onFacilityClick, selectedId }: FacilityListProps) {
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
                <Loader size="lg" />
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
                    <Text size="sm" c="dimmed" fw={500}>
                        검색 결과 {facilities.length}개
                    </Text>
                    {visibleFacilities.map((fac) => (
                        <Box
                            key={fac.id}
                            onClick={() => onFacilityClick(fac)}
                            style={{
                                cursor: 'pointer',
                                border: selectedId === fac.id ? '2px solid #228be6' : '2px solid transparent',
                                borderRadius: '8px',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <FacilityCard facility={fac} onClick={() => { }} />
                        </Box>
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
                        style={{ ...transitionStyles, position: 'absolute', bottom: 20, right: 20, zIndex: 100 }}
                        variant="filled"
                        color="brand"
                        size="xl"
                        radius="xl"
                        onClick={scrollToTop}
                        aria-label="맨 위로"
                    >
                        <ArrowUp size={20} />
                    </ActionIcon>
                )}
            </Transition>
        </Box>
    );
}
