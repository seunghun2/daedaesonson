import React, { memo, useMemo } from 'react';
import { Card, Text, Badge, Group, Flex, ThemeIcon, Box } from '@mantine/core';
import NextImage from 'next/image';
import { MapPin, Building, Trees, Cross, User, Star } from 'lucide-react';
import { Facility, FACILITY_CATEGORY_LABELS, FacilityCategory } from '@/types';
import { formatKoreanCurrency } from '@/lib/format';
import { getFacilityImageUrl } from '@/lib/supabaseImage';
import VerifiedBadge, { VerifiedSealIcon } from '@/components/common/VerifiedBadge';

interface FacilityCardProps {
    facility: Facility;
    onClick?: () => void;
    isCompared?: boolean;
    onToggleCompare?: (facility: Facility, e: React.MouseEvent) => void;
}

// 아이콘 매핑 (썸네일 없을 때 대체용)
const CATEGORY_CONFIG: Record<FacilityCategory, { icon: any; color: string; bg: string }> = {
    CHARNEL_HOUSE: { icon: Building, color: 'blue', bg: '#e7f5ff' },
    NATURAL_BURIAL: { icon: Trees, color: 'teal', bg: '#e6fcf5' },
    FAMILY_GRAVE: { icon: Cross, color: 'grape', bg: '#f3d9fa' },
    CREMATORIUM: { icon: User, color: 'orange', bg: '#fff4e6' },
    FUNERAL_HOME: { icon: Building, color: 'dark', bg: '#f8f9fa' },
    OTHER: { icon: MapPin, color: 'gray', bg: '#f1f3f5' },
};

