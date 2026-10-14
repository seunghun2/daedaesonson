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
    isLoggedIn = false,
    favoritesCount = 0,
    onOpenLogin,
    onOpenMyInfo,
}: FacilityListProps) {
    const [visibleCount, setVisibleCount] = useState(20);
    const viewportRef = useRef<HTMLDivElement>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);
    const [scrollPosition, setScrollPosition] = useState({ y: 0 });
    const [historyCount, setHistoryCount] = useState(0);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            const raw = localStorage.getItem('facilityHistory');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) setHistoryCount(parsed.length);
            }
        } catch {
            // ignore
        }
    }, [selectedId, compareIds.length]);

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
                <Loader size="md" color="blue" />
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
    const hasUnsavedActivity = historyCount > 0 || compareIds.length > 0;

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

                    {/* 홈페이지 회원 전용 혜택 & 내 관심장지 영구 보관 배너 */}
                    {!isLoggedIn && onOpenLogin && (
                        <div
                            style={{
                                margin: '10px 14px 4px',
                                padding: '13px 14px',
                                borderRadius: 14,
                                background: hasUnsavedActivity
                                    ? 'linear-gradient(135deg, #EFF6FF 0%, #F8FAFC 100%)'
                                    : '#F8FAFC',
                                border: hasUnsavedActivity ? '1px solid #BFDBFE' : '1px solid #E2E8F0',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 8,
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                <span
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 4,
                                        padding: '3px 8px',
                                        borderRadius: 999,
                                        backgroundColor: hasUnsavedActivity ? '#2563EB' : '#EFF6FF',
                                        color: hasUnsavedActivity ? '#FFFFFF' : '#2563EB',
                                        border: hasUnsavedActivity ? 'none' : '1px solid #DBEAFE',
                                        fontSize: 11,
                                        fontWeight: 700,
                                        letterSpacing: '-0.2px',
                                    }}
                                >
                                    {hasUnsavedActivity ? <BookmarkCheck size={12} /> : <ShieldCheck size={12} />}
                                    <span>
                                        {hasUnsavedActivity
                                            ? `방금 본 장지 ${historyCount}곳${compareIds.length > 0 ? ` · 비교함 ${compareIds.length}곳` : ''} 임시 기록 중`
                                            : '아이디·비번 없는 3초 무료 혜택'}
                                    </span>
                                </span>
                                <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B' }}>
                                    회원 전용 무료
                                </span>
                            </div>

                            <div style={{ fontSize: 13.5, fontWeight: 800, color: '#191F28', letterSpacing: '-0.3px', lineHeight: 1.35 }}>
                                {hasUnsavedActivity
                                    ? '창을 닫으면 비교·열람한 장지 기록이 사라져요'
                                    : '장지 알아볼 때 3초 로그인하면 좋은 이유'}
                            </div>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                                {[
                                    '15·30년 관리비 포함 총비용 계산',
                                    '관심장지·비교함 영구 보관',
                                    '무료 답사·상담 자동 입력',
                                ].map((tag) => (
                                    <span
                                        key={tag}
                                        style={{
                                            fontSize: 11,
                                            fontWeight: 600,
                                            color: '#334155',
                                            backgroundColor: '#FFFFFF',
                                            border: '1px solid #E2E8F0',
                                            padding: '3px 8px',
                                            borderRadius: 6,
                                            letterSpacing: '-0.2px',
                                        }}
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    onOpenLogin(
                                        hasUnsavedActivity
                                            ? `방금 둘러보신 장지 ${Math.max(historyCount, compareIds.length)}곳을 내 계정에 영구 보관하고 15·30년 총비용 리포트를 활성화합니다.`
                                            : '시설별 15·30년 관리비 포함 총비용 리포트 열람 및 내 관심장지 보관함을 활성화합니다.'
                                    )
                                }
                                style={{
                                    marginTop: 2,
                                    width: '100%',
                                    height: 38,
                                    borderRadius: 10,
                                    border: 'none',
                                    backgroundColor: '#2563EB',
                                    color: '#FFFFFF',
                                    fontSize: 12.5,
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 6,
                                    letterSpacing: '-0.2px',
                                    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.22)',
                                }}
                            >
                                <span>
                                    {hasUnsavedActivity
                                        ? '3초 로그인하고 본 시설 내 계정에 영구 보관하기'
                                        : '카카오·휴대폰 3초 로그인하고 혜택 켜기'}
                                </span>
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    )}

                    {/* 로그인 상태일 때 내 관심장지 보관함 빠른 진입 바 */}
                    {isLoggedIn && onOpenMyInfo && (
                        <div
                            onClick={onOpenMyInfo}
                            style={{
                                margin: '10px 14px 4px',
                                padding: '10px 14px',
                                borderRadius: 12,
                                backgroundColor: '#EFF6FF',
                                border: '1px solid #DBEAFE',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                cursor: 'pointer',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <BookmarkCheck size={16} color="#2563EB" />
                                <span style={{ fontSize: 12.5, fontWeight: 700, color: '#1E3A8A', letterSpacing: '-0.2px' }}>
                                    내 관심장지 보관함 <strong style={{ color: '#2563EB' }}>{favoritesCount}곳</strong> · 15·30년 총비용 리포트 활성화됨
                                </span>
                            </div>
                            <span style={{ fontSize: 11.5, fontWeight: 700, color: '#2563EB', display: 'inline-flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                                보관함 <ChevronRight size={13} />
                            </span>
                        </div>
                    )}

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

