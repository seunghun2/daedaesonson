'use client';

import { Card, Text, Badge, Group, Flex, ThemeIcon, Box, Image } from '@mantine/core';
import { MapPin, Building, Trees, Cross, User, Star } from 'lucide-react';
import { Facility, FACILITY_CATEGORY_LABELS, FacilityCategory } from '@/types';
import { formatKoreanCurrency } from '@/lib/format';
import { getFacilityImageUrl } from '@/lib/supabaseImage';

interface FacilityCardProps {
    facility: Facility;
    onClick: () => void;
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

export default function FacilityCard({ facility, onClick }: FacilityCardProps) {
    const config = CATEGORY_CONFIG[facility.category] || CATEGORY_CONFIG.OTHER;
    const Icon = config.icon;

    // 가격 포맷팅 (representativePricing 우선 사용)
    let displayPrice = '가격문의';
    let priceLabel = ''; // Prefix label like "관내", "개인형"

    if (facility.representativePricing) {
        const rp = facility.representativePricing;
        if (facility.category === 'CREMATORIUM' && rp.cremation) {
            const val = rp.cremation.resident;
            if (val > 0) {
                displayPrice = formatKoreanCurrency(val);
                priceLabel = '관내';
            }
        } else if (facility.category === 'NATURAL_BURIAL' && rp.natural) {
            const val = rp.natural.individual || rp.natural.joint || rp.natural.couple;
            if (val && val > 0) {
                displayPrice = formatKoreanCurrency(val);
                priceLabel = rp.natural.individual ? '개인' : (rp.natural.joint ? '공동' : '부부');
            }
        } else if (facility.category === 'CHARNEL_HOUSE' && rp.enshrinement) {
            const val = rp.enshrinement.min;
            if (val > 0) displayPrice = formatKoreanCurrency(val);
        } else if (facility.category === 'FAMILY_GRAVE' && rp.cemetery) {
            const val = rp.cemetery.minLandFee;
            if (val > 0) {
                displayPrice = formatKoreanCurrency(val);
                priceLabel = '대지';
            }
        }
    }

    // Fallback to legacy priceRange if no representative price found (or it was 0)
    if (displayPrice === '가격문의' && facility.priceRange?.min) {
        displayPrice = formatKoreanCurrency(facility.priceRange.min * 10000);
    }

    // Flag for showing '~' (from)
    let showTilde = true;
    if (facility.category === 'CREMATORIUM' && priceLabel === '관내') showTilde = false; // Fixed fee for resident
    if (displayPrice === '가격문의') showTilde = false;

    return (
        <Card
            padding={0} // 패딩을 0으로 하고 내부 flex에서 제어
            radius="md"
            withBorder={false} // 호갱노노처럼 리스트 구분선은 상위에서, 카드 자체 테두리는 제거
            style={{
                cursor: 'pointer',
                backgroundColor: 'white',
                // 호버 효과는 상위 Box에서 처리하거나 여기서 간단히
            }}
            onClick={onClick}
        >
            <Flex h="100%">
                {/* 1. 좌측 썸네일 (고정 너비) */}
                <Box
                    w={100}
                    h={100}
                    style={{ flexShrink: 0, position: 'relative', overflow: 'hidden', borderRadius: '8px 0 0 8px' }}
                >
                    {/* Check for valid image URL first */}
                    {(() => {
                        const rawImg = facility.imageUrl || (Array.isArray(facility.images) ? facility.images[0] : facility.images) || facility.imageGallery?.[0];
                        const validUrl = getFacilityImageUrl(rawImg);

                        if (validUrl) {
                            return (
                                <Image
                                    src={validUrl}
                                    h="100%"
                                    w="100%"
                                    fit="cover"
                                    alt={facility.name}
                                // fallbackSrc removed
                                />
                            );
                        } else {
                            return (
                                <Box h="100%" bg={config.bg} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Icon size={32} color={config.color} style={{ opacity: 0.7 }} />
                                </Box>
                            );
                        }
                    })()}

                    {/* 사진 위에 카테고리 뱃지 */}
                    <Badge
                        pos="absolute"
                        top={4}
                        left={4}
                        size="xs"
                        variant="filled"
                        color="dark"
                        bg="rgba(0,0,0,0.6)"
                        style={{ backdropFilter: 'blur(4px)' }}
                    >
                        {FACILITY_CATEGORY_LABELS[facility.category]}
                    </Badge>
                </Box>

                {/* 2. 우측 정보 영역 */}
                <Box p={12} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>

                    {/* 상단: 이름 및 상태 */}
                    <div>
                        <Group justify="space-between" align="start" wrap="nowrap" mb={2}>
                            <Text fw={700} size="md" lineClamp={1} c="dark.9">
                                {facility.name}
                            </Text>
                        </Group>
                        <Text size="xs" c="dimmed" lineClamp={1}>
                            {facility.address.split(' ').slice(0, 2).join(' ')} · {facility.isPublic ? '공설' : '사설'}
                        </Text>
                    </div>

                    {/* 중단: 평점 및 리뷰 */}
                    <Group gap={8} align="center">
                        <Flex gap={2} align="center">
                            <Star size={12} fill="#FCC419" color="#FCC419" />
                            <Text size="sm" fw={600} c="dark.9">{facility.rating || "-"}</Text>
                        </Flex>
                        <Text size="xs" c="gray.5">|</Text>
                        <Text size="xs" c="gray.6">후기 {facility.reviewCount || 0}</Text>
                    </Group>

                    {/* 하단: 가격 강조 */}
                    <Group justify="space-between" align="flex-end">
                        <Group gap={2} align="flex-end">
                            {priceLabel && <Text size="xs" c="gray.6" mb={4} fw={600} mr={2}>{priceLabel}</Text>}
                            <Text fw={800} size="lg" c="#35469C" style={{ lineHeight: 1 }}>
                                {displayPrice}{showTilde ? '~' : ''}
                            </Text>
                        </Group>
                    </Group>
                </Box>
            </Flex>
        </Card>
    );
}
