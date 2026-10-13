'use client';

import React, { useEffect, useState } from 'react';
import { Box, Text, Group, Modal, ScrollArea, Loader } from '@mantine/core';
import { Scale, X, Check, Minus, MapPin, Phone, ArrowRight, Trash2, Info, Building2, UserCheck } from 'lucide-react';
import NextImage from 'next/image';
import Link from 'next/link';
import { Facility, FACILITY_CATEGORY_LABELS } from '@/types';
import { formatKoreanCurrency } from '@/lib/format';
import { getFacilityImageUrl } from '@/lib/supabaseImage';
import { extractFacilityInsights, formatKoreanPrice } from '@/lib/derivedFacilityInsights';

interface CompareTrayProps {
    items: Facility[];
    onRemove: (id: string) => void;
    onClear: () => void;
    onOpenModal: () => void;
    isMobile?: boolean;
    hasSelectedDetail?: boolean;
}

export function CompareFloatingTray({
    items,
    onRemove,
    onClear,
    onOpenModal,
    isMobile = false,
    hasSelectedDetail = false,
}: CompareTrayProps) {
    if (items.length === 0) return null;

    return (
        <Box
            style={{
                position: 'fixed',
                bottom: isMobile ? 126 : 24,
                left: isMobile ? '50%' : hasSelectedDetail ? 'calc(400px + (100vw - 400px) / 2)' : 'calc(400px + (100vw - 400px) / 2)',
                transform: 'translateX(-50%)',
                zIndex: 1500,
                backgroundColor: 'rgba(25, 31, 40, 0.96)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderRadius: 16,
                padding: isMobile ? '10px 14px' : '12px 18px',
                boxShadow: '0 10px 30px rgba(15, 23, 42, 0.28)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                maxWidth: isMobile ? 'calc(100vw - 24px)' : 640,
            }}
        >
            <Group gap={8} wrap="nowrap" style={{ flex: 1, minWidth: 0, overflowX: 'auto' }} className="no-scrollbar">
                <Box
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '4px 10px',
                        borderRadius: 999,
                        backgroundColor: 'rgba(37, 99, 235, 0.25)',
                        border: '1px solid rgba(96, 165, 250, 0.4)',
                        flexShrink: 0,
                    }}
                >
                    <Scale size={13} color="#60A5FA" />
                    <Text style={{ fontSize: 12, fontWeight: 700, color: '#93C5FD', whiteSpace: 'nowrap' }}>
                        비교함 {items.length}/3
                    </Text>
                </Box>

                {items.map((item) => (
                    <Box
                        key={item.id}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '5px 10px',
                            borderRadius: 8,
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            flexShrink: 0,
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 12.5,
                                fontWeight: 600,
                                color: '#FFFFFF',
                                maxWidth: isMobile ? 90 : 120,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {item.name}
                        </Text>
                        <button
                            type="button"
                            onClick={() => onRemove(item.id)}
                            aria-label={`${item.name} 비교 제거`}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                cursor: 'pointer',
                                color: '#94A3B8',
                            }}
                        >
                            <X size={13} />
                        </button>
                    </Box>
                ))}
            </Group>

            <Group gap={6} wrap="nowrap" style={{ flexShrink: 0 }}>
                <button
                    type="button"
                    onClick={onClear}
                    title="비교함 비우기"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        border: '1px solid rgba(255,255,255,0.16)',
                        backgroundColor: 'rgba(255,255,255,0.06)',
                        color: '#CBD5E1',
                        cursor: 'pointer',
                    }}
                >
                    <Trash2 size={14} />
                </button>
                <button
                    type="button"
                    onClick={onOpenModal}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        height: 34,
                        padding: '0 14px',
                        borderRadius: 9,
                        border: 'none',
                        backgroundColor: '#2563EB',
                        color: '#FFFFFF',
                        fontSize: 12.5,
                        fontWeight: 700,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 2px 8px rgba(37, 99, 235, 0.35)',
                    }}
                >
                    <span>1:1 비교하기</span>
                    <ArrowRight size={13} />
                </button>
            </Group>
        </Box>
    );
}

interface CompareModalProps {
    opened: boolean;
    onClose: () => void;
    items: Facility[];
    allFacilities: Facility[];
    onRemove: (id: string) => void;
    onSelectFacility: (facility: Facility) => void;
    isLoggedIn?: boolean;
    onRequestLogin?: () => void;
}