function FacilityCardComponent({ facility, onClick, isCompared = false, onToggleCompare }: FacilityCardProps) {
    const config = CATEGORY_CONFIG[facility.category] || CATEGORY_CONFIG.OTHER;
    const Icon = config.icon;

    // 가격 연산 메모이제이션 (카드가 리렌더링될 때 중복 계산 방지)
    const { displayPrice, priceLabel, showTilde } = useMemo(() => {
        let displayPrice = '가격문의';
        let priceLabel = '';

        // 1) 신형(standardizedPrices) 먼저 확인
        const sp = facility.priceInfo?.standardizedPrices;
        if (Array.isArray(sp) && sp.length > 0) {
            let preferredKeywords: string[] = [];
            if (facility.category === 'FAMILY_GRAVE') preferredKeywords = ['매장', '묘지', '분양', 'BURIAL'];
            else if (facility.category === 'CHARNEL_HOUSE') preferredKeywords = ['봉안', '납골', '안치', 'BONGSAN'];
            else if (facility.category === 'NATURAL_BURIAL') preferredKeywords = ['수목', '자연', '잔디', '화초', 'NATURAL'];

            const subRepItems: { label: string; price: number }[] = [];
            for (const group of sp) {
                if (Array.isArray(group.rows)) {
                    const rep = group.rows.find((r: any) => r.isRepresentative);
                    if (rep && rep.price > 0) {
                        const val = rep.price < 10000 ? rep.price * 10000 : rep.price;
                        const labelMap: Record<string, string> = { 'BONGSAN': '봉안당', 'BURIAL': '매장묘지', 'NATURAL': '수목장', 'CREMATION': '화장' };
                        subRepItems.push({ label: labelMap[group.serviceType] || group.serviceType || group.subType || '', price: val });
                    }
                }
            }

            const mainItem = subRepItems.find(i =>
                preferredKeywords.some(k => i.label.includes(k))
            ) || subRepItems[0];

            if (mainItem) {
                displayPrice = formatKoreanCurrency(mainItem.price);
            }
        }

        // 2) 구형(priceTable) 확인
        if (displayPrice === '가격문의') {
            const priceTable = facility.priceInfo?.priceTable || facility.pricing;
            if (priceTable && typeof priceTable === 'object' && Object.keys(priceTable).length > 0) {
                let preferredKeywords: string[] = [];
                if (facility.category === 'FAMILY_GRAVE') preferredKeywords = ['매장', '묘지', '분양'];
                else if (facility.category === 'CHARNEL_HOUSE') preferredKeywords = ['봉안', '납골', '안치'];
                else if (facility.category === 'NATURAL_BURIAL') preferredKeywords = ['수목', '자연', '잔디', '화초'];

                const subRepItems: { label: string; price: number }[] = [];

                Object.keys(priceTable).forEach(key => {
                    if (/옵션|관리비|기타|공통|제외|석물|비고|안내|별도/.test(key)) return;
                    const cat = priceTable[key];
                    if (cat && Array.isArray(cat.rows)) {
                        const rep = cat.rows.find((r: any) => r.isRepresentative);
                        if (rep && rep.price > 0) {
                            const val = rep.price < 10000 ? rep.price * 10000 : rep.price;
                            subRepItems.push({ label: key, price: val });
                        }
                    }
                });

                const mainItem = subRepItems.find(i =>
                    preferredKeywords.some(k => i.label.includes(k))
                ) || subRepItems[0];

                if (mainItem) {
                    displayPrice = formatKoreanCurrency(mainItem.price);
                }
            }
        }

        // 3) Fallback: representativePrice 또는 priceRange 사용
        if (displayPrice === '가격문의') {
            const repPrice = facility.representativePrice || 0;
            const minPrice = facility.priceRange?.min || 0;
            const fallbackPrice = repPrice > 0 ? repPrice : minPrice;
            if (fallbackPrice > 0) {
                const normalizedPrice = fallbackPrice < 10000 ? fallbackPrice * 10000 : fallbackPrice;
                displayPrice = formatKoreanCurrency(normalizedPrice);
            }
        }

        let showTilde = true;
        if (facility.category === 'CREMATORIUM' && priceLabel === '관내') showTilde = false;
        if (displayPrice === '가격문의') showTilde = false;

        return { displayPrice, priceLabel, showTilde };
    }, [facility.priceInfo, facility.pricing, facility.representativePrice, facility.priceRange, facility.category]);

    // 썸네일 URL 메모이제이션
    const validThumbnailUrl = useMemo(() => {
        const rawImg = facility.thumbnail || facility.imageUrl || (Array.isArray(facility.images) ? facility.images[0] : facility.images) || facility.imageGallery?.[0];
        return getFacilityImageUrl(rawImg);
    }, [facility.thumbnail, facility.imageUrl, facility.images, facility.imageGallery]);

    const categoryBadgePalette: Record<string, { bg: string; text: string }> = {
        CHARNEL_HOUSE: { bg: '#F2F4F6', text: '#333D4B' },
        NATURAL_BURIAL: { bg: '#F2F4F6', text: '#333D4B' },
        FAMILY_GRAVE: { bg: '#F2F4F6', text: '#333D4B' },
        CREMATORIUM: { bg: '#F2F4F6', text: '#333D4B' },
        FUNERAL_HOME: { bg: '#F2F4F6', text: '#333D4B' },
        OTHER: { bg: '#F2F4F6', text: '#4E5968' },
    };
    const catColors = categoryBadgePalette[facility.category] || categoryBadgePalette.OTHER;
    const isVerified = Boolean((facility as any).isVerifiedPartner);

    return (
        <Card
            padding={0}
            radius="md"
            withBorder={false}
            data-testid="facility-card"
            data-facility-id={facility.id}
            style={{
                cursor: 'pointer',
                backgroundColor: 'transparent',
            }}
            onClick={onClick}
        >
            <Flex align="stretch" gap={14}>
                {/* 1. 좌측 썸네일 (4면 라운드 12px + 미세 테두리) */}
                <Box
                    w={104}
                    h={104}
                    style={{
                        flexShrink: 0,
                        position: 'relative',
                        overflow: 'hidden',
                        borderRadius: '12px',
                        border: '1px solid rgba(15, 23, 42, 0.07)',
                        backgroundColor: '#F8FAFC',
                    }}
                >
                    {validThumbnailUrl ? (
                        <NextImage
                            src={validThumbnailUrl}
                            width={208}
                            height={208}
                            alt={facility.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            loading="lazy"
                            sizes="104px"
                        />
                    ) : (
                        <Box h="100%" bg="#F2F4F6" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <img
                                src="/logo-horizontal.svg"
                                alt="대대손손"
                                style={{ width: 58, height: 22, opacity: 0.25, filter: 'grayscale(100%)' }}
                            />
                        </Box>
                    )}

                    {/* 공설/사설 마이크로 뱃지 */}
                    <Box
                        pos="absolute"
                        top={6}
                        left={6}
                        style={{
                            backgroundColor: facility.isPublic ? 'rgba(37, 99, 235, 0.92)' : 'rgba(25, 31, 40, 0.78)',
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
                        {facility.isPublic ? '공설' : '사설'}
                    </Box>
                </Box>

                {/* 2. 우측 정보 영역 (호갱노노 스타일 3단 위계) */}
                <Box style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingTop: 2, paddingBottom: 2 }}>
                    <div>
                        {/* 상단: 카테고리 태그 + 공식검증 배지 + 관심/비교 */}
                        <Group justify="space-between" align="center" wrap="nowrap" mb={4}>
                            <Group gap={5} align="center" wrap="nowrap">
                                <span
                                    style={{
                                        display: 'inline-block',
                                        backgroundColor: catColors.bg,
                                        color: catColors.text,
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        padding: '2px 7px',
                                        borderRadius: '5px',
                                        lineHeight: 1.35,
                                        letterSpacing: '-0.2px',
                                    }}
                                >
                                    {FACILITY_CATEGORY_LABELS[facility.category]}
                                </span>
                                {isVerified && (
                                    <VerifiedBadge variant="pill" size="sm" label="공식검증" />
                                )}
                            </Group>

                            <Group gap={6} align="center" wrap="nowrap">
                                {(facility.favoriteCount ?? 0) > 0 && (
                                    <Group gap={3} align="center">
                                        <Star size={12} color="#F59E0B" fill="#F59E0B" />
                                        <Text size="xs" c="#6B7684" fw={700} style={{ fontSize: '11.5px' }}>
                                            {facility.favoriteCount}
                                        </Text>
                                    </Group>
                                )}
                                {onToggleCompare && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onToggleCompare(facility, e);
                                        }}
                                        style={{
                                            padding: '2px 7px',
                                            borderRadius: 5,
                                            fontSize: 10.5,
                                            fontWeight: 700,
                                            border: isCompared ? '1px solid #2563EB' : '1px solid #E2E8F0',
                                            backgroundColor: isCompared ? '#EFF6FF' : '#FFFFFF',
                                            color: isCompared ? '#2563EB' : '#64748B',
                                            cursor: 'pointer',
                                            lineHeight: 1.3,
                                        }}
                                    >
                                        {isCompared ? '비교중' : '+ 비교'}
                                    </button>
                                )}
                            </Group>
                        </Group>

                        {/* 중단: 시설명 & 공식 인증 실 & 지역 주소 */}
                        <Group gap={4} align="center" wrap="nowrap" style={{ minWidth: 0 }}>
                            <Text
                                fw={700}
                                lineClamp={1}
                                style={{
                                    fontSize: '15.5px',
                                    color: '#191F28',
                                    letterSpacing: '-0.35px',
                                    lineHeight: 1.3,
                                }}
                            >
                                {facility.name}
                            </Text>
                            {isVerified && (
                                <VerifiedSealIcon size={15} color="#2563EB" />
                            )}
                        </Group>
                        <Text
                            lineClamp={1}
                            mt={2}
                            style={{
                                fontSize: '12.5px',
                                color: '#6B7684',
                                letterSpacing: '-0.2px',
                            }}
                        >
                            {facility.address ? facility.address.split(' ').slice(0, 3).join(' ') : ''}
                        </Text>
                    </div>

                    {/* 하단: 대표 가격 강조 */}
                    <Group justify="space-between" align="baseline" mt={6}>
                        <Group gap={5} align="baseline">
                            {displayPrice !== '가격문의' && (
                                <Text
                                    component="span"
                                    style={{
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        color: '#8B95A1',
                                        letterSpacing: '-0.2px',
                                    }}
                                >
                                    {priceLabel || '대표가격'}
                                </Text>
                            )}
                            <Text
                                component="span"
                                fw={800}
                                style={{
                                    fontSize: displayPrice === '가격문의' ? '14.5px' : '17.5px',
                                    color: displayPrice === '가격문의' ? '#8B95A1' : '#2563EB',
                                    letterSpacing: '-0.5px',
                                    lineHeight: 1.1,
                                }}
                            >
                                {displayPrice}{showTilde ? '~' : ''}
                            </Text>
                        </Group>
                    </Group>
                </Box>
            </Flex>
        </Card>
    );
}

const FacilityCard = memo(FacilityCardComponent);
export default FacilityCard;

