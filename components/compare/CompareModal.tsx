'use client';

import React from 'react';
import { Box, Text, Group, Modal, ScrollArea } from '@mantine/core';
import { Scale, X, Check, Minus, MapPin, Phone, ArrowRight, Trash2 } from 'lucide-react';
import NextImage from 'next/image';
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
}

export default function CompareModal({
    opened,
    onClose,
    items,
    allFacilities,
    onRemove,
    onSelectFacility,
}: CompareModalProps) {
    // 지역 평균 계산 헬퍼 (공설/사설 동일 유형 및 이상치 제외)
    const getRegionalInsight = (fac: Facility) => {
        const rawMin = fac.representativePrice || fac.priceRange?.min || 0;
        const minPrice = rawMin > 0 && rawMin < 10000 ? rawMin * 10000 : rawMin;
        if (!minPrice || minPrice <= 0) return null;
        const regionPrefix = fac.address?.split(' ')[0] || '';
        const minThreshold = fac.isPublic ? 50000 : 500000;
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
            return { text: `지역 평균 대비 ${Math.abs(diffPct)}% 저렴`, color: '#059669', bg: '#ECFDF5' };
        }
        if (diffPct <= 15) {
            return { text: '지역 평균 수준', color: '#2563EB', bg: '#EFF6FF' };
        }
        const roundedAvgMan = Math.round(avg / 100000) * 10;
        return { text: `지역 평균 ${roundedAvgMan.toLocaleString()}만원`, color: '#475569', bg: '#F8FAFC' };
    };

    const lowestPriceId = React.useMemo(() => {
        const priced = items.filter((f) => (f.representativePrice || f.priceRange?.min || 0) > 0);
        if (priced.length < 2) return null;
        priced.sort(
            (a, b) =>
                (a.representativePrice || a.priceRange?.min || Infinity) -
                (b.representativePrice || b.priceRange?.min || Infinity)
        );
        return priced[0].id;
    }, [items]);

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
                <Group gap={8}>
                    <Box
                        style={{
                            width: 30,
                            height: 30,
                            borderRadius: 8,
                            backgroundColor: '#EFF6FF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Scale size={16} color="#2563EB" />
                    </Box>
                    <Box>
                        <Text style={{ fontSize: 16, fontWeight: 800, color: '#191F28', letterSpacing: '-0.02em' }}>
                            시설 한눈에 비교하기
                        </Text>
                        <Text style={{ fontSize: 12, color: '#6B7684' }}>
                            선택한 {items.length}곳의 분양가·운영형태·편의시설 비교
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
                    }}
                >
                    <X size={18} />
                </button>
            </Box>

            <ScrollArea mah="78vh" type="auto">
                <Box p={20} bg="#F8FAFC">
                    {items.length === 0 ? (
                        <Box py={48} style={{ textAlign: 'center' }}>
                            <Text size="sm" c="#6B7684">
                                비교할 시설을 목록에서 선택해 주세요.
                            </Text>
                        </Box>
                    ) : (
                        <Box
                            style={{
                                display: 'grid',
                                gridTemplateColumns: `repeat(${items.length}, minmax(200px, 1fr))`,
                                gap: 14,
                            }}
                        >
                            {items.map((fac) => {
                                const facAny = fac as any;
                                const rawImg = facAny.thumbnail || fac.imageGallery?.[0];
                                const thumbUrl = rawImg ? getFacilityImageUrl(rawImg) : '';
                                const minPrice = fac.representativePrice || fac.priceRange?.min || 0;
                                const isLowest = lowestPriceId === fac.id;
                                const insight = getRegionalInsight(fac);
                                const derived = extractFacilityInsights(fac);
                                const cp = facAny.categoryPrices;

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
                                                height: 128,
                                                backgroundColor: '#F1F5F9',
                                                overflow: 'hidden',
                                            }}
                                        >
                                            {thumbUrl ? (
                                                <NextImage
                                                    src={thumbUrl}
                                                    alt={fac.name}
                                                    fill
                                                    sizes="280px"
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
                                                        {fac.isPublic ? '공설' : '사설'}
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

                                            {/* 대표 가격 박스 */}
                                            <Box
                                                p={10}
                                                style={{
                                                    backgroundColor: '#F8FAFC',
                                                    borderRadius: 10,
                                                    border: '1px solid #EEF1F5',
                                                }}
                                            >
                                                <Text style={{ fontSize: 11, fontWeight: 600, color: '#8B95A1' }}>
                                                    대표 최저가
                                                </Text>
                                                <Text
                                                    style={{
                                                        fontSize: 18,
                                                        fontWeight: 800,
                                                        color: minPrice > 0 ? '#2563EB' : '#8B95A1',
                                                        letterSpacing: '-0.03em',
                                                        marginTop: 2,
                                                    }}
                                                >
                                                    {minPrice > 0 ? `${formatKoreanCurrency(minPrice)}~` : '가격문의'}
                                                </Text>
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

                                            {/* 실부담 비용 & 관리비 분석 (파생 지표) */}
                                            <Box style={{ borderTop: '1px solid #F1F5F9', paddingTop: 10 }}>
                                                <Text style={{ fontSize: 11.5, fontWeight: 700, color: '#4E5968', marginBottom: 6 }}>
                                                    유지비 및 계약 조건
                                                </Text>
                                                <Box style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                                    <Group justify="space-between">
                                                        <Text style={{ fontSize: 12, color: '#6B7684' }}>연간 관리비</Text>
                                                        <Text style={{ fontSize: 12, fontWeight: 700, color: derived.managementFeeText ? '#191F28' : '#CBD5E1' }}>
                                                            {derived.managementFeeText || '시설 문의'}
                                                        </Text>
                                                    </Group>
                                                    <Group justify="space-between">
                                                        <Text style={{ fontSize: 12, color: '#6B7684' }}>10년 예상 총액</Text>
                                                        <Text style={{ fontSize: 12, fontWeight: 700, color: derived.estimated10YearTotal ? '#2563EB' : '#CBD5E1' }}>
                                                            {derived.estimated10YearTotal ? formatKoreanPrice(derived.estimated10YearTotal) : '-'}
                                                        </Text>
                                                    </Group>
                                                    <Group justify="space-between">
                                                        <Text style={{ fontSize: 12, color: '#6B7684' }}>정보 공개도</Text>
                                                        <Text style={{ fontSize: 12, fontWeight: 700, color: derived.completenessScore >= 75 ? '#059669' : '#4E5968' }}>
                                                            {derived.completenessScore}점 / 100
                                                        </Text>
                                                    </Group>
                                                </Box>
                                            </Box>

                                            {/* 세부 안치 유형별 가격 */}
                                            <Box style={{ borderTop: '1px solid #F1F5F9', paddingTop: 10 }}>
                                                <Text style={{ fontSize: 11.5, fontWeight: 700, color: '#4E5968', marginBottom: 6 }}>
                                                    유형별 시작가
                                                </Text>
                                                <Box style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                                    {[
                                                        { label: '봉안당', val: cp?.bonGwan },
                                                        { label: '수목장/자연장', val: cp?.jayeon },
                                                        { label: '매장묘지', val: cp?.maejang },
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
                                                                {row.val && row.val > 0 ? `${formatKoreanCurrency(row.val)}~` : '-'}
                                                            </Text>
                                                        </Group>
                                                    ))}
                                                </Box>
                                            </Box>

                                            {/* 편의시설 비교 */}
                                            <Box style={{ borderTop: '1px solid #F1F5F9', paddingTop: 10 }}>
                                                <Text style={{ fontSize: 11.5, fontWeight: 700, color: '#4E5968', marginBottom: 6 }}>
                                                    편의시설 보유
                                                </Text>
                                                <Box style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                                                    {[
                                                        { label: '주차장', has: fac.hasParking },
                                                        { label: '식당', has: fac.hasRestaurant },
                                                        { label: '편의시설', has: Boolean(fac.hasAccessibility || facAny.hasDisabledAccess) },
                                                        { label: '매점', has: fac.hasStore },
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
                                                    height: 38,
                                                    borderRadius: 10,
                                                    border: 'none',
                                                    backgroundColor: '#191F28',
                                                    color: '#FFFFFF',
                                                    fontSize: 13,
                                                    fontWeight: 700,
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                상세 정보 보기
                                            </button>
                                        </Box>
                                    </Box>
                                );
                            })}
                        </Box>
                    )}
                </Box>
            </ScrollArea>
        </Modal>
    );
}