export default function CompareModal({
    opened,
    onClose,
    items,
    allFacilities,
    onRemove,
    onSelectFacility,
    isLoggedIn = false,
    onRequestLogin,
}: CompareModalProps) {
    // 상세 데이터(priceInfo, 편의시설, 이미지 등) 실시간 보강 캐시
    const [detailMap, setDetailMap] = useState<Record<string, Facility>>({});
    const [loadingDetails, setLoadingDetails] = useState(false);

    useEffect(() => {
        if (items.length === 0) return;
        const missingIds = items
            .map((f) => f.id)
            .filter((id) => !detailMap[id]?.priceInfo);

        if (missingIds.length === 0) return;

        let cancelled = false;
        setLoadingDetails(true);

        Promise.all(
            missingIds.map(async (id) => {
                try {
                    const res = await fetch(`/api/facilities/${id}`);
                    if (!res.ok) return null;
                    const data = await res.json();
                    return { id, data };
                } catch {
                    return null;
                }
            })
        ).then((results) => {
            if (cancelled) return;
            setDetailMap((prev) => {
                const next = { ...prev };
                results.forEach((r) => {
                    if (r && r.data) {
                        next[r.id] = r.data;
                    }
                });
                return next;
            });
            setLoadingDetails(false);
        });

        return () => {
            cancelled = true;
        };
    }, [items, opened, detailMap]);

    // 리스트 아이템과 상세 API 데이터를 병합한 최종 비교 배열
    const enrichedItems = React.useMemo(() => {
        return items.map((item) => {
            const detail = detailMap[item.id];
            if (!detail) return item;
            return {
                ...item,
                ...detail,
                priceRange: item.priceRange || {
                    min: detail.representativePrice || item.representativePrice || 0,
                    max: (detail as any).maxPrice || 0,
                },
                representativePrice: detail.representativePrice || item.representativePrice || 0,
                thumbnail: item.thumbnail || detail.thumbnail || detail.images?.[0] || '',
            };
        });
    }, [items, detailMap]);

    // 지역 평균 계산 헬퍼 (공설/사설 동일 유형 및 이상치 제외)
    const getRegionalInsight = (fac: Facility) => {
        const rawMin = fac.representativePrice || fac.priceRange?.min || 0;
        const minPrice = rawMin > 0 && rawMin < 10000 ? rawMin * 10000 : rawMin;
        if (!minPrice || minPrice <= 0) return null;
        const regionPrefix = fac.address?.split(' ')[0] || '';
        const minThreshold = fac.isPublic ? 30000 : 300000;
        const peers = allFacilities.filter((f) => {
            const p = f.representativePrice || f.priceRange?.min || 0;
            const normP = p > 0 && p < 10000 ? p * 10000 : p;
            return (
                f.category === fac.category &&
                Boolean(f.isPublic) === Boolean(fac.isPublic) &&
                normP >= minThreshold &&
                normP <= 50000000 &&
                (!regionPrefix || f.address?.startsWith(regionPrefix))
            );
        });
        if (peers.length < 3) return null;
        const avg =
            peers.reduce((acc, cur) => {
                const p = cur.representativePrice || cur.priceRange?.min || 0;
                return acc + (p > 0 && p < 10000 ? p * 10000 : p);
            }, 0) / peers.length;
        if (!avg) return null;
        const diffPct = Math.round(((minPrice - avg) / avg) * 100);
        if (diffPct <= -5) {
            return { text: `지역 동종 평균 대비 ${Math.abs(diffPct)}% 저렴`, color: '#059669', bg: '#ECFDF5' };
        }
        if (diffPct <= 15) {
            return { text: '지역 동종 평균 수준', color: '#2563EB', bg: '#EFF6FF' };
        }
        const roundedAvgMan = Math.max(1, Math.round(avg / 10000));
        return { text: `지역 동종 평균 약 ${roundedAvgMan.toLocaleString()}만원`, color: '#475569', bg: '#F8FAFC' };
    };

    const lowestPriceId = React.useMemo(() => {
        const priced = enrichedItems.filter((f) => (f.representativePrice || f.priceRange?.min || 0) > 0);
        if (priced.length < 2) return null;
        priced.sort(
            (a, b) =>
                (a.representativePrice || a.priceRange?.min || Infinity) -
                (b.representativePrice || b.priceRange?.min || Infinity)
        );
        return priced[0].id;
    }, [enrichedItems]);

    // 공설 vs 사설 혼합 비교 여부 감지 (사용자에게 가격 차이 이유를 명확히 안내)
    const hasMixedPublicPrivate = React.useMemo(() => {
        if (enrichedItems.length < 2) return false;
        const hasPub = enrichedItems.some((f) => f.isPublic);
        const hasPriv = enrichedItems.some((f) => !f.isPublic);
        return hasPub && hasPriv;
    }, [enrichedItems]);

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            size="xl"
            centered
            zIndex={3500}
            radius={18}
            padding={0}
            withCloseButton={false}
            styles={{
                content: {
                    overflow: 'hidden',
                    border: '1px solid #EEF1F5',
                    boxShadow: '0 20px 50px rgba(15, 23, 42, 0.16)',
                },
            }}
        >
            {/* 모달 헤더 */}
            <Box
                px={20}
                py={16}
                style={{
                    borderBottom: '1px solid #EEF1F5',
                    backgroundColor: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <Group gap={10}>
                    <Box
                        style={{
                            width: 34,
                            height: 34,
                            borderRadius: 10,
                            backgroundColor: '#EFF6FF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Scale size={18} color="#2563EB" />
                    </Box>
                    <Box>
                        <Group gap={8} align="center">
                            <Text style={{ fontSize: 16, fontWeight: 800, color: '#191F28', letterSpacing: '-0.02em' }}>
                                시설 한눈에 비교하기
                            </Text>
                            {loadingDetails && <Loader size={14} color="blue" />}
                        </Group>
                        <Text style={{ fontSize: 12, color: '#6B7684' }}>
                            선택한 {enrichedItems.length}곳의 실제 분양가 산정 기준·이용자격·관리비·세부 가격표 비교
                        </Text>
                    </Box>
                </Group>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="비교창 닫기"
                    style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        border: 'none',
                        backgroundColor: '#F2F4F6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: '#4E5968',
                        outline: 'none',
                    }}
                >
                    <X size={18} />
                </button>
            </Box>

            <ScrollArea mah="80vh" type="auto">
                <Box p={20} bg="#F8FAFC">
                    {/* 공설 vs 사설 혼합 비교 시 핵심 가이드 배너 */}
                    {hasMixedPublicPrivate && (
                        <Box
                            mb={14}
                            px={14}
                            py={10}
                            style={{
                                backgroundColor: '#EFF6FF',
                                border: '1px solid #BFDBFE',
                                borderRadius: 12,
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 8,
                            }}
                        >
                            <Info size={16} color="#2563EB" style={{ flexShrink: 0, marginTop: 2 }} />
                            <Text style={{ fontSize: 12, color: '#1E3A8A', lineHeight: 1.5, fontWeight: 500 }}>
                                <strong>공설 시설과 사설 시설을 함께 비교 중입니다.</strong> 공설은 비용이 저렴한 대신 <strong>해당 시·군 관내 주민 자격</strong>과 기한(15~60년) 제한이 있으며, 사설은 <strong>거주지 제한 없이 누구나 영구안치</strong>가 가능하고 평당 분양가·석물비가 별도 책정됩니다.
                            </Text>
                        </Box>
                    )}

                    {enrichedItems.length === 0 ? (
                        <Box py={48} style={{ textAlign: 'center' }}>
                            <Text size="sm" c="#6B7684">
                                비교할 시설을 목록에서 선택해 주세요.
                            </Text>
                        </Box>
                    ) : (
                        <Box
                            style={{
                                display: 'grid',
                                gridTemplateColumns: `repeat(${enrichedItems.length}, minmax(240px, 1fr))`,
                                gap: 14,
                            }}
                        >
                            {enrichedItems.map((fac) => {
                                const facAny = fac as any;
                                const rawImg = facAny.thumbnail || fac.imageGallery?.[0] || fac.images?.[0];
                                const thumbUrl = rawImg ? getFacilityImageUrl(rawImg) : '';
                                const minPrice = fac.representativePrice || fac.priceRange?.min || 0;
                                const isLowest = lowestPriceId === fac.id;
                                const insight = getRegionalInsight(fac);
                                const derived = extractFacilityInsights(fac, minPrice);
                                const cp = derived.categoryPrices;
                                const hasOddExactWon = minPrice >= 100000 && minPrice % 1000 !== 0;

                                return (
                                    <Box
                                        key={fac.id}
                                        style={{
                                            backgroundColor: '#FFFFFF',
                                            borderRadius: 14,
                                            border: isLowest ? '2px solid #2563EB' : '1px solid #E2E8F0',
                                            overflow: 'hidden',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            position: 'relative',
                                        }}
                                    >
                                        {/* 상단 썸네일 */}
                                        <Box
                                            style={{
                                                position: 'relative',
                                                height: 124,
                                                backgroundColor: '#F1F5F9',
                                                overflow: 'hidden',
                                            }}
                                        >
                                            {thumbUrl ? (
                                                <NextImage
                                                    src={thumbUrl}
                                                    alt={fac.name}
                                                    fill
                                                    sizes="320px"
                                                    style={{ objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <Box
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                    }}
                                                >
                                                    <img
                                                        src="/logo-horizontal.svg"
                                                        alt={fac.name}
                                                        style={{ width: 90, opacity: 0.25, filter: 'grayscale(100%)' }}
                                                    />
                                                </Box>
                                            )}

                                            {/* 최저가 배지 */}
                                            {isLowest && (
                                                <Box
                                                    style={{
                                                        position: 'absolute',
                                                        top: 10,
                                                        left: 10,
                                                        padding: '3px 8px',
                                                        borderRadius: 6,
                                                        backgroundColor: '#2563EB',
                                                        color: '#FFFFFF',
                                                        fontSize: 11,
                                                        fontWeight: 700,
                                                    }}
                                                >
                                                    비교시설 중 최저가
                                                </Box>
                                            )}

                                            {/* 제거 버튼 */}
                                            <button
                                                type="button"
                                                onClick={() => onRemove(fac.id)}
                                                aria-label="비교에서 제외"
                                                style={{
                                                    position: 'absolute',
                                                    top: 8,
                                                    right: 8,
                                                    width: 26,
                                                    height: 26,
                                                    borderRadius: '50%',
                                                    border: 'none',
                                                    backgroundColor: 'rgba(15, 23, 42, 0.65)',
                                                    color: '#FFFFFF',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                <X size={14} />
                                            </button>
                                        </Box>

                                        {/* 기본 정보 & 가격 */}
                                        <Box p={14} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                                            <Box>
                                                <Group gap={5} mb={5}>
                                                    <span
                                                        style={{
                                                            fontSize: 11,
                                                            fontWeight: 700,
                                                            padding: '2px 6px',
                                                            borderRadius: 5,
                                                            backgroundColor: fac.isPublic ? '#EFF6FF' : '#F1F5F9',
                                                            color: fac.isPublic ? '#1D4ED8' : '#475569',
                                                        }}
                                                    >
                                                        {fac.isPublic ? '공설(지자체)' : '사설(법인)'}
                                                    </span>
                                                    <span
                                                        style={{
                                                            fontSize: 11,
                                                            fontWeight: 700,
                                                            padding: '2px 6px',
                                                            borderRadius: 5,
                                                            backgroundColor: '#F8FAFC',
                                                            color: '#334155',
                                                            border: '1px solid #E2E8F0',
                                                        }}
                                                    >
                                                        {FACILITY_CATEGORY_LABELS[fac.category] || '추모시설'}
                                                    </span>
                                                    {derived.primaryDuration && (
                                                        <span
                                                            style={{
                                                                fontSize: 10.5,
                                                                fontWeight: 700,
                                                                padding: '2px 6px',
                                                                borderRadius: 5,
                                                                backgroundColor: '#F0FDF4',
                                                                color: '#15803D',
                                                            }}
                                                        >
                                                            {derived.primaryDuration}
                                                        </span>
                                                    )}
                                                </Group>
                                                <Text
                                                    style={{
                                                        fontSize: 15,
                                                        fontWeight: 800,
                                                        color: '#191F28',
                                                        letterSpacing: '-0.02em',
                                                    }}
                                                    lineClamp={1}
                                                >
                                                    {fac.name}
                                                </Text>
                                                <Group gap={4} mt={3} wrap="nowrap">
                                                    <MapPin size={12} color="#8B95A1" style={{ flexShrink: 0 }} />
                                                    <Text size="xs" c="#6B7684" lineClamp={1}>
                                                        {fac.address?.split(' ').slice(0, 3).join(' ')}
                                                    </Text>
                                                </Group>
                                            </Box>

                                            {/* 대표 가격 박스 + 산정 기준 명시 */}
                                            <Box
                                                p={11}
                                                style={{
                                                    backgroundColor: '#F8FAFC',
                                                    borderRadius: 10,
                                                    border: '1px solid #EEF1F5',
                                                }}
                                            >
                                                <Group justify="space-between" align="center">
                                                    <Text style={{ fontSize: 11, fontWeight: 700, color: '#64748B' }}>
                                                        대표 최저가
                                                    </Text>
                                                    {hasOddExactWon && (
                                                        <Text style={{ fontSize: 10.5, color: '#94A3B8' }}>
                                                            고시가 {minPrice.toLocaleString()}원
                                                        </Text>
                                                    )}
                                                </Group>
                                                <Text
                                                    style={{
                                                        fontSize: 19,
                                                        fontWeight: 800,
                                                        color: minPrice > 0 ? '#2563EB' : '#8B95A1',
                                                        letterSpacing: '-0.03em',
                                                        marginTop: 2,
                                                    }}
                                                >
                                                    {minPrice > 0 ? `${formatKoreanCurrency(minPrice)}~` : '가격문의'}
                                                </Text>
                                                {derived.representativePriceLabel && (
                                                    <Text
                                                        style={{
                                                            fontSize: 11.5,
                                                            fontWeight: 600,
                                                            color: '#334155',
                                                            marginTop: 3,
                                                        }}
                                                        lineClamp={1}
                                                    >
                                                        기준: {derived.representativePriceLabel}
                                                    </Text>
                                                )}
                                                <Group gap={4} mt={6}>
                                                    {insight && (
                                                        <Box
                                                            style={{
                                                                display: 'inline-block',
                                                                fontSize: 11,
                                                                fontWeight: 700,
                                                                padding: '2px 7px',
                                                                borderRadius: 5,
                                                                backgroundColor: insight.bg,
                                                                color: insight.color,
                                                            }}
                                                        >
                                                            {insight.text}
                                                        </Box>
                                                    )}
                                                    {derived.localDiscountPercent && (
                                                        <Box
                                                            style={{
                                                                display: 'inline-block',
                                                                fontSize: 11,
                                                                fontWeight: 700,
                                                                padding: '2px 7px',
                                                                borderRadius: 5,
                                                                backgroundColor: '#EFF6FF',
                                                                color: '#1D4ED8',
                                                            }}
                                                        >
                                                            관내 {derived.localDiscountPercent}% 감면
                                                        </Box>
                                                    )}
                                                </Group>
                                            </Box>

                                            {/* 1. 이용 자격 및 계약/관리 조건 */}
                                            <Box style={{ borderTop: '1px solid #F1F5F9', paddingTop: 10 }}>
                                                <Text style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                                                    이용 자격 및 유지비 조건
                                                </Text>
                                                <Box style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                                    <Group justify="space-between" wrap="nowrap">
                                                        <Text style={{ fontSize: 12, color: '#6B7684', flexShrink: 0 }}>이용 자격</Text>
                                                        <Text
                                                            style={{
                                                                fontSize: 12,
                                                                fontWeight: 700,
                                                                color: fac.isPublic ? '#1D4ED8' : '#059669',
                                                                textAlign: 'right',
                                                            }}
                                                            lineClamp={1}
                                                        >
                                                            {derived.eligibilityText}
                                                        </Text>
                                                    </Group>
                                                    <Group justify="space-between" wrap="nowrap">
                                                        <Text style={{ fontSize: 12, color: '#6B7684', flexShrink: 0 }}>계약·사용기간</Text>
                                                        <Text style={{ fontSize: 12, fontWeight: 700, color: '#191F28' }}>
                                                            {derived.durations.length > 0 ? derived.durations.join(' · ') : (derived.primaryDuration || '-')}
                                                        </Text>
                                                    </Group>
                                                    <Group justify="space-between" wrap="nowrap">
                                                        <Text style={{ fontSize: 12, color: '#6B7684', flexShrink: 0 }}>연간 관리비</Text>
                                                        <Text style={{ fontSize: 12, fontWeight: 700, color: derived.managementFeeText ? '#191F28' : '#94A3B8' }}>
                                                            {derived.managementFeeText || '별도 문의'}
                                                        </Text>
                                                    </Group>
                                                    <Group justify="space-between" wrap="nowrap">
                                                        <Text style={{ fontSize: 12, color: '#6B7684', flexShrink: 0 }}>10년 합산 예상</Text>
                                                        <Text style={{ fontSize: 12, fontWeight: 700, color: derived.estimated10YearTotal ? '#2563EB' : '#94A3B8' }}>
                                                            {derived.estimated10YearTotal ? `약 ${formatKoreanPrice(derived.estimated10YearTotal)}` : '관리비 확인 필요'}
                                                        </Text>
                                                    </Group>
                                                    {derived.extraCostText && (
                                                        <Group justify="space-between" wrap="nowrap">
                                                            <Text style={{ fontSize: 12, color: '#6B7684', flexShrink: 0 }}>석물·부대비용</Text>
                                                            <Text style={{ fontSize: 11.5, fontWeight: 600, color: '#475569' }} lineClamp={1}>
                                                                {derived.extraCostText}
                                                            </Text>
                                                        </Group>
                                                    )}
                                                </Box>
                                            </Box>

                                            {/* 2. 세부 안치 유형별 시작가 */}
                                            <Box style={{ borderTop: '1px solid #F1F5F9', paddingTop: 10 }}>
                                                <Text style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                                                    안치 유형별 시작가
                                                </Text>
                                                <Box style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                                    {[
                                                        { label: '봉안당 (납골당)', val: cp.charnel },
                                                        { label: '수목장 / 자연장', val: cp.natural },
                                                        { label: '매장묘지 / 봉안묘', val: cp.burial },
                                                    ].map((row) => (
                                                        <Group key={row.label} justify="space-between">
                                                            <Text style={{ fontSize: 12, color: '#6B7684' }}>{row.label}</Text>
                                                            <Text
                                                                style={{
                                                                    fontSize: 12,
                                                                    fontWeight: 700,
                                                                    color: row.val && row.val > 0 ? '#191F28' : '#CBD5E1',
                                                                }}
                                                            >
                                                                {row.val && row.val > 0 ? `${formatKoreanCurrency(row.val)}~` : '미운영'}
                                                            </Text>
                                                        </Group>
                                                    ))}
                                                </Box>
                                            </Box>

                                            {/* 3. 핵심 가격표 요약 (실제 DB 가격 행) */}
                                            {derived.topPriceItems.length > 0 && (
                                                <Box style={{ borderTop: '1px solid #F1F5F9', paddingTop: 10 }}>
                                                    <Text style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                                                        실제 가격표 주요 항목
                                                    </Text>
                                                    <Box
                                                        p={8}
                                                        style={{
                                                            backgroundColor: '#F8FAFC',
                                                            borderRadius: 8,
                                                            border: '1px solid #F1F5F9',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            gap: 5,
                                                        }}
                                                    >
                                                        {derived.topPriceItems.slice(0, 3).map((item, idx) => (
                                                            <Box key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                                                                <Box style={{ minWidth: 0, flex: 1 }}>
                                                                    <Text style={{ fontSize: 11.5, fontWeight: 600, color: '#334155' }} lineClamp={1}>
                                                                        {item.name}
                                                                        {item.grade ? ` (${item.grade.slice(0, 14)})` : ''}
                                                                    </Text>
                                                                </Box>
                                                                <Text style={{ fontSize: 11.5, fontWeight: 700, color: '#2563EB', flexShrink: 0 }}>
                                                                    {formatKoreanCurrency(item.price)}
                                                                </Text>
                                                            </Box>
                                                        ))}
                                                    </Box>
                                                </Box>
                                            )}

                                            {/* 4. 편의시설 비교 */}
                                            <Box style={{ borderTop: '1px solid #F1F5F9', paddingTop: 10 }}>
                                                <Group justify="space-between" mb={6}>
                                                    <Text style={{ fontSize: 11.5, fontWeight: 700, color: '#334155' }}>
                                                        편의시설 및 정보 공개도
                                                    </Text>
                                                    <Text style={{ fontSize: 11, fontWeight: 700, color: derived.completenessScore >= 70 ? '#059669' : '#64748B' }}>
                                                        공개도 {derived.completenessScore}점
                                                    </Text>
                                                </Group>
                                                <Box style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                                                    {[
                                                        { label: '주차장', has: Boolean(fac.hasParking) },
                                                        { label: '식당', has: Boolean(fac.hasRestaurant) },
                                                        { label: '편의시설', has: Boolean(fac.hasAccessibility || facAny.hasDisabledAccess) },
                                                        { label: '매점', has: Boolean(fac.hasStore) },
                                                    ].map((am) => (
                                                        <Box
                                                            key={am.label}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'space-between',
                                                                padding: '5px 8px',
                                                                borderRadius: 6,
                                                                backgroundColor: am.has ? '#EFF6FF' : '#F8FAFC',
                                                                border: am.has ? '1px solid #DBEAFE' : '1px solid #F1F5F9',
                                                            }}
                                                        >
                                                            <span style={{ fontSize: 11.5, color: am.has ? '#1E40AF' : '#94A3B8', fontWeight: 600 }}>
                                                                {am.label}
                                                            </span>
                                                            {am.has ? (
                                                                <Check size={13} color="#2563EB" strokeWidth={2.5} />
                                                            ) : (
                                                                <Minus size={13} color="#CBD5E1" />
                                                            )}
                                                        </Box>
                                                    ))}
                                                </Box>
                                            </Box>

                                            {/* 연락처 */}
                                            {fac.phone && (
                                                <Group gap={5} style={{ borderTop: '1px solid #F1F5F9', paddingTop: 10 }}>
                                                    <Phone size={12} color="#64748B" />
                                                    <Text style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>
                                                        {fac.phone}
                                                    </Text>
                                                </Group>
                                            )}

                                            {/* 상세보기 CTA */}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    onSelectFacility(fac);
                                                    onClose();
                                                }}
                                                style={{
                                                    marginTop: 'auto',
                                                    width: '100%',
                                                    height: 40,
                                                    borderRadius: 10,
                                                    border: 'none',
                                                    backgroundColor: '#2563EB',
                                                    color: '#FFFFFF',
                                                    fontSize: 13,
                                                    fontWeight: 700,
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                상세 가격표 및 문의 보기
                                            </button>
                                        </Box>
                                    </Box>
                                );
                            })}
                        </Box>
                    )}

                    {/* 하단 회원 연동 & 시설 제휴 안내 바 */}
                    <Box
                        mt={16}
                        p={14}
                        style={{
                            backgroundColor: '#FFFFFF',
                            borderRadius: 12,
                            border: '1px solid #E2E8F0',
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 10,
                        }}
                    >
                        {!isLoggedIn && onRequestLogin ? (
                            <Group gap={8}>
                                <UserCheck size={16} color="#2563EB" />
                                <Text style={{ fontSize: 12.5, color: '#334155', fontWeight: 600 }}>
                                    로그인하시면 관심 시설 저장 및 문의·상담 시 연락처 자동 입력을 이용하실 수 있습니다.
                                </Text>
                                <button
                                    type="button"
                                    onClick={() => {
                                        onClose();
                                        onRequestLogin();
                                    }}
                                    style={{
                                        padding: '5px 12px',
                                        borderRadius: 8,
                                        border: '1px solid #2563EB',
                                        backgroundColor: '#EFF6FF',
                                        color: '#2563EB',
                                        fontSize: 12,
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                    }}
                                >
                                    3초 간편 로그인
                                </button>
                            </Group>
                        ) : (
                            <Group gap={8}>
                                <Building2 size={16} color="#64748B" />
                                <Text style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>
                                    실제 안치 단수·석물 옵션에 따라 비용이 달라질 수 있으므로 상세 페이지에서 시설 문의를 남겨보세요.
                                </Text>
                            </Group>
                        )}

                        <Link
                            href="/partnership"
                            onClick={onClose}
                            style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: '#475569',
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                            }}
                        >
                            <span>장지 회사 공식 제휴·정보 수정 신청</span>
                            <ArrowRight size={12} />
                        </Link>
                    </Box>
                </Box>
            </ScrollArea>
        </Modal>
    );
}
