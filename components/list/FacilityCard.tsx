'use client';

import { Card, Text, Badge, Group, Flex, ThemeIcon, Box } from '@mantine/core';
import NextImage from 'next/image';
import { MapPin, Building, Trees, Cross, User } from 'lucide-react';
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

    // ⭐ 별표(isRepresentative)만 사용. 없으면 "가격문의"
    let displayPrice = '가격문의';
    let priceLabel = '';

    const priceTable = (facility as any).priceInfo?.priceTable || facility.pricing;
    if (priceTable && typeof priceTable === 'object' && Object.keys(priceTable).length > 0) {
        // Preferred category matching
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

    // 🔥 Fallback: 리스트 API에서는 priceTable을 안 내려줌 → representativePrice 또는 priceRange 사용
    if (displayPrice === '가격문의') {
        const repPrice = (facility as any).representativePrice || 0;
        const minPrice = (facility as any).priceRange?.min || 0;
        const fallbackPrice = repPrice > 0 ? repPrice : minPrice;
        if (fallbackPrice > 0) {
            const normalizedPrice = fallbackPrice < 10000 ? fallbackPrice * 10000 : fallbackPrice;
            displayPrice = formatKoreanCurrency(normalizedPrice);
        }
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
                        // 🔥 thumbnail을 우선 체크 (초기 데이터)
                        const rawImg = (facility as any).thumbnail || facility.imageUrl || (Array.isArray(facility.images) ? facility.images[0] : facility.images) || facility.imageGallery?.[0];
                        const validUrl = getFacilityImageUrl(rawImg);

                        if (validUrl) {
                            return (
                                <NextImage
                                    src={validUrl}
                                    width={200}
                                    height={200}
                                    alt={facility.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    loading="lazy"
                                    sizes="100px"
                                />
                            );
                        } else {
                            return (
                                <Box h="100%" bg="#f1f3f5" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <img
                                        src="/logo-horizontal.svg"
                                        alt="대대손손"
                                        style={{ width: 60, height: 24, opacity: 0.25, filter: 'grayscale(100%)' }}
                                    />
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

                    {/* 별점/후기 제거 */}

                    {/* 하단: 가격 강조 */}
                    <Group justify="space-between" align="flex-end">
                        <Group gap={2} align="flex-end">
                            {priceLabel && <Text size="xs" c="gray.6" mb={3} fw={600} mr={2}>{priceLabel}</Text>}
                            <Text fw={700} size="md" c="#1D0098" style={{ lineHeight: 1 }}>
                                {displayPrice}{showTilde ? '~' : ''}
                            </Text>
                        </Group>
                    </Group>
                </Box>
            </Flex>
        </Card>
    );
}
