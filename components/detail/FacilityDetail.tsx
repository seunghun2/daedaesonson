import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Script from 'next/script';
import NextImage from 'next/image';
import { Image, Text, Badge, Group, Button, Stack, Box, Paper, Modal, Tabs, Collapse, ActionIcon, Rating, Textarea, TextInput, LoadingOverlay, useMantineTheme, Accordion, Table, Switch, Select, Drawer, Tooltip, Popover } from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { Car, Utensils, Accessibility, Store, Navigation, Globe, ChevronLeft, ChevronRight, TrendingUp, ChevronDown, ChevronUp, Star, Pencil, Camera, X, ImageIcon, Plus, Trash, Archive, Mountain, Trees, Layers, Lock, Unlock, Check } from 'lucide-react';
import InquiryPanel from './InquiryPanel';
import ScrollableTabsList from '@/components/ScrollableTabsList';
import ReviewsPanel from './ReviewsPanel';
import { Facility, FACILITY_CATEGORY_LABELS, Review } from '@/types';
import { PRICE_TAB_CATEGORIES, OTHER_TAB_CATEGORY } from '@/lib/constants';
import { formatKoreanCurrency, formatRelativeTime } from '@/lib/format';
import { getSingleFacilityImageUrl } from '@/lib/supabaseImage';

// ... (Existing code) ...

// Helper Component for Operator Badge
const OperatorBadge = ({ type, name }: { type?: string, name: string }) => {
    let label = '';
    let color = 'gray';

    // 1. Check explicit type first
    if (type) {
        switch (type) {
            case 'FOUNDATION': label = '재단법인'; color = 'blue'; break;
            case 'CORPORATION': label = '주식회사'; color = 'teal'; break;
            case 'ASSOCIATION': label = '사단법인'; color = 'orange'; break;
            case 'RELIGIOUS': label = '종교법인'; color = 'grape'; break;
            case 'PUBLIC': label = '공설'; color = 'gray'; break;
        }
    }

    // 2. Infer from name if not found
    if (!label) {
        if (name.includes('(재)') || name.includes('재단법인')) { label = '재단법인'; color = 'blue'; }
        else if (name.includes('(주)') || name.includes('주식회사')) { label = '주식회사'; color = 'teal'; }
        else if (name.includes('(사)') || name.includes('사단법인')) { label = '사단법인'; color = 'orange'; }
        else if (name.includes('(종)') || name.includes('종교법인')) { label = '종교법인'; color = 'grape'; }
        else if (name.includes('공설')) { label = '공설'; color = 'gray'; }
    }

    if (!label) return null;

    return (
        <Badge
            size="xs"
            radius="sm"
            color={color}
            variant="filled"
            ml={6}
            style={{ flexShrink: 0, fontWeight: 500 }}
        >
            {label}
        </Badge>
    );
};

// Helper to clean name for presentation
const getDisplayName = (name: string) => {
    return name.replace(/\(재\)/g, '')
        .replace(/재단법인/g, '')
        .replace(/\(주\)/g, '')
        .replace(/주식회사/g, '')
        .replace(/\(사\)/g, '')
        .replace(/사단법인/g, '')
        .replace(/\(종\)/g, '')
        .replace(/종교법인/g, '')
        .trim();
};

function PriceInfoSection({ priceInfo, hasPrice }: { priceInfo: any, hasPrice: boolean }) {
    if (!priceInfo) return null;

    // === V2: 표준화 데이터가 있으면 새 형식으로 렌더링 ===
    const standardizedPrices = priceInfo.standardizedPrices as Array<{
        serviceType: string; subType: string; unit: string;
        rows: Array<{
            name: string; price: number; feeType?: string; residency?: string;
            area?: number; areaUnit?: string; duration?: number; durationType?: string;
            capacity?: string; paymentCycle?: string; taxIncluded?: boolean;
            grade?: string; note?: string; isRepresentative?: boolean; groupType?: string;
        }>;
    }> | undefined;

    const hasStandardized = standardizedPrices && standardizedPrices.length > 0 &&
        standardizedPrices.some(g => g.rows.length > 0);

    // === 공통 헬퍼 ===
    const getServiceIcon = (type: string) => {
        if (/BURIAL|매장/.test(type)) return <Mountain size={24} color="#495057" />;
        if (/BONGSAN|봉안/.test(type)) return <Archive size={24} color="#495057" />;
        if (/NATURAL|수목/.test(type)) return <Trees size={24} color="#495057" />;
        return <Layers size={24} color="#495057" />;
    };

    const getServiceLabel = (type: string) => {
        if (type === 'BONGSAN') return '봉안당';
        if (type === 'NATURAL') return '수목장';
        if (type === 'BURIAL') return '매장묘';
        return type;
    };

    const formatName = (name: string) => {
        return name
            .replace(/(\d+)위/g, '$1분 안치')
            .replace(/1분 안치/g, '1분 안치 (개인형)')
            .replace(/2분 안치/g, '2분 안치 (부부형)');
    };

    // === V2 렌더링: 표준화 데이터 ===
    if (hasStandardized) {
        // 서비스 타입별로 그룹핑
        const serviceTypesRaw = [...new Set(standardizedPrices!.map(g => g.serviceType))];
        // 탭 순서: 봉안당 → 매장묘 → 수목장 → 기타
        const serviceTypeOrder = ['BONGSAN', 'BURIAL', 'NATURAL'];
        const serviceTypes = serviceTypesRaw.sort((a, b) => {
            const ai = serviceTypeOrder.indexOf(a);
            const bi = serviceTypeOrder.indexOf(b);
            return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
        });

        const getSubTypeDescription = (subType: string) => {
            const map: Record<string, string> = {
                '매장묘': '시신을 땅에 묻는 전통 장법입니다. 단분(1인), 합장(2인 1기), 쌍분(나란히 2기) 등으로 나뉩니다.',
                '평장묘': '봉분(흙무덤)을 만들지 않고 평평하게 조성하는 묘지입니다. 잔디장이라고도 합니다.',
                '봉안묘': '화장 후 유골을 묘지 형태로 안치하는 방식입니다.',
                '봉안담': '화장 후 유골함을 담 형태의 시설에 안치하는 방식입니다. 봉안당보다 저렴한 편입니다.',
                '봉안당': '화장 후 유골을 봉안당(납골당)에 안치하는 방식입니다. 단수가 높을수록 가격이 낮아지는 경향이 있습니다.',
                '수목장': '화장 후 유골을 나무 밑에 매장하는 친환경 장법입니다.',
                '잔디장': '화장 후 유골을 잔디밭 아래에 매장하는 친환경 장법입니다.',
                '자연장': '화장 후 유골을 나무 밑이나 잔디밭 등 자연에 매장하는 친환경 장법입니다.',
            };
            for (const [key, desc] of Object.entries(map)) {
                if (subType.includes(key) || key.includes(subType)) return desc;
            }
            return '';
        };

        // 서비스 타입별 최저가 계산
        const getMinPriceForService = (serviceType: string) => {
            const groups = standardizedPrices!.filter(g => g.serviceType === serviceType);
            const usageRows = groups.flatMap(g =>
                g.rows.filter(r => !r.feeType || r.feeType === 'USAGE' || (r.feeType === 'MAINTENANCE' && r.groupType))
            );
            // isRepresentative 항목들 중 최저가 우선, 없으면 전체 최저가
            const repItems = usageRows.filter(r => r.isRepresentative && r.price > 0);
            if (repItems.length > 0) return Math.min(...repItems.map(r => r.price));
            const prices = usageRows.map(r => r.price).filter(p => p > 0);
            return prices.length > 0 ? Math.min(...prices) : 0;
        };

        // 서브타입 설명 토글 상태
        const [openDescSubType, setOpenDescSubType] = useState<string | null>(null);
        // 아코디언 열림 상태 (controlled) - 초기값은 아래에서 설정
        const [openAccItems, setOpenAccItems] = useState<string[]>(() => {
            // 초기값: 카테고리가 1개인 서비스타입은 자동 열기
            if (!standardizedPrices) return [];
            const byService: Record<string, string[]> = {};
            standardizedPrices.forEach(g => {
                if (!byService[g.serviceType]) byService[g.serviceType] = [];
                byService[g.serviceType].push(g.subType);
            });
            const autoOpen: string[] = [];
            Object.values(byService).forEach(subs => {
                if (subs.length === 1) autoOpen.push(subs[0]);
            });
            return autoOpen;
        });

        // 서브타입 아코디언 아이템 렌더링
        const renderSubTypeAccordionItem = (group: typeof standardizedPrices[0]) => {
            const usageRows = group.rows.filter(r =>
                !r.feeType || r.feeType === 'USAGE' || (r.feeType === 'MAINTENANCE' && r.groupType)
            );
            const mgmtRows = group.rows.filter(r =>
                r.feeType === 'MAINTENANCE' && !r.groupType
            );
            const otherRows = group.rows.filter(r =>
                r.feeType && !['USAGE', 'MAINTENANCE'].includes(r.feeType)
            );

            // groupType별 탭 분류
            const groupedUsage: Record<string, typeof usageRows> = {};
            usageRows.forEach(row => {
                const g = row.groupType || '미분류';
                if (!groupedUsage[g]) groupedUsage[g] = [];
                groupedUsage[g].push(row);
            });
            // 관리비를 맨 뒤로 정렬
            const usageGroupNames = Object.keys(groupedUsage).sort((a, b) => {
                const aIsMgmt = /관리비/.test(a) ? 1 : 0;
                const bIsMgmt = /관리비/.test(b) ? 1 : 0;
                return aIsMgmt - bIsMgmt;
            });

            const renderRow = (row: typeof usageRows[0], idx: number, prefix: string) => (
                <Box key={`${prefix}-${idx}`}
                    style={{
                        borderBottom: '1px solid #f1f3f5',
                        padding: '10px 0',
                    }}
                >
                    <Group justify="space-between" align="center" wrap="nowrap" gap={8}>
                        <Group gap={6} wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                            <Text fw={600} size="13px" c="dark.9" style={{ whiteSpace: 'nowrap' }}>
                                {formatName(row.name)}
                            </Text>
                            {row.residency && row.residency !== 'ALL' && (
                                <Badge size="xs" variant="light"
                                    color={row.residency === 'LOCAL' ? 'blue' : row.residency === 'VETERAN' ? 'grape' : 'orange'}
                                >
                                    {row.residency === 'LOCAL' ? '관내' : row.residency === 'NON_LOCAL' ? '관외' : '유공자'}
                                </Badge>
                            )}
                            {row.paymentCycle && (
                                <Badge size="xs" variant="outline" color="gray">
                                    {row.paymentCycle === 'MONTHLY' ? '월납' : row.paymentCycle === 'YEARLY' ? '연납' : '일시납'}
                                </Badge>
                            )}
                        </Group>
                        <Text fw={700} size="13px" c="black" style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
                            {formatKoreanCurrency(row.price)}
                            {row.taxIncluded === false && <Text span size="9px" c="dimmed"> +VAT</Text>}
                        </Text>
                    </Group>
                    {row.grade && row.grade !== '-' && (
                        <Text size="11px" c="dimmed" mt={4} style={{ lineHeight: 1.4 }}>
                            {row.grade}
                        </Text>
                    )}
                </Box>
            );

            const desc = getSubTypeDescription(group.subType);
            const isDescOpen = openDescSubType === group.subType;

            return (
                <Accordion.Item key={group.subType} value={group.subType}>
                    <Accordion.Control styles={{ chevron: { marginLeft: 4 } }}>
                        <Group justify="space-between" wrap="nowrap">
                            <Group gap={6} align="center" wrap="nowrap">
                                <Text fw={600} size="sm" c="dark.7">{group.subType}</Text>
                                {desc && (
                                    <span
                                        role="button"
                                        tabIndex={0}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            setOpenDescSubType(isDescOpen ? null : group.subType);
                                            // 닫혀있으면 아코디언도 열기
                                            if (!isDescOpen && !openAccItems.includes(group.subType)) {
                                                setOpenAccItems(prev => [...prev, group.subType]);
                                            }
                                        }}
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: 20,
                                            height: 20,
                                            borderRadius: '50%',
                                            backgroundColor: isDescOpen ? '#868e96' : '#ced4da',
                                            cursor: 'pointer',
                                            flexShrink: 0,
                                            transition: 'background-color 0.2s',
                                        }}
                                    >
                                        <span style={{ fontSize: '11px', color: '#fff', fontWeight: 500, lineHeight: 1 }}>?</span>
                                    </span>
                                )}
                            </Group>
                            <Group gap={4} wrap="nowrap">
                                <Badge color="gray" variant="light" size="sm">
                                    {usageRows.length} 항목
                                </Badge>
                            </Group>
                        </Group>
                    </Accordion.Control>
                    <Accordion.Panel>
                        {desc && isDescOpen && (
                            <Box mb={12} py={10} px={12} style={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1.5px solid #ced4da', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                                <Text size="xs" c="dark.6" style={{ lineHeight: 1.6 }}>
                                    {desc}
                                </Text>
                            </Box>
                        )}
                        {usageGroupNames.length > 1 ? (
                            <Tabs defaultValue={usageGroupNames[0]}>
                                <ScrollableTabsList mb="md">
                                    {usageGroupNames.map(gn => (
                                        <Tabs.Tab key={gn} value={gn} style={{ flexShrink: 0 }}>{gn}</Tabs.Tab>
                                    ))}
                                </ScrollableTabsList>
                                {usageGroupNames.map(gn => (
                                    <Tabs.Panel key={gn} value={gn}>
                                        <Stack gap="sm">
                                            {groupedUsage[gn].map((row, idx) => renderRow(row, idx, gn))}
                                        </Stack>
                                    </Tabs.Panel>
                                ))}
                            </Tabs>
                        ) : (
                            <Stack gap="sm">
                                {usageRows.map((row, idx) => renderRow(row, idx, 'main'))}
                            </Stack>
                        )}

                        {/* 관리비 */}
                        {mgmtRows.length > 0 && (
                            <Box p="sm" style={{ borderRadius: 6, border: '1px solid #e9ecef' }} mt="md">
                                <Text size="11px" fw={700} c="dimmed" mb="xs">관리비 안내</Text>
                                <Stack gap="xs">
                                    {mgmtRows.map((row, idx) => (
                                        <Group key={`mgmt-${idx}`} justify="space-between">
                                            <Group gap={4}>
                                                <Text size="xs" c="dark.5">{row.name}</Text>
                                                {row.paymentCycle && (
                                                    <Badge size="xs" variant="outline" color="gray">
                                                        {row.paymentCycle === 'MONTHLY' ? '월납' : row.paymentCycle === 'YEARLY' ? '연납' : '일시납'}
                                                    </Badge>
                                                )}
                                            </Group>
                                            <Text size="xs" fw={600} c="dark.7">{formatKoreanCurrency(row.price)}</Text>
                                        </Group>
                                    ))}
                                </Stack>
                            </Box>
                        )}

                        {/* 기타 비용 */}
                        {otherRows.length > 0 && (
                            <Box bg="white" p="xs" style={{ borderRadius: 6, border: '1px solid #f1f3f5' }} mt="md">
                                <Text size="11px" fw={700} c="dimmed" mb="xs">부가 옵션</Text>
                                <Stack gap="xs">
                                    {otherRows.map((row, idx) => (
                                        <Group key={`other-${idx}`} justify="space-between">
                                            <Text size="xs" c="dark.5">{row.name}</Text>
                                            <Text size="xs" fw={600} c="dark.7">{formatKoreanCurrency(row.price)}</Text>
                                        </Group>
                                    ))}
                                </Stack>
                            </Box>
                        )}
                    </Accordion.Panel>
                </Accordion.Item>
            );
        };

        return (
            <Box bg="white" p="md" pb="md" style={{ borderBottom: '8px solid #f8f9fa', boxShadow: 'inset 0 -1px 0 #e9ecef' }}>

                {/* 서비스 타입이 1개면 탭 없이 바로, 2개 이상이면 탭 */}
                {serviceTypes.length <= 1 ? (
                    (() => {
                        const serviceType = serviceTypes[0];
                        const groups = standardizedPrices!.filter(g => g.serviceType === serviceType);
                        return (
                            <Accordion
                                variant="separated" radius="md" multiple
                                defaultValue={undefined}
                                value={openAccItems}
                                onChange={setOpenAccItems}
                                styles={{
                                    item: { backgroundColor: '#f8f9fa', border: 'none' },
                                    control: { padding: '12px 16px' },
                                    content: { padding: '0 24px 16px 24px' },
                                }}
                            >
                                {groups.map(group => renderSubTypeAccordionItem(group))}
                            </Accordion>
                        );
                    })()
                ) : (
                    <Tabs defaultValue={serviceTypes[0]}>
                        <ScrollableTabsList grow mb="md">
                            {serviceTypes.map(st => (
                                <Tabs.Tab key={st} value={st} style={{ padding: '10px 0' }}>
                                    <Group gap={6} align="center" justify="center">
                                        {getServiceIcon(st)}
                                        <Text size="sm" fw={600}>{getServiceLabel(st)}</Text>
                                    </Group>
                                </Tabs.Tab>
                            ))}
                        </ScrollableTabsList>

                        {serviceTypes.map(st => {
                            const groups = standardizedPrices!.filter(g => g.serviceType === st);
                            return (
                                <Tabs.Panel key={st} value={st}>
                                    <Accordion
                                        variant="separated" radius="md" multiple
                                        defaultValue={undefined}
                                        value={openAccItems}
                                        onChange={setOpenAccItems}
                                        styles={{
                                            item: { backgroundColor: '#f8f9fa', border: 'none' },
                                            control: { padding: '12px 16px' },
                                            content: { padding: '0 24px 16px 24px' },
                                        }}
                                    >
                                        {groups.map(group => renderSubTypeAccordionItem(group))}
                                    </Accordion>
                                </Tabs.Panel>
                            );
                        })}
                    </Tabs>
                )}

                <Box mt="xl" p="lg" bg="gray.0" style={{ borderRadius: 8 }}>
                    <Text size="xs" c="dimmed" style={{ lineHeight: 1.6 }}>
                        사용료는 <b>e하늘 장사정보 시스템</b>에 등록되어 있는 가격정보를 바탕으로 안내해드리고 있어 상이할 수 있습니다.<br />
                        사용료 정보가 안내되지 않은 시설은 <b>해당 시설에 직접 문의</b>바랍니다.
                    </Text>
                </Box>
            </Box>
        );
    }

    // === V1 렌더링: 레거시 priceTable ===
    let priceTable = priceInfo.priceTable;
    if (!priceTable && (priceInfo.products || priceInfo.installationCosts || priceInfo.managementCosts)) {
        priceTable = {};
        if (priceInfo.products) Object.assign(priceTable, priceInfo.products);
        if (priceInfo.installationCosts) priceTable['[별도] 시설설치 및 석물비용'] = priceInfo.installationCosts;
        if (priceInfo.managementCosts) priceTable['[안내] 관리비 및 용역비'] = priceInfo.managementCosts;
    }

    if (!priceTable) {
        return hasPrice ? (
            <Box bg="white" p="md" style={{ borderBottom: '8px solid #f8f9fa', boxShadow: 'inset 0 -1px 0 #e9ecef' }}>
                <Text size="sm" fw={700} mb="xs">가격 상세 정보</Text>
                <Text size="xs" c="dimmed">아직 등록된 상세 가격 정보가 없습니다. 관리실로 문의해주세요.</Text>
            </Box>
        ) : null;
    }

    // 2. Grouping Logic (Burial / Charnel / Natural / Etc)
    const groups: Record<string, { label: string, items: any[], categories: string[] }> = {
        charnel: { label: '봉안당', items: [], categories: [] },
        burial: { label: '매장묘', items: [], categories: [] },
        natural: { label: '수목장', items: [], categories: [] },
        etc: { label: '기타/공통', items: [], categories: [] }
    };

    Object.entries(priceTable).forEach(([catName, catData]: [string, any]) => {
        let key = 'etc';
        if (/매장|묘지|봉분|둘레석|단장|합장|쌍분|복합묘|평장/.test(catName)) key = 'burial';
        else if (/기본비용/.test(catName)) key = 'burial';
        else if (/봉안|납골|유골/.test(catName)) key = 'charnel';
        else if (/수목|자연|잔디|화초|암석/.test(catName)) key = 'natural';

        const rows = catData.rows || [];
        if (rows.length > 0) {
            groups[key].items.push(...rows);
            groups[key].categories.push(catName);
        }
    });

    const visibleGroups = Object.values(groups).filter(g => g.items.length > 0);

    // 3. Min Price Calculation (Prioritize Representative)
    const getMinPrice = (items: any[]) => {
        const repItem = items.find(i => i.isRepresentative);
        if (repItem && repItem.price > 0) return repItem.price;

        const candidates = items.filter(i => {
            const n = i.name || '';
            if (/관리|석물|작업|각자|제례|상석/.test(n)) return false;
            return true;
        });
        if (candidates.length === 0) return 0;

        const prices = candidates.map(i => {
            if (typeof i.price === 'number') return i.price;
            return Number(String(i.price).replace(/,/g, ''));
        }).filter(p => !isNaN(p) && p > 0);

        if (prices.length === 0) return 0;
        return Math.min(...prices);
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'burial': return <Mountain size={24} color="#495057" />;
            case 'charnel': return <Archive size={24} color="#495057" />;
            case 'natural': return <Trees size={24} color="#495057" />;
            default: return <Layers size={24} color="#495057" />;
        }
    };

    if (visibleGroups.length === 0) return null;

    const displayGroups = visibleGroups.filter(g => !g.label.includes('기타'));

    return (
        <Box bg="white" p="md" pb="md" style={{ borderBottom: '8px solid #f8f9fa', boxShadow: 'inset 0 -1px 0 #e9ecef' }}>
            <Text size="sm" fw={700} mb="md">
                사용료
            </Text>

            <Accordion
                variant="default" radius="md" multiple
                styles={{
                    item: { borderBottom: '1px solid #f1f3f5' },
                    control: { padding: '12px 0', '&:hover': { backgroundColor: 'transparent' } },
                    content: { padding: '0 8px 16px 8px' },
                    chevron: { display: 'none' }
                }}
            >
                {displayGroups.map((group) => {
                    const minPrice = getMinPrice(group.items);
                    const hasMinPrice = minPrice > 0 && minPrice < Infinity;

                    let groupKey = 'etc';
                    if (group.label.includes('매장')) groupKey = 'burial';
                    else if (group.label.includes('봉안')) groupKey = 'charnel';
                    else if (group.label.includes('수목')) groupKey = 'natural';

                    return (
                        <Accordion.Item key={group.label} value={group.label}>
                            <Accordion.Control>
                                <Group justify="space-between" wrap="nowrap">
                                    <Group gap="md">
                                        {getIcon(groupKey)}
                                        <Text fw={700} size="lg" c="dark.9">{group.label}</Text>
                                    </Group>

                                    <Group gap="xs">
                                        {hasMinPrice ? (
                                            <Text fw={800} c="#1D0098" size="lg">
                                                {formatKoreanCurrency(minPrice)}부터
                                            </Text>
                                        ) : (
                                            <Text size="sm" c="dimmed">가격 문의</Text>
                                        )}
                                        <ChevronRight size={18} color="#adb5bd" />
                                    </Group>
                                </Group>
                            </Accordion.Control>

                            <Accordion.Panel>
                                <Accordion
                                    variant="separated" radius="md" multiple
                                    defaultValue={group.categories.length === 1 ? group.categories : []}
                                    styles={{
                                        item: { backgroundColor: '#f8f9fa', border: 'none' },
                                        control: { padding: '12px 16px' },
                                        content: { padding: '0 24px 16px 24px' },
                                    }}
                                >
                                    {group.categories.map(cat => {
                                        const rows = priceTable[cat].rows;
                                        const mainRows = rows.filter((r: any) => !/관리|석물|작업|각자|제례|상석/.test(r.name));
                                        const optionRows = rows.filter((r: any) => /관리|석물|작업|각자|제례|상석/.test(r.name));

                                        const groupedRows: Record<string, any[]> = {};
                                        mainRows.forEach((row: any) => {
                                            const gType = row.groupType || '미분류';
                                            if (!groupedRows[gType]) groupedRows[gType] = [];
                                            groupedRows[gType].push(row);
                                        });
                                        const groupNames = Object.keys(groupedRows);

                                        const catDescMap: Record<string, string> = {
                                            '매장묘': '시신을 땅에 묻는 전통 장법입니다. 단분(1인), 합장(2인 1기), 쌍분(나란히 2기) 등으로 나뉩니다.',
                                            '평장묘': '봉분(흙무덤)을 만들지 않고 평평하게 조성하는 묘지입니다. 잔디장이라고도 합니다.',
                                            '봉안담': '화장 후 유골함을 담 형태의 시설에 안치하는 방식입니다. 봉안당보다 저렴한 편입니다.',
                                            '봉안당': '화장 후 유골을 봉안당(납골당)에 안치하는 방식입니다. 단수가 높을수록 가격이 낮아지는 경향이 있습니다.',
                                            '봉안묘': '화장 후 유골을 묘지 형태로 안치하는 방식입니다.',
                                            '수목형': '화장 후 유골을 나무 밑에 매장하는 친환경 장법입니다.',
                                            '잔디형': '화장 후 유골을 잔디밭 아래에 매장하는 친환경 장법입니다.',
                                            '화초형': '화장 후 유골을 화초 밑에 매장하는 친환경 장법입니다.',
                                            '자연장': '화장 후 유골을 나무 밑이나 잔디밭 등 자연에 매장하는 친환경 장법입니다.',
                                        };
                                        const catDesc = Object.entries(catDescMap).find(([k]) => cat.includes(k))?.[1] || '';

                                        return (
                                            <Accordion.Item key={cat} value={cat}>
                                                <Accordion.Control>
                                                    <Group justify="space-between" wrap="nowrap">
                                                        <Group gap={6} align="center" wrap="nowrap">
                                                            <Text fw={600} size="sm" c="dark.7">{cat}</Text>
                                                            {catDesc && (
                                                                <span
                                                                    role="button"
                                                                    tabIndex={0}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        e.preventDefault();
                                                                        const el = document.getElementById(`desc-${cat}`);
                                                                        if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
                                                                    }}
                                                                    style={{
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        width: 20,
                                                                        height: 20,
                                                                        borderRadius: '50%',
                                                                        backgroundColor: '#ced4da',
                                                                        cursor: 'pointer',
                                                                        flexShrink: 0,
                                                                    }}
                                                                >
                                                                    <span style={{ fontSize: '11px', color: '#fff', fontWeight: 500, lineHeight: 1 }}>?</span>
                                                                </span>
                                                            )}
                                                        </Group>
                                                        <Badge color="gray" variant="light" size="sm">
                                                            {mainRows.length} 항목
                                                        </Badge>
                                                    </Group>
                                                </Accordion.Control>
                                                <Accordion.Panel>
                                                    {catDesc && (
                                                        <Box id={`desc-${cat}`} mb={12} py={10} px={12} style={{ display: 'none', backgroundColor: '#ffffff', borderRadius: 8, border: '1.5px solid #ced4da', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                                                            <Text size="xs" c="dark.6" style={{ lineHeight: 1.6 }}>
                                                                {catDesc}
                                                            </Text>
                                                        </Box>
                                                    )}
                                                    {groupNames.length > 1 ? (
                                                        <Tabs defaultValue={groupNames[0]}>
                                                            <ScrollableTabsList mb="md">
                                                                {groupNames.map((gName, idx) => (
                                                                    <Tabs.Tab key={idx} value={gName} style={{ flexShrink: 0 }}>{gName}</Tabs.Tab>
                                                                ))}
                                                            </ScrollableTabsList>
                                                            {groupNames.map((gName, idx) => {
                                                                const groupOptions = optionRows.filter((r: any) => r.groupType === gName);
                                                                return (
                                                                    <Tabs.Panel key={idx} value={gName}>
                                                                        <Stack gap="sm">
                                                                            {groupedRows[gName].map((row: any, rowIdx: number) => (
                                                                                <Box key={`${gName}-${rowIdx}`}
                                                                                    style={{ borderBottom: '1px solid #f1f3f5', padding: '10px 0' }}
                                                                                >
                                                                                    <Group justify="space-between" align="center" wrap="nowrap" gap={8}>
                                                                                        <Text fw={600} size="13px" c="dark.9" style={{ whiteSpace: 'nowrap' }}>
                                                                                            {formatName(row.name)}
                                                                                        </Text>
                                                                                        <Text fw={700} size="13px" c="black" style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
                                                                                            {formatKoreanCurrency(row.price)}
                                                                                        </Text>
                                                                                    </Group>
                                                                                    {row.grade && row.grade !== '-' && (
                                                                                        <Text size="11px" c="dimmed" mt={4} style={{ lineHeight: 1.4 }}>
                                                                                            {row.grade}
                                                                                        </Text>
                                                                                    )}
                                                                                </Box>
                                                                            ))}
                                                                        </Stack>
                                                                        {groupOptions.length > 0 && (
                                                                            <Box bg="white" p="xs" style={{ borderRadius: 6, border: '1px solid #f1f3f5' }} mt="md">
                                                                                <Text size="11px" fw={700} c="dimmed" mb="xs">부가 옵션</Text>
                                                                                <Stack gap="xs">
                                                                                    {groupOptions.map((row: any, optIdx: number) => (
                                                                                        <Group key={`opt-${gName}-${optIdx}`} justify="space-between">
                                                                                            <Text size="xs" c="dark.5">{row.name}</Text>
                                                                                            <Text size="xs" fw={600} c="dark.7">{formatKoreanCurrency(row.price)}</Text>
                                                                                        </Group>
                                                                                    ))}
                                                                                </Stack>
                                                                            </Box>
                                                                        )}
                                                                    </Tabs.Panel>
                                                                );
                                                            })}
                                                        </Tabs>
                                                    ) : (
                                                        <>
                                                            <Stack gap="sm" mb={optionRows.length > 0 ? "lg" : 0}>
                                                                {mainRows.map((row: any, idx: number) => (
                                                                    <Box key={`main-${idx}`}
                                                                        style={{ borderBottom: '1px solid #f1f3f5', padding: '10px 0' }}
                                                                    >
                                                                        <Group justify="space-between" align="center" wrap="nowrap" gap={8}>
                                                                            <Text fw={600} size="13px" c="dark.9" style={{ whiteSpace: 'nowrap' }}>
                                                                                {formatName(row.name)}
                                                                            </Text>
                                                                            <Text fw={700} size="13px" c="black" style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
                                                                                {formatKoreanCurrency(row.price)}
                                                                            </Text>
                                                                        </Group>
                                                                        {row.grade && row.grade !== '-' && (
                                                                            <Text size="11px" c="dimmed" mt={4} style={{ lineHeight: 1.4 }}>
                                                                                {row.grade}
                                                                            </Text>
                                                                        )}
                                                                    </Box>
                                                                ))}
                                                            </Stack>
                                                            {optionRows.length > 0 && (
                                                                <Box bg="white" p="xs" style={{ borderRadius: 6, border: '1px solid #f1f3f5' }}>
                                                                    <Text size="11px" fw={700} c="dimmed" mb="xs">부가 옵션</Text>
                                                                    <Stack gap="xs">
                                                                        {optionRows.map((row: any, idx: number) => (
                                                                            <Group key={`opt-${idx}`} justify="space-between">
                                                                                <Text size="xs" c="dark.5">{row.name}</Text>
                                                                                <Text size="xs" fw={600} c="dark.7">{formatKoreanCurrency(row.price)}</Text>
                                                                            </Group>
                                                                        ))}
                                                                    </Stack>
                                                                </Box>
                                                            )}
                                                        </>
                                                    )}
                                                </Accordion.Panel>
                                            </Accordion.Item>
                                        );
                                    })}
                                </Accordion>
                            </Accordion.Panel>
                        </Accordion.Item>
                    );
                })}
            </Accordion>

            <Box mt="xl" p="lg" bg="gray.0" style={{ borderRadius: 8 }}>
                <Text size="xs" c="dimmed" style={{ lineHeight: 1.6 }}>
                    사용료는 <b>e하늘 장사정보 시스템</b>에 등록되어 있는 가격정보를 바탕으로 안내해드리고 있어 상이할 수 있습니다.<br />
                    사용료 정보가 안내되지 않은 시설은 <b>해당 시설에 직접 문의</b>바랍니다.
                </Text>
            </Box>
        </Box>
    );
}

interface FacilityDetailProps {
    facility: Facility;
    onClose: () => void;
    allFacilities?: Facility[];
    onSelectFacility?: (id: string) => void;
    onMapView?: (lat: number, lng: number) => void;
    initialConsultOpen?: boolean; // 상담 모달 초기 열림 상태
    isDesktop?: boolean; // PC 사이드 패널 모드
}

export default function FacilityDetail({ facility: initialFacility, onClose, allFacilities = [], onSelectFacility, onMapView, initialConsultOpen = false, isDesktop = false }: FacilityDetailProps) {
    const router = useRouter();
    const [facility, setFacility] = useState<Facility>(initialFacility);
    const [isFetchingDetail] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // 🚀 초기 데이터로 렌더링 + thumbnail → imageGallery 매핑
        const enriched = { ...initialFacility };
        if (!enriched.imageGallery?.length && (enriched as any).thumbnail) {
            enriched.imageGallery = [(enriched as any).thumbnail];
        }
        setFacility(enriched);

        // 스크롤 맨 위로
        containerRef.current?.scrollTo({ top: 0 });
        containerRef.current?.parentElement?.scrollTo({ top: 0 });

        // 📊 GA4 이벤트 전송 - 시설 상세 조회 (페이지 리포트에 표시)
        if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('event', 'page_view', {
                page_title: `${initialFacility.name} - 시설 상세`,
                page_location: window.location.href,
                page_path: `/?id=${initialFacility.id}`,
                facility_id: initialFacility.id,
                facility_name: initialFacility.name,
                facility_category: initialFacility.category,
                is_public: initialFacility.isPublic
            });
        }

        // 🔥 상세 정보 백그라운드 로딩 (UI 블로킹 없음)
        if (!initialFacility.priceInfo && !initialFacility.pricing) {
            fetch(`/api/facilities/${initialFacility.id}`)
                .then(res => res.json())
                .then(fullData => {
                    if (!fullData || fullData.error) return;
                    setFacility(prev => ({ ...prev, ...fullData }));
                })
                .catch(() => { });
        }
    }, [initialFacility]);
    const [opened, setOpened] = useState(false); // Image Modal state
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false); // 🔒 스와이프 애니메이션 중복 방지

    // 이미지 갤러리 열릴 때 body 스크롤 막기
    useEffect(() => {
        if (opened) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [opened]);

    // 조회수 상태 (초기값: 시설 데이터에서 가져오거나 ID 기반 계산)
    const getInitialViewCount = () => {
        const hash = facility.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return 50 + (hash * 17) % 450;
    };
    const baseCount = (facility as any).viewCount || getInitialViewCount();
    // 🚀 즉시 +1 표시 (마운트 시점에 바로)
    const [viewCount, setViewCount] = useState(baseCount + 1);

    // 🔥 리뷰/문의 데이터 동기화 (facility prop 변경 시마다 실행)
    useEffect(() => {
        setReviews(facility.reviews || []);
        setInquiries((facility as any).inquiries || []);
        setReviewCount(facility.reviews?.length || 0);
        setShowAllInquiries(false);
    }, [facility]);

    // 🔥 조회수 증가 API 호출 - Fire & Forget (시설 변경 시에만)
    useEffect(() => {
        // 백그라운드에서 조회수 증가 (UI 블로킹 없음)
        fetch(`/api/facilities/${facility.id}/view`, { method: 'POST' })
            .then(res => res.ok && res.json())
            .then(data => data?.viewCount && setViewCount(data.viewCount))
            .catch(() => { }); // 실패해도 무시

        // 전체 문의 개수 가져오기 (빠른 count API)
        fetch('/api/admin/inquiries/count')
            .then(res => res.json())
            .then(data => setTotalInquiryCount(data.count || 0))
            .catch(() => { });
    }, [facility.id]);

    const theme = useMantineTheme();
    const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);

    // Inquiry State (문의 폼)
    const [reviews, setReviews] = useState<Review[]>(facility.reviews || []);
    const [inquiries, setInquiries] = useState<any[]>((facility as any).inquiries || []);
    const [reviewCount, setReviewCount] = useState(facility.reviews?.length || 0);
    const [reviewModalOpened, { open: openReviewModal, close: closeReviewModal }] = useDisclosure(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [inquiryForm, setInquiryForm] = useState({
        type: '', // 문의 종류
        facilityId: facility.id, // 선택된 시설
        facilityName: facility.name,
        title: '',
        content: '',
        phone: '',
        isPrivate: true,
        photos: [] as string[],
        privacyAgreed: true, // 개인정보 동의
    });
    const fileInputRef = useRef<HTMLInputElement>(null);
    const reviewFileInputRef = useRef<HTMLInputElement>(null);
    const replyFileInputRef = useRef<HTMLInputElement>(null);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [replyPhotos, setReplyPhotos] = useState<string[]>([]);
    const [replyNickname, setReplyNickname] = useState('');
    const [replyPassword, setReplyPassword] = useState('');
    const [likedReviews, setLikedReviews] = useState<Set<string>>(new Set());
    const [inquiryOpen, setInquiryOpen] = useState(false);
    const [reviewsOpen, setReviewsOpen] = useState(false);

    // 대댓글 삭제 모달 상태
    const [deleteReplyModal, setDeleteReplyModal] = useState<{ reviewId: string; replyId: string } | null>(null);
    const [deleteReplyPassword, setDeleteReplyPassword] = useState('');
    const [deleteReplyError, setDeleteReplyError] = useState('');

    // 더보기 펼치기 상태
    const [showAllReviews, setShowAllReviews] = useState(false);
    const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

    // 이미지 확대 (풀스크린 오버레이 - 기존 갤러리 스타일)
    const [enlargedImages, setEnlargedImages] = useState<string[]>([]);
    const [enlargedImageIndex, setEnlargedImageIndex] = useState(0);

    const openImageViewer = (photos: string[], index: number) => {
        setEnlargedImages(photos);
        setEnlargedImageIndex(index);
    };
    const closeImageViewer = () => {
        setEnlargedImages([]);
        setEnlargedImageIndex(0);
    };

    // 후기 작성 폼
    // 랜덤 닉네임 생성
    const generateRandomNickname = () => {
        const adjectives = [
            '따뜻한', '용감한', '행복한', '빛나는', '고요한', '푸른', '다정한',
            '씩씩한', '귀여운', '지혜로운', '활기찬', '느긋한', '상냥한', '멋진',
            '당당한', '포근한', '깔끔한', '든든한', '차분한', '솔직한',
        ];
        const nouns = [
            '하늘', '바다', '별', '햇살', '나무', '구름', '달빛', '바람',
            '고양이', '강아지', '너구리', '토끼', '사슴', '참새', '부엉이',
            '돌고래', '다람쥐', '펭귄', '수달', '여우',
        ];
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const noun = nouns[Math.floor(Math.random() * nouns.length)];
        return `${adj} ${noun}`;
    };

    const [reviewForm, setReviewForm] = useState({
        rating: 0,
        content: '',
        nickname: generateRandomNickname(),
        password: '',
        photos: [] as string[],
    });
    const [isFavorited, setIsFavorited] = useState(false);
    const [showAllInquiries, setShowAllInquiries] = useState(false);
    const [totalInquiryCount, setTotalInquiryCount] = useState(0);

    // 상담 신청 모달 - URL 파라미터로 관리 + 뒤로가기 지원
    const searchParams = useSearchParams();
    const [consultModalOpenState, setConsultModalOpenState] = useState(false);
    const nameInputRef = useRef<HTMLInputElement>(null);

    // 상담 모달 열릴 때 이름 입력에 포커스
    useEffect(() => {
        if (consultModalOpenState && nameInputRef.current) {
            // Drawer 애니메이션 후 포커스
            setTimeout(() => {
                nameInputRef.current?.focus();
            }, 350);
        }
    }, [consultModalOpenState]);

    // URL에서 초기 상태 읽기 또는 prop에서 받은 초기 상태 사용
    useEffect(() => {
        if (initialConsultOpen) {
            setConsultModalOpenState(true);
        } else {
            // URL에서 consult=true가 있는지 확인
            setConsultModalOpenState(searchParams.get('consult') === 'true');
        }
    }, [searchParams, initialConsultOpen]);

    // popstate 이벤트 리스너 (뒤로가기 감지)
    useEffect(() => {
        const handlePopState = () => {
            const params = new URLSearchParams(window.location.search);
            setConsultModalOpenState(params.get('consult') === 'true');
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    const consultModalOpened = consultModalOpenState;

    const setConsultModalOpened = (open: boolean) => {
        const url = new URL(window.location.href);

        if (open) {
            url.searchParams.set('consult', 'true');
            // pushState로 히스토리 추가 → 뒤로가기 시 모달만 닫힘
            window.history.pushState({ modal: 'consult' }, '', url.toString());
            setConsultModalOpenState(true);
        } else {
            url.searchParams.delete('consult');
            // 닫을 때는 replaceState로 현재 히스토리만 업데이트
            window.history.replaceState({}, '', url.toString());
            setConsultModalOpenState(false);
        }
    };
    const [consultForm, setConsultForm] = useState({
        name: '',
        phone: '',
        preferredTime: '',
        question: 'price', // price, location, grave, other
        message: '',
        consultMethod: 'phone' // phone, visit, field
    });
    const [consultSubmitting, setConsultSubmitting] = useState(false);
    const [consultStep, setConsultStep] = useState(0); // 0: 1,2,3 열림, 4: 4번만 열림, 5: 5번만 열림
    const [consultSuccess, setConsultSuccess] = useState(false); // 신청 완료 상태
    const [submittedConsultData, setSubmittedConsultData] = useState<{
        name: string;
        phone: string;
        preferredTime: string;
        question: string;
        message: string;
        consultMethod: string;
    } | null>(null); // 성공 화면에 표시할 데이터

    // 전화번호 포맷팅 함수 (010-1234-5678 형식)
    const formatPhoneNumber = (value: string) => {
        // 숫자만 추출
        const numbers = value.replace(/[^0-9]/g, '');
        // 11자리 제한
        const limited = numbers.slice(0, 11);
        // 하이픈 자동 삽입
        if (limited.length <= 3) return limited;
        if (limited.length <= 7) return `${limited.slice(0, 3)}-${limited.slice(3)}`;
        return `${limited.slice(0, 3)}-${limited.slice(3, 7)}-${limited.slice(7)}`;
    };

    // 시설 선택 모달
    const [facilitySearchOpened, { open: openFacilitySearch, close: closeFacilitySearch }] = useDisclosure(false);
    const [facilitySearchQuery, setFacilitySearchQuery] = useState('');

    // 연락처 입력 모달 (등록 버튼 클릭 시)
    const [phoneModalOpened, { open: openPhoneModal, close: closePhoneModal }] = useDisclosure(false);

    // 문의 상세 보기 모달
    const [selectedInquiry, setSelectedInquiry] = useState<any>(null);
    const [inquiryDetailOpened, { open: openInquiryDetail, close: closeInquiryDetail }] = useDisclosure(false);
    const [inquiryPinInput, setInquiryPinInput] = useState('');
    const [inquiryUnlocked, setInquiryUnlocked] = useState(false);
    const [inquiryPinError, setInquiryPinError] = useState('');

    // 문의 클릭 핸들러
    const handleInquiryClick = (inquiry: any) => {
        setSelectedInquiry(inquiry);
        setInquiryPinInput('');
        setInquiryUnlocked(!inquiry.isPrivate); // 공개글은 바로 공개
        setInquiryPinError('');
        openInquiryDetail();
    };

    // 비밀번호 확인
    const handleInquiryUnlock = async () => {
        if (!selectedInquiry) return;
        try {
            const res = await fetch(`/api/facilities/${facility.id}/inquiries/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ inquiryId: selectedInquiry.id, pin: inquiryPinInput })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setInquiryUnlocked(true);
                setInquiryPinError('');
            } else {
                setInquiryPinError(data.error || '비밀번호가 일치하지 않습니다.');
            }
        } catch {
            setInquiryPinError('확인 중 오류가 발생했습니다.');
        }
    };

    // 문의 삭제
    const handleInquiryDelete = async () => {
        if (!selectedInquiry || !confirm('정말 삭제하시겠습니까?')) return;
        try {
            const res = await fetch(`/api/facilities/${facility.id}/inquiries`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ inquiryId: selectedInquiry.id, pin: inquiryPinInput })
            });
            if (res.ok) {
                setInquiries(prev => prev.filter(i => i.id !== selectedInquiry.id));
                closeInquiryDetail();
                alert('삭제되었습니다.');
            } else {
                const data = await res.json();
                alert(data.error || '삭제에 실패했습니다.');
            }
        } catch {
            alert('삭제 중 오류가 발생했습니다.');
        }
    };

    // 문의 종류 옵션
    const INQUIRY_TYPES = [
        { value: 'price', label: '가격 문의' },
        { value: 'location', label: '위치/교통' },
        { value: 'reservation', label: '예약/절차' },
        { value: 'facility', label: '시설 이용' },
        { value: 'other', label: '기타' },
    ];

    const phoneNumber = facility.phone || facility.operator?.contact || facility.description || '문의 필요';
    const hasPrice = (facility.priceRange?.max || 0) > 0;

    const handleSubmitInquiry = async () => {
        if (!inquiryForm.title.trim()) {
            alert('제목을 입력해주세요.');
            return;
        }
        if (!inquiryForm.content.trim()) {
            alert('문의 내용을 입력해주세요.');
            return;
        }
        if (!inquiryForm.phone.trim() || inquiryForm.phone.replace(/\D/g, '').length < 10) {
            alert('올바른 연락처를 입력해주세요.');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/facilities/${facility.id}/inquiries`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: inquiryForm.type || 'other',
                    title: inquiryForm.title,
                    content: inquiryForm.content,
                    phone: inquiryForm.phone,
                    isPrivate: inquiryForm.isPrivate
                })
            });
            const data = await res.json();

            if (res.ok && data.success) {
                // Add to inquiries list
                if (data.inquiry) {
                    setInquiries(prev => [data.inquiry, ...prev]);
                }
                // Reset form and close
                setInquiryForm({ type: '', facilityId: facility.id, facilityName: facility.name, title: '', content: '', phone: '', isPrivate: true, photos: [], privacyAgreed: true });
                closeReviewModal();
                alert('문의가 등록되었습니다!');
            } else {
                alert(data.error || '문의 등록에 실패했습니다.');
            }
        } catch (error) {
            console.error(error);
            alert('네트워크 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // 후기 등록
    const handleSubmitReview = async () => {
        if (!reviewForm.content.trim()) {
            alert('후기 내용을 입력해주세요.');
            return;
        }
        if (reviewForm.rating === 0) {
            alert('별점을 선택해주세요.');
            return;
        }
        if (!reviewForm.password.trim() || reviewForm.password.length < 4) {
            alert('비밀번호를 4자 이상 입력해주세요.');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/facilities/${facility.id}/review`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rating: reviewForm.rating,
                    content: reviewForm.content,
                    author: reviewForm.nickname.trim() || '익명',
                    password: reviewForm.password,
                    photos: reviewForm.photos,
                })
            });
            const data = await res.json();

            if (res.ok && data.success) {
                if (data.review) {
                    setReviews(prev => [data.review, ...prev]);
                    setReviewCount(prev => prev + 1);
                }
                setReviewForm({ rating: 0, content: '', nickname: generateRandomNickname(), password: '', photos: [] });
                closeReviewModal();
                alert('후기가 등록되었습니다!');
            } else {
                alert(data.error || '후기 등록에 실패했습니다.');
            }
        } catch (error) {
            console.error(error);
            alert('네트워크 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReviewPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        if (reviewForm.photos.length + files.length > 5) {
            alert('사진은 최대 5장까지 첨부할 수 있습니다.');
            return;
        }
        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setReviewForm(prev => ({
                    ...prev,
                    photos: [...prev.photos, reader.result as string]
                }));
            };
            reader.readAsDataURL(file);
        });
    };

    const removeReviewPhoto = (index: number) => {
        setReviewForm(prev => ({
            ...prev,
            photos: prev.photos.filter((_, i) => i !== index)
        }));
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        // Limit to 5 photos
        if (inquiryForm.photos.length + files.length > 5) {
            alert('사진은 최대 5장까지 첨부할 수 있습니다.');
            return;
        }

        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setInquiryForm(prev => ({
                    ...prev,
                    photos: [...prev.photos, reader.result as string]
                }));
            };
            reader.readAsDataURL(file);
        });
    };

    const removePhoto = (index: number) => {
        setInquiryForm(prev => ({
            ...prev,
            photos: prev.photos.filter((_, i) => i !== index)
        }));
    };

    const handleLike = async (reviewId: string) => {
        const isLiked = likedReviews.has(reviewId);
        const action = isLiked ? 'UNLIKE' : 'LIKE';

        // Optimistic UI Update first
        setLikedReviews(prev => {
            const next = new Set(prev);
            if (isLiked) next.delete(reviewId);
            else next.add(reviewId);
            return next;
        });

        setReviews(prev => prev.map(r => {
            if (r.id === reviewId) {
                return { ...r, likes: Math.max(0, (r.likes || 0) + (isLiked ? -1 : 1)) };
            }
            return r;
        }));

        try {
            const res = await fetch('/api/reviews/interact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ facilityId: facility.id, reviewId, action })
            });

            if (!res.ok) {
                // Revert on failure (optional, but good practice)
                console.error('Failed to toggle like');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleSubmitReply = async (reviewId: string) => {
        if (!replyContent.trim()) return;
        if (!replyNickname.trim()) {
            alert('닉네임을 입력해주세요.');
            return;
        }
        if (!replyPassword.trim()) {
            alert('비밀번호를 입력해주세요.');
            return;
        }

        try {
            const res = await fetch('/api/reviews/interact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    facilityId: facility.id,
                    reviewId,
                    action: 'REPLY',
                    content: replyContent,
                    photos: replyPhotos,
                    author: replyNickname,
                    password: replyPassword
                })
            });

            if (res.ok) {
                const data = await res.json();
                const newReply = {
                    id: data.reply?.id || `rep-${Date.now()}`,
                    author: replyNickname,
                    content: replyContent,
                    photos: replyPhotos,
                    createdAt: new Date().toISOString()
                };

                setReviews(prev => prev.map(r => {
                    if (r.id === reviewId) {
                        return { ...r, replies: [...(r.replies || []), newReply] };
                    }
                    return r;
                }));

                setReplyingTo(null);
                setReplyContent('');
                setReplyPhotos([]);
                setReplyNickname('');
                setReplyPassword('');
            } else {
                const errData = await res.json();
                alert(errData.error || '댓글 등록에 실패했습니다.');
            }
        } catch (error) {
            console.error(error);
        }
    };

    // 대댓글 이미지 업로드 핸들러
    const handleReplyPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (replyPhotos.length + files.length > 3) {
            alert('이미지는 최대 3장까지 첨부할 수 있습니다.');
            return;
        }
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = () => {
                setReplyPhotos(prev => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
        });
        e.target.value = '';
    };

    // 리뷰 삭제 (비밀번호 모달)
    const [deleteReviewModal, setDeleteReviewModal] = useState<string | null>(null);
    const [deleteReviewPassword, setDeleteReviewPassword] = useState('');
    const [deleteReviewError, setDeleteReviewError] = useState('');

    const openDeleteReviewModal = (reviewId: string) => {
        setDeleteReviewModal(reviewId);
        setDeleteReviewPassword('');
        setDeleteReviewError('');
    };

    const handleDeleteReview = async () => {
        if (!deleteReviewModal) return;
        if (!deleteReviewPassword.trim()) {
            setDeleteReviewError('비밀번호를 입력해주세요.');
            return;
        }
        try {
            const res = await fetch('/api/reviews/interact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    facilityId: facility.id,
                    reviewId: deleteReviewModal,
                    action: 'DELETE_REVIEW',
                    password: deleteReviewPassword
                })
            });
            if (res.ok) {
                setReviews(prev => prev.filter(r => r.id !== deleteReviewModal));
                setDeleteReviewModal(null);
                setDeleteReviewPassword('');
                setDeleteReviewError('');
            } else {
                const errData = await res.json();
                setDeleteReviewError(errData.error || '삭제에 실패했습니다.');
            }
        } catch (e) {
            console.error(e);
            setDeleteReviewError('오류가 발생했습니다.');
        }
    };

    // 대댓글 삭제 (비밀번호 모달 열기)
    const openDeleteReplyModal = (reviewId: string, replyId: string) => {
        setDeleteReplyModal({ reviewId, replyId });
        setDeleteReplyPassword('');
        setDeleteReplyError('');
    };

    const handleDeleteReply = async () => {
        if (!deleteReplyModal) return;
        if (!deleteReplyPassword.trim()) {
            setDeleteReplyError('비밀번호를 입력해주세요.');
            return;
        }
        try {
            const res = await fetch('/api/reviews/interact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    facilityId: facility.id,
                    reviewId: deleteReplyModal.reviewId,
                    replyId: deleteReplyModal.replyId,
                    action: 'DELETE_REPLY',
                    password: deleteReplyPassword
                })
            });
            if (res.ok) {
                setReviews(prev => prev.map(r => {
                    if (r.id === deleteReplyModal.reviewId) {
                        return { ...r, replies: r.replies?.filter(rep => rep.id !== deleteReplyModal.replyId) };
                    }
                    return r;
                }));
                setDeleteReplyModal(null);
            } else {
                const errData = await res.json();
                setDeleteReplyError(errData.error || '삭제에 실패했습니다.');
            }
        } catch (e) {
            console.error(e);
            setDeleteReplyError('삭제 중 오류가 발생했습니다.');
        }
    };

    // 🔥 랜덤 조회수 설정 제거됨 - API 호출로 대체 (line 341-354)

    // 갤러리 이미지 처리 (엄격한 필터링)
    // 🔥 실제 시설 사진만 표시 (thumbnail/로고 제외)
    // 🚀 imageGallery가 아직 없으면 thumbnail로 즉시 표시 (API 응답 전)
    const rawImages = (facility.imageGallery && facility.imageGallery.length > 0)
        ? facility.imageGallery
        : ((facility as any).thumbnail ? [(facility as any).thumbnail] : []);
    const galleryImages = rawImages
        .filter((img: string) => img && typeof img === 'string' && img.trim() !== '')
        .filter((img: string) => img.startsWith('http') || img.startsWith('blob:') || img.startsWith('data:'))
        .filter((img: string) => !img.includes('/logos/') && !img.includes('logo')); // 로고 이미지 제외

    const visibleImages = galleryImages.slice(0, 2);
    const extraInfoCount = galleryImages.length > 2 ? galleryImages.length - 2 : 0;

    // 이미지 클릭 핸들러
    const handleImageClick = (index: number) => {
        setSelectedImageIndex(index);
        setOpened(true);
    };

    // 🎹 키보드 이벤트 (ESC 닫기 + 좌우 화살표)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!opened) return;

            if (e.key === 'Escape') {
                setOpened(false);
            } else if (e.key === 'ArrowLeft') {
                setSelectedImageIndex(prev => prev > 0 ? prev - 1 : galleryImages.length - 1);
            } else if (e.key === 'ArrowRight') {
                setSelectedImageIndex(prev => prev < galleryImages.length - 1 ? prev + 1 : 0);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [opened, galleryImages.length]);

    // Schema.org JSON-LD 구조화된 데이터 생성
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Cemetery",
        "name": facility.name,
        "address": {
            "@type": "PostalAddress",
            "addressCountry": "KR",
            "addressRegion": facility.address?.split(' ')[0] || '',
            "addressLocality": facility.address?.split(' ')[1] || '',
            "streetAddress": facility.address || ''
        },
        "telephone": facility.phone || '',
        "priceRange": facility.priceRange?.min ? `${formatKoreanCurrency(facility.priceRange.min * 10000)}~` : '가격 문의',
        "aggregateRating": facility.rating && facility.reviewCount ? {
            "@type": "AggregateRating",
            "ratingValue": facility.rating,
            "reviewCount": facility.reviewCount
        } : undefined,
        "amenityFeature": [
            facility.hasParking && { "@type": "LocationFeatureSpecification", "name": "주차장", "value": true },
            facility.hasRestaurant && { "@type": "LocationFeatureSpecification", "name": "식당", "value": true },
            facility.hasStore && { "@type": "LocationFeatureSpecification", "name": "매점", "value": true },
            facility.hasAccessibility && { "@type": "LocationFeatureSpecification", "name": "장애인 편의시설", "value": true }
        ].filter(Boolean),
        "image": galleryImages[0] || '',
        "url": typeof window !== 'undefined' ? window.location.href : `https://daedaesonson.com/facility/${facility.id}`,
        "description": facility.description || `${facility.name} - ${FACILITY_CATEGORY_LABELS[facility.category] || '장례시설'} 정보`
    };



    return (
        <Box
            ref={containerRef}
            className="facility-detail-container"
            style={{ backgroundColor: '#302E92', height: '100%', position: 'relative', overflowY: 'auto', touchAction: 'pan-y', overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
            onTouchStart={(e) => e.stopPropagation()} // 🚀 지도 터치 간섭 방지 (재적용)
        >
            {/* Schema.org JSON-LD for SEO */}
            <Script
                id="facility-jsonld"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            {/* 1. 헤더 + 액션바 고정 컨테이너 */}
            <div style={{ position: 'sticky', top: 0, zIndex: 1000 }}>
                {/* 1-1. 헤더 (← 민간/공설 시설명 + 📍 + 공유) */}
                <Box bg="brand.8" px="md" py={10}>
                    <Group justify="space-between" align="center" wrap="nowrap">
                        <Group gap={4} wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                            <ActionIcon variant="transparent" color="white" w={32} h={32} onClick={onClose} style={{ flexShrink: 0 }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '22px', fontVariationSettings: "'FILL' 1" }}>arrow_back_ios_new</span>
                            </ActionIcon>
                            <Group gap={6} wrap="nowrap" style={{ overflow: 'hidden' }}>
                                <Badge
                                    size="sm" radius="sm" variant="light"
                                    style={{
                                        textTransform: 'none',
                                        color: 'white',
                                        backgroundColor: 'rgba(255,255,255,0.2)',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        height: '22px',
                                        border: '1px solid rgba(255,255,255,0.3)',
                                        padding: '0 6px',
                                        flexShrink: 0
                                    }}
                                >
                                    {facility.isPublic ? '공설' : '민간'}
                                </Badge>
                                <Text size="md" fw={600} c="white" truncate style={{ fontSize: '16px' }}>
                                    {facility.name}
                                </Text>
                            </Group>
                        </Group>
                        <Group gap={0} style={{ flexShrink: 0 }}>
                            {!isDesktop && (
                                <ActionIcon
                                    variant="transparent"
                                    color="white"
                                    w={36}
                                    h={36}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        if ((window as any).gtag) {
                                            (window as any).gtag('event', 'map_navigate', {
                                                facility_id: facility.id,
                                                facility_name: facility.name
                                            });
                                        }
                                        if (onMapView && facility.coordinates) {
                                            onMapView(facility.coordinates.lat, facility.coordinates.lng);
                                        } else {
                                            onClose();
                                        }
                                    }}
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>location_on</span>
                                </ActionIcon>
                            )}
                            <ActionIcon
                                variant="transparent"
                                color="white"
                                w={36}
                                h={36}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    navigator.clipboard.writeText(`https://daedaesonson.com/facility/${facility.id}`);
                                    if ((window as any).gtag) {
                                        (window as any).gtag('event', 'share_click', {
                                            facility_id: facility.id,
                                            facility_name: facility.name
                                        });
                                    }
                                }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>share</span>
                            </ActionIcon>
                            {isDesktop && (
                                <ActionIcon
                                    variant="transparent"
                                    color="white"
                                    w={36}
                                    h={36}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        onClose();
                                    }}
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>close</span>
                                </ActionIcon>
                            )}
                        </Group>
                    </Group>
                </Box>

                {/* 2. 액션바 3등분 (직접전화 / ♡ / 이야기) */}
                <Box bg="brand.8" px={0} style={{
                    borderTop: '1px solid rgba(255,255,255,0.12)',
                    borderBottom: '1px solid rgba(255,255,255,0.12)',
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'stretch',
                        justifyContent: 'space-around',
                        width: '100%',
                    }}>
                        <div
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: '10px 12px', flex: 1, justifyContent: 'center' }}
                            onClick={() => {
                                if (facility.phone) {
                                    window.location.href = `tel:${facility.phone}`;
                                }
                            }}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'white', fontVariationSettings: "'FILL' 1" }}>call</span>
                            <span style={{ fontSize: '16px', color: 'white', fontWeight: 500 }}>직접전화</span>
                        </div>

                        <div style={{ width: '1px', backgroundColor: 'rgba(255,255,255,0.12)', alignSelf: 'stretch' }} />

                        <div
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: '10px 12px', flex: 1, justifyContent: 'center' }}
                            onClick={() => {
                                setIsFavorited(prev => !prev);
                            }}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: isFavorited ? '#ff6b6b' : 'white', fontVariationSettings: isFavorited ? "'FILL' 1" : "'FILL' 0", transition: 'all 0.2s ease' }}>favorite</span>
                            <span style={{ fontSize: '16px', color: isFavorited ? '#ff6b6b' : 'white', fontWeight: 500, transition: 'color 0.2s ease' }}>{isFavorited ? 1 : 0}</span>
                        </div>

                        <div style={{ width: '1px', backgroundColor: 'rgba(255,255,255,0.12)', alignSelf: 'stretch' }} />

                        <div
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: '10px 12px', flex: 1, justifyContent: 'center' }}
                            onClick={() => {
                                if (isDesktop) {
                                    setReviewsOpen(!reviewsOpen);
                                } else {
                                    router.push(`/facility/${facility.id}/reviews`);
                                }
                            }}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'white', fontVariationSettings: "'FILL' 1" }}>chat_bubble</span>
                            <span style={{ fontSize: '16px', color: 'white', fontWeight: 500 }}>이야기</span>
                        </div>
                    </div>
                </Box>
            </div> {/* sticky 컨테이너 닫기 */}

            {/* 3. 정보 요약 */}
            <Box bg="white">
                {/* 태그 + 방문자 통계 */}
                <Box
                    py="sm" px="md"
                    style={{ borderBottom: '8px solid #f8f9fa', boxShadow: 'inset 0 -1px 0 #e9ecef' }}
                >
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        gap: '8px'
                    }}>
                        {/* 태그 그룹 - 카테고리만 (복수 카테고리 지원) */}
                        <div style={{
                            display: 'flex',
                            gap: '6px',
                            overflowX: 'auto',
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none',
                            whiteSpace: 'nowrap',
                            alignItems: 'center'
                        }}>
                            {(facility.categories && facility.categories.length > 0
                                ? facility.categories
                                : [facility.category]
                            ).map((cat) => (
                                <Badge
                                    key={cat}
                                    size="md" radius="md" variant="light"
                                    style={{
                                        textTransform: 'none',
                                        color: '#495057',
                                        backgroundColor: '#f1f3f5',
                                        fontSize: '13px',
                                        fontWeight: 500,
                                        height: '28px',
                                        border: 'none',
                                        padding: '0 10px',
                                        flexShrink: 0
                                    }}
                                >
                                    {FACILITY_CATEGORY_LABELS[cat]}
                                </Badge>
                            ))}
                        </div>

                        {/* 방문자 통계 */}
                        <Text
                            key={`viewcount-${facility.id}`}
                            size="xs"
                            c="gray.6"
                            style={{
                                whiteSpace: 'nowrap',
                                flexShrink: 0,
                                animation: 'slideUpFade 0.5s ease-out',
                                fontSize: '12px',
                            }}
                        >
                            최근 {viewCount}명이 {FACILITY_CATEGORY_LABELS[facility.category]} 찾아봤어요
                        </Text>
                        <style jsx>{`
                            @keyframes slideUpFade {
                                from {
                                    opacity: 0;
                                    transform: translateY(10px);
                                }
                                to {
                                    opacity: 1;
                                    transform: translateY(0);
                                }
                            }
                        `}</style>
                    </div>
                </Box>
            </Box>



            {/* 가격 정보 섹션 (별도 카드 분리) */}
            {(() => {
                // 🔥 priceTable이 아직 로드되지 않은 경우 (SSR 초기 데이터)
                // → representativePrice로 간단히 표시 (API 로드 후 상세 표시로 전환)
                const priceTable = facility.priceInfo?.priceTable || facility.pricing;

                if (!priceTable) {
                    // priceTable 로드 전에는 가격 섹션 숨김 (flash 방지)
                    return null;
                }

                // [Price Logic] priceTable이 있는 경우 - 상세 표시
                let displayPriceNum = 0;
                let isRep = false;

                // Collection for sub-items (Label, Price in Won)
                const subRepItems: { label: string; price: number }[] = [];

                // 대표 메뉴 3가지로 그룹핑
                const menuGroups: Record<string, number[]> = {
                    '봉안당': [],
                    '매장묘지': [],
                    '수목장': [],
                };
                const menuKeywords: Record<string, string[]> = {
                    '봉안당': ['봉안', '납골', '안치'],
                    '매장묘지': ['매장', '평장', '단장', '합장', '쌍분', '묘지', '묘원', '분양'],
                    '수목장': ['수목', '자연', '잔디', '화초', '암석'],
                };
                // 대표 메뉴 그룹에서 제외할 키 (부가시설)
                const excludeKeys = ['봉안벽'];

                if (priceTable) {
                    // 1. Collect representative items AND fallback min prices
                    Object.keys(priceTable).forEach(key => {
                        const cat = priceTable[key];
                        // Skip non-main categories
                        if (/옵션|관리비|기타|공통|제외|석물|비고|안내|별도/.test(key)) return;

                        if (cat && Array.isArray(cat.rows)) {
                            const rep = cat.rows.find((r: any) => r.isRepresentative);
                            if (rep) {
                                let priceVal = Number(rep.price);
                                if (isNaN(priceVal) || priceVal <= 0) return;

                                const val = priceVal < 10000 ? priceVal * 10000 : priceVal;

                                // 대표 메뉴에 매핑 (부가시설 키는 제외)
                                let matched = false;
                                if (!excludeKeys.includes(key)) {
                                    for (const [menu, keywords] of Object.entries(menuKeywords)) {
                                        if (keywords.some(kw => key.includes(kw))) {
                                            menuGroups[menu].push(val);
                                            matched = true;
                                            break;
                                        }
                                    }
                                }
                                // 매핑 안 된 항목도 subRepItems에 보관 (fallback)
                                subRepItems.push({ label: key, price: val });
                            } else {
                                // 🔥 ★ 없는 카테고리 → 최저가를 자동으로 메뉴그룹에 추가
                                const validPrices = cat.rows
                                    .map((r: any) => Number(r.price))
                                    .filter((p: number) => !isNaN(p) && p > 0);
                                if (validPrices.length > 0) {
                                    const minPrice = Math.min(...validPrices);
                                    const val = minPrice < 10000 ? minPrice * 10000 : minPrice;
                                    if (!excludeKeys.includes(key)) {
                                        for (const [menu, keywords] of Object.entries(menuKeywords)) {
                                            if (keywords.some(kw => key.includes(kw))) {
                                                menuGroups[menu].push(val);
                                                break;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    });

                    // 2. Pick Main Display Price (Preferred Category matching)
                    let preferredKeywords: string[] = [];
                    if (facility.category === 'FAMILY_GRAVE') preferredKeywords = ['매장', '묘지', '분양'];
                    else if (facility.category === 'CHARNEL_HOUSE') preferredKeywords = ['봉안', '납골', '안치'];
                    else if (facility.category === 'NATURAL_BURIAL') preferredKeywords = ['수목', '자연', '잔디', '화초'];

                    // Find first item that matches ANY of the keywords
                    const mainItem = subRepItems.find(i =>
                        preferredKeywords.some(k => i.label.includes(k))
                    ) || subRepItems[0];

                    if (mainItem) {
                        displayPriceNum = mainItem.price / 10000;
                        isRep = true;
                    }
                }

                // Fallback: priceTable이 아예 없는 레거시 시설만 priceRange.min 사용
                // 🔥 priceTable이 있으면 폴백 안 함 (stale minPrice 방지)
                if (displayPriceNum === 0 && !priceTable) {
                    displayPriceNum = facility.priceRange?.min ? Math.round(facility.priceRange.min / 10000) : 0;
                }

                // Fallback attempt with legacy representativePricing if not found in pricing
                if (!isRep && facility.representativePricing) {
                    // (Legacy logic omitted for brevity, keeping existing flow if pricing empty)
                }

                // 대표 메뉴 항목 계산
                const menuItems: { label: string; price: number }[] = [];
                for (const [menu, prices] of Object.entries(menuGroups)) {
                    if (prices.length > 0) {
                        menuItems.push({ label: menu, price: Math.min(...prices) });
                    }
                }
                const displayItems = menuItems.length > 0 ? menuItems : subRepItems;

                if (displayItems.length > 0) {
                    return (
                        <Box p="md" style={{
                            borderBottom: '8px solid #f8f9fa',
                            boxShadow: 'inset 0 -1px 0 #e9ecef',
                            background: 'white',
                        }}>
                            <Text size="xs" c="gray.5" mb={10} fw={500} style={{ fontSize: '12px' }}>예상 이용 비용</Text>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {displayItems.map((item, idx) => (
                                    <div key={idx} style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                                        <Text style={{ fontSize: '16px', fontWeight: 700, color: '#212529' }}>
                                            {item.label}
                                        </Text>
                                        <Text style={{ fontSize: '16px', fontWeight: 500, color: 'var(--mantine-color-brand-7)', letterSpacing: '-0.3px' }}>
                                            {formatKoreanCurrency(item.price)}~
                                        </Text>
                                    </div>
                                ))}
                            </div>
                            <Text size="xs" c="gray.6" mt={10} style={{ fontSize: '11px' }}>
                                ※ 실제 비용은 선택 옵션에 따라 달라질 수 있습니다.
                            </Text>
                        </Box>
                    );
                } else if (displayPriceNum > 0) {
                    // ★ 대표항목이 없는 경우 - 카테고리 라벨 + fallback 가격
                    const categoryLabel: Record<string, string> = {
                        'FAMILY_GRAVE': '매장묘지',
                        'CHARNEL_HOUSE': '봉안당',
                        'NATURAL_BURIAL': '수목장',
                    };
                    const fallbackLabel = categoryLabel[facility.category] || '';

                    return (
                        <Box p="md" style={{
                            borderBottom: '8px solid #f8f9fa',
                            boxShadow: 'inset 0 -1px 0 #e9ecef',
                            background: 'white',
                        }}>
                            <Text size="xs" c="gray.5" mb={10} fw={500} style={{ fontSize: '12px' }}>예상 이용 비용</Text>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                                {fallbackLabel && (
                                    <Text style={{ fontSize: '16px', fontWeight: 700, color: '#212529' }}>
                                        {fallbackLabel}
                                    </Text>
                                )}
                                <Text style={{ fontSize: '16px', fontWeight: 500, color: 'var(--mantine-color-brand-7)', letterSpacing: '-0.3px' }}>
                                    {formatKoreanCurrency(displayPriceNum * 10000)}~
                                </Text>
                            </div>
                            <Text size="xs" c="gray.6" mt={8} style={{ fontSize: '11px' }}>
                                ※ 실제 비용은 선택 옵션에 따라 달라질 수 있습니다.
                            </Text>
                        </Box>
                    );
                } else {
                    return (
                        <Box p="md" style={{
                            borderBottom: '8px solid #f8f9fa',
                            boxShadow: 'inset 0 -1px 0 #e9ecef',
                            background: 'white',
                        }}>
                            <Text size="xs" c="gray.5" mb={10} fw={500} style={{ fontSize: '12px' }}>예상 이용 비용</Text>
                            <Text style={{
                                fontSize: '20px',
                                fontWeight: 800,
                                color: 'var(--mantine-color-brand-8)',
                                lineHeight: 1,
                                letterSpacing: '-0.5px',
                            }}>
                                가격문의
                            </Text>
                            <Text size="xs" c="gray.6" mt={8} style={{ fontSize: '11px' }}>
                                시설에 직접 문의하여 정확한 비용을 확인하세요.
                            </Text>
                        </Box>
                    );
                }
            })()}

            {/* 4. 핵심 지표 (Highlight) */}
            {
                facility.highlight && (
                    <Box bg="white" p="md" style={{ borderBottom: '8px solid #f8f9fa', boxShadow: 'inset 0 -1px 0 #e9ecef' }}>
                        <Group gap="xs" mb="sm">
                            <TrendingUp size={16} color="var(--mantine-color-brand-6)" />
                            <Text size="sm" fw={700} c="brand.8">핵심 지표</Text>
                        </Group>
                        <Group gap="md">
                            {facility.highlight.price && (
                                <Box>
                                    <Text size="xs" c="dimmed">가격</Text>
                                    <Text size="sm" fw={600} c="brand.7">{facility.highlight.price}</Text>
                                </Box>
                            )}
                            {facility.highlight.accessibility && (
                                <Box>
                                    <Text size="xs" c="dimmed">접근성</Text>
                                    <Text size="sm" fw={600}>{facility.highlight.accessibility}</Text>
                                </Box>
                            )}
                            {facility.highlight.environment && (
                                <Box>
                                    <Text size="xs" c="dimmed">자연환경</Text>
                                    <Text size="sm" fw={600}>{facility.highlight.environment}</Text>
                                </Box>
                            )}
                        </Group>
                    </Box>
                )
            }

            {/* 5. 시설 정보 카드 */}
            <Box bg="white" p="md" style={{ borderBottom: '8px solid #f8f9fa', boxShadow: 'inset 0 -1px 0 #e9ecef' }}>
                <Text size="sm" fw={700} mb="md">시설 정보</Text>
                <Group gap="lg" grow>
                    <Box ta="center">
                        <Box style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: facility.hasParking ? 'var(--mantine-color-brand-0)' : '#f1f3f5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                            <Car size={24} color={facility.hasParking ? 'var(--mantine-color-brand-6)' : '#adb5bd'} />
                        </Box>
                        <Text size="xs" fw={facility.hasParking ? 600 : 400} c={facility.hasParking ? 'dark' : 'dimmed'}>주차장</Text>
                    </Box>

                    <Box ta="center">
                        <Box style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: facility.hasRestaurant ? 'var(--mantine-color-brand-0)' : '#f1f3f5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                            <Utensils size={24} color={facility.hasRestaurant ? 'var(--mantine-color-brand-6)' : '#adb5bd'} />
                        </Box>
                        <Text size="xs" fw={facility.hasRestaurant ? 600 : 400} c={facility.hasRestaurant ? 'dark' : 'dimmed'}>식당</Text>
                    </Box>

                    <Box ta="center">
                        <Box style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: facility.hasAccessibility ? 'var(--mantine-color-brand-0)' : '#f1f3f5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                            <Accessibility size={24} color={facility.hasAccessibility ? 'var(--mantine-color-brand-6)' : '#adb5bd'} />
                        </Box>
                        <Text size="xs" fw={facility.hasAccessibility ? 600 : 400} c={facility.hasAccessibility ? 'dark' : 'dimmed'}>편의시설</Text>
                    </Box>

                    <Box ta="center">
                        <Box style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: facility.hasStore ? 'var(--mantine-color-brand-0)' : '#f1f3f5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                            <Store size={24} color={facility.hasStore ? 'var(--mantine-color-brand-6)' : '#adb5bd'} />
                        </Box>
                        <Text size="xs" fw={facility.hasStore ? 600 : 400} c={facility.hasStore ? 'dark' : 'dimmed'}>매점</Text>
                    </Box>


                </Group>
            </Box>

            {/* 6. 사진 갤러리 (수정됨: 2개 노출 + 오버레이 + 클릭 시 팝업) */}
            {galleryImages.length > 0 && (
                <Box bg="white" p="md" style={{ borderBottom: '8px solid #f8f9fa', boxShadow: 'inset 0 -1px 0 #e9ecef' }}>
                    <Text size="sm" fw={700} mb="md">시설 사진</Text>
                    <Box style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                        {visibleImages.map((img, idx) => {
                            const isLastAndMore = idx === 1 && extraInfoCount > 0;
                            return (
                                <Box
                                    key={idx}
                                    onClick={() => handleImageClick(idx)}
                                    style={{ position: 'relative', paddingBottom: '100%', borderRadius: 8, overflow: 'hidden', cursor: 'pointer' }}
                                >
                                    <NextImage
                                        src={getSingleFacilityImageUrl(img)}
                                        alt={`${facility.name} ${idx + 1}`}
                                        fill
                                        sizes="50vw"
                                        style={{ objectFit: 'cover' }}
                                        priority={idx === 0}
                                        loading={idx === 0 ? undefined : 'lazy'}
                                    />
                                    {/* 오버레이 (+7) */}
                                    {isLastAndMore && (
                                        <Box
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                width: '100%',
                                                height: '100%',
                                                backgroundColor: 'rgba(0,0,0,0.3)', // 요청사항: 오버레이 30%
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white',
                                                fontSize: '24px',
                                                fontWeight: 700
                                            }}
                                        >
                                            +{extraInfoCount}
                                        </Box>
                                    )}
                                </Box>
                            );
                        })}
                    </Box>
                </Box>
            )}

            {/* 7. 시설 소개 */}
            {
                facility.description && facility.description !== phoneNumber && (
                    <Box bg="white" p="md" style={{ borderBottom: '8px solid #f8f9fa', boxShadow: 'inset 0 -1px 0 #e9ecef' }}>
                        <Text size="sm" fw={700} mb="sm">시설 소개</Text>
                        <Text size="sm" lh={1.6} c="dark.7">{facility.description}</Text>
                    </Box>
                )
            }

            {/* 8. 가격 정보 (상세) - 리팩토링된 컴포넌트 사용 */}
            <PriceInfoSection priceInfo={facility.priceInfo} hasPrice={hasPrice} />




            {/* 9. 위치 및 교통 (홈페이지 바로가기 버튼 추가됨) */}
            <Box bg="white" p="md" style={{ borderBottom: '8px solid #f8f9fa', boxShadow: 'inset 0 -1px 0 #e9ecef' }}>
                <Text size="sm" fw={700} mb="sm">위치</Text>
                <Text size="sm" mb="md" c="dark.7">{facility.address}</Text>

                <Group grow>
                    {facility.websiteUrl && (
                        <Button
                            variant="outline"
                            color="gray"
                            size="sm"
                            component="a"
                            href={facility.websiteUrl}
                            target="_blank"
                            leftSection={<Globe size={16} />}
                        >
                            홈페이지
                        </Button>
                    )}
                </Group>
            </Box>

            {/* 시설 정보 */}
            <Box bg="white" p="md" style={{ borderBottom: '8px solid #f8f9fa', boxShadow: 'inset 0 -1px 0 #e9ecef' }}>
                <Text size="sm" fw={700} mb="md">시설 정보</Text>
                <Stack gap="sm">
                    <Group justify="space-between">
                        <Text size="sm" c="gray.6">운영형태</Text>
                        <Text size="sm" fw={500} c="dark.9">
                            {facility.isPublic ? '공설' : '사설'}
                        </Text>
                    </Group>
                    <Group justify="space-between">
                        <Text size="sm" c="gray.6">시설종류</Text>
                        <Text size="sm" fw={500} c="dark.9">
                            {facility.category ? FACILITY_CATEGORY_LABELS[facility.category] || facility.category : '정보 없음'}
                        </Text>
                    </Group>

                    {/* 총매장능력 (값이 0보다 클 때만 노출) */}
                    {Number(facility.capacity) > 0 && (
                        <Group justify="space-between">
                            <Text size="sm" c="gray.6">총매장능력</Text>
                            <Text size="sm" fw={500} c="dark.9">
                                {Number(facility.capacity).toLocaleString()}기
                            </Text>
                        </Group>
                    )}

                    {/* 업데이트 날짜 - 숨김 처리
                    <Group justify="space-between">
                        <Text size="sm" c="gray.6">업데이트</Text>
                        <Text size="sm" fw={500} c="dark.9">
                            {formatRelativeTime(facility.lastUpdated)}
                        </Text>
                    </Group>
                    */}
                </Stack>

                {/* 상세 상담 받기 버튼 */}
                <Box
                    mt="lg"
                    py={12}
                    style={{
                        backgroundColor: '#f8f9fa',
                        borderRadius: 8,
                        cursor: 'pointer',
                        textAlign: 'center',
                    }}
                    onClick={() => setConsultModalOpened(true)}
                >
                    <Text style={{ fontSize: 15 }} fw={600} c="brand.6">이 시설에 대해 더 자세히 알아보기</Text>
                </Box>
            </Box>

            {/* 이야기 (리뷰) */}
            <Box id="reviews-section" bg="white" p="md" style={{ borderBottom: '8px solid #f8f9fa', boxShadow: 'inset 0 -1px 0 #e9ecef' }}>
                <Text size="lg" fw={700} mb="md">이야기</Text>

                {/* 후기 작성 입력 */}
                <Paper
                    withBorder radius="md" p="md" mb="lg"
                    onClick={() => reviewModalOpened ? closeReviewModal() : openReviewModal()}
                    style={{ cursor: 'pointer', borderColor: '#e9ecef', backgroundColor: '#f8f9fa' }}
                >
                    <Group justify="space-between">
                        <Text c="gray.5" size="sm">
                            솔직한 후기를 남겨주세요.
                        </Text>
                        <Group gap={12}>
                            <Camera size={20} color="#1D0098" />
                            <Pencil size={20} color="#1D0098" />
                        </Group>
                    </Group>
                </Paper>

                {/* 리뷰 목록 */}
                <Stack gap="md">
                    {reviews.length > 0 ? (
                        (showAllReviews ? reviews : reviews.slice(0, 3)).map((review) => (
                            <Box key={review.id} style={{ borderBottom: '1px solid #f1f3f5' }} pb="md">
                                <Group justify="space-between" mb={4}>
                                    <Group gap="xs">
                                        <Box w={24} h={24} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#adb5bd' }}>account_circle</span>
                                        </Box>
                                        <Text size="sm" fw={600} c="dark.8">{review.author}</Text>
                                        <Text size="xs" c="dimmed">· {formatRelativeTime(review.createdAt || review.date)}</Text>
                                    </Group>
                                    <ActionIcon variant="transparent" color="gray" size="sm" onClick={() => openDeleteReviewModal(review.id)}>
                                        <Trash size={14} />
                                    </ActionIcon>
                                </Group>
                                <Text size="md" mb="xs" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5, color: '#343a40' }}>
                                    {review.content}
                                </Text>
                                {/* Review Photos - 클릭 시 확대 */}
                                {review.photos && review.photos.length > 0 && (
                                    <Group gap="xs" mb="sm">
                                        {review.photos.map((photo, idx) => (
                                            <Box key={idx} style={{ cursor: 'pointer' }} onClick={() => openImageViewer(review.photos, idx)}>
                                                <Image src={photo} w={100} h={100} radius="md" style={{ objectFit: 'cover', border: '1px solid #f1f3f5' }} />
                                            </Box>
                                        ))}
                                    </Group>
                                )}

                                <Group gap="lg">
                                    <Group gap={4} style={{ cursor: 'pointer' }} onClick={() => handleLike(review.id)}>
                                        <span
                                            className="material-symbols-outlined"
                                            style={{
                                                fontSize: '18px',
                                                color: likedReviews.has(review.id) ? '#fa5252' : '#adb5bd',
                                                fontVariationSettings: likedReviews.has(review.id) ? "'FILL' 1" : "'FILL' 0"
                                            }}
                                        >
                                            favorite
                                        </span>
                                        <Text size="xs" c={likedReviews.has(review.id) ? 'red.6' : 'dimmed'} fw={likedReviews.has(review.id) ? 600 : 400}>
                                            좋아요 {review.likes || 0}
                                        </Text>
                                    </Group>
                                    <Group gap={4} style={{ cursor: 'pointer' }} onClick={() => {
                                        setReplyingTo(replyingTo === review.id ? null : review.id);
                                        setReplyContent('');
                                        setReplyPhotos([]);
                                        setReplyNickname('');
                                        setReplyPassword('');
                                    }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#adb5bd' }}>chat_bubble</span>
                                        <Text size="xs" c="dimmed">답글달기 {review.replies?.length > 0 ? review.replies.length : ''}</Text>
                                    </Group>
                                </Group>



                                {/* Reply List - 3개까지만 표시 + 더보기 */}
                                {review.replies && review.replies.length > 0 && (
                                    <Box mt="md" bg="gray.0" p="sm" style={{ borderRadius: 'var(--mantine-radius-md)' }}>
                                        {(expandedReplies.has(review.id) ? review.replies : review.replies.slice(0, 3)).map((reply: any) => (
                                            <Box key={reply.id} mb="sm" pb="sm" style={{ borderBottom: '1px solid #f1f3f5' }}>
                                                <Group gap="xs" mb={4}>
                                                    <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#adb5bd' }}>account_circle</span>
                                                    <Text size="sm" fw={700} c="dark.8">{reply.author}</Text>
                                                    <Text size="xs" c="dimmed">· {formatRelativeTime(reply.createdAt || reply.date)}</Text>
                                                    <ActionIcon variant="transparent" color="gray" size="xs" onClick={() => openDeleteReplyModal(review.id, reply.id)} ml="auto">
                                                        <X size={12} />
                                                    </ActionIcon>
                                                </Group>
                                                <Text size="sm" c="dark.7" ml={26}>{reply.content}</Text>
                                                {/* 대댓글 이미지 - 클릭 시 확대 */}
                                                {reply.photos && reply.photos.length > 0 && (
                                                    <Group gap={6} mt="xs" ml={26}>
                                                        {reply.photos.map((photo: string, idx: number) => (
                                                            <Box key={idx} style={{ cursor: 'pointer' }} onClick={() => openImageViewer(reply.photos, idx)}>
                                                                <img src={photo} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: '8px', border: '1px solid #dee2e6' }} />
                                                            </Box>
                                                        ))}
                                                    </Group>
                                                )}
                                            </Box>
                                        ))}
                                        {/* 3개 이상이면 더보기/접기 */}
                                        {review.replies.length > 3 && (
                                            <Box ta="center" pt="xs">
                                                <Button
                                                    variant="subtle"
                                                    color="gray"
                                                    size="xs"
                                                    onClick={() => {
                                                        setExpandedReplies(prev => {
                                                            const next = new Set(prev);
                                                            if (next.has(review.id)) {
                                                                next.delete(review.id);
                                                            } else {
                                                                next.add(review.id);
                                                            }
                                                            return next;
                                                        });
                                                    }}
                                                    styles={{ root: { color: '#868e96', fontWeight: 600 } }}
                                                >
                                                    {expandedReplies.has(review.id)
                                                        ? '댓글 접기'
                                                        : `댓글 더보기 (${review.replies.length - 3}개)`
                                                    }
                                                </Button>
                                            </Box>
                                        )}
                                    </Box>
                                )}
                            </Box>
                        ))
                    ) : (
                        <Box ta="center" py="xl">
                            <Text size="sm" c="dimmed">
                                최근 {viewCount}명이 조회했어요.<br />
                                방문 경험을 나눠주시면 많은 분들께 도움이 됩니다!
                            </Text>
                        </Box>
                    )}
                    {/* 리뷰 3개 이상이면 더보기/접기 */}
                    {reviews.length > 3 && (
                        <Box
                            mt="md"
                            py={12}
                            style={{
                                backgroundColor: '#f8f9fa',
                                borderRadius: 8,
                                cursor: 'pointer',
                                textAlign: 'center',
                            }}
                            onClick={() => {
                                if (isDesktop) {
                                    setReviewsOpen(!reviewsOpen);
                                } else {
                                    router.push(`/facility/${facility.id}/reviews`);
                                }
                            }}
                        >
                            <Text style={{ fontSize: 15 }} fw={500} c="dimmed">
                                총 {reviews.length - 3}개의 이야기가 더있습니다
                            </Text>
                        </Box>
                    )}
                </Stack>

                {/* 문의하기 버튼 */}
                <Box
                    mt="lg"
                    py={12}
                    style={{
                        backgroundColor: '#f8f9fa',
                        borderRadius: 8,
                        cursor: 'pointer',
                        textAlign: 'center',
                    }}
                    onClick={() => {
                        setInquiryOpen(!inquiryOpen);
                        if ((window as any).gtag) {
                            (window as any).gtag('event', 'inquiry_open', {
                                facility_id: facility.id,
                                facility_name: facility.name
                            });
                        }
                    }}
                >
                    <Text style={{ fontSize: 15 }} fw={500} c="dimmed">
                        {totalInquiryCount > 0 ? `총 ${totalInquiryCount}번의 문의를 했어요` : '문의하기'}
                    </Text>
                </Box>
            </Box>

            {/* 주변 시설 추천 */}
            {allFacilities.length > 0 && (() => {
                // 같은 지역(주소 앞 2단어) + 같은 카테고리 필터
                const region = facility.address?.split(' ').slice(0, 2).join(' ') || '';
                const similarFacilities = allFacilities
                    .filter(f =>
                        f.id !== facility.id &&
                        f.category === facility.category &&
                        f.address?.startsWith(region)
                    )
                    .slice(0, 3);

                // 같은 지역 없으면 같은 카테고리만
                const recommendations = similarFacilities.length > 0
                    ? similarFacilities
                    : allFacilities
                        .filter(f => f.id !== facility.id && f.category === facility.category)
                        .slice(0, 3);

                if (recommendations.length === 0) return null;

                return (
                    <Box bg="white" p="md" style={{ borderBottom: '8px solid #f8f9fa', boxShadow: 'inset 0 -1px 0 #e9ecef' }}>
                        <Text size="sm" fw={700} mb="md">주변 시설</Text>
                        <Stack gap="xs">
                            {recommendations.map(rec => {
                                // 🔥 썸네일 우선순위: thumbnail > imageGallery[0] > 로고
                                const recAny = rec as any;
                                const hasImage = recAny.thumbnail || rec.imageGallery?.[0];
                                const thumbUrl = recAny.thumbnail
                                    ? recAny.thumbnail
                                    : rec.imageGallery?.[0]
                                        ? getSingleFacilityImageUrl(rec.imageGallery[0])
                                        : '/logo-horizontal.svg';
                                return (
                                    <Box
                                        key={rec.id}
                                        p="sm"
                                        bg="gray.0"
                                        style={{ borderRadius: 8, cursor: 'pointer' }}
                                        onClick={() => {
                                            onSelectFacility?.(rec.id);
                                            // 🔥 상세 페이지 맨 위로 스크롤
                                            window.scrollTo({ top: 0, behavior: 'instant' });
                                        }}
                                    >
                                        <Group wrap="nowrap" gap="sm">
                                            <Box
                                                style={{
                                                    width: 48,
                                                    height: 48,
                                                    borderRadius: 6,
                                                    overflow: 'hidden',
                                                    flexShrink: 0,
                                                    backgroundColor: '#f1f3f5',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <img
                                                    src={thumbUrl}
                                                    alt={rec.name}
                                                    loading="lazy"
                                                    style={{
                                                        width: hasImage ? '100%' : 32,
                                                        height: hasImage ? '100%' : 16,
                                                        objectFit: 'cover',
                                                        opacity: hasImage ? 1 : 0.3,
                                                    }}
                                                />
                                            </Box>
                                            <Box style={{ flex: 1, minWidth: 0 }}>
                                                <Text size="sm" fw={600} lineClamp={1}>{rec.name}</Text>
                                                <Text size="xs" c="dimmed">{rec.address?.split(' ').slice(0, 2).join(' ')}</Text>
                                            </Box>
                                            {rec.priceRange?.min && rec.priceRange.min > 0 && (
                                                <Text size="sm" fw={600} c="dark.6" style={{ flexShrink: 0 }}>
                                                    {formatKoreanCurrency(rec.priceRange.min)}부터
                                                </Text>
                                            )}
                                        </Group>
                                    </Box>
                                );
                            })}
                        </Stack>
                    </Box>
                );
            })()}


            {/* 🔵 하단 공유 & 정보수정 섹션 */}
            <Box px="md" pt={10} pb={30} style={{
                background: '#302E92',
                textAlign: 'center',
            }}>
                {/* 공유 안내 */}
                <Box py="lg">
                    <Text size="sm" fw={600} c="rgba(255,255,255,0.85)" mb="sm">
                        이 시설이 도움이 되셨나요? 가족에게 공유해 보세요
                    </Text>

                    {/* URL 복사 */}
                    <Box
                        mx="auto"
                        px="md"
                        py={10}
                        style={{
                            backgroundColor: 'rgba(255,255,255,0.12)',
                            borderRadius: 8,
                            maxWidth: 320,
                            cursor: 'pointer',
                            border: '1px solid rgba(255,255,255,0.2)',
                        }}
                        onClick={() => {
                            const url = `https://daedaesonson.com/facility/${facility.id}`;
                            navigator.clipboard.writeText(url);
                            alert('링크가 복사되었습니다!');
                        }}
                    >
                        <Group justify="center" gap={6}>
                            <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)' }}>content_copy</span>
                            <Text size="xs" c="rgba(255,255,255,0.8)" lineClamp={1}>
                                daedaesonson.com/facility/{facility.id}
                            </Text>
                        </Group>
                    </Box>
                </Box>
                {/* ── 구분선 ── */}
                <Box mx={-16} style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.08)' }} />

                {/* 정보수정 요청 */}
                <Box py="lg">
                    <Text style={{ fontSize: 14 }} c="rgba(255,255,255,0.75)" lh={1.6}>
                        혹시 잘못된 정보가 있다면 알려주세요.<br />
                        빠르게 확인 후 수정하겠습니다.
                    </Text>
                </Box>
                {/* ── 구분선 ── */}
                <Box mx={-16} style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.08)' }} />

                {/* 시설 정보수정 요청 버튼 */}
                <Box py="lg">
                    <Box
                        component="a"
                        href={`mailto:seunghun.dev@gmail.com?subject=${encodeURIComponent(`[정보수정] ${facility.name}`)}&body=${encodeURIComponent(`시설명: ${facility.name}\n\n수정이 필요한 내용:\n\n`)}`}
                        style={{ textDecoration: 'none', cursor: 'pointer' }}
                    >
                        <Text style={{ fontSize: 16 }} fw={600} c="rgba(255,255,255,0.85)">정보 수정 요청하기</Text>
                    </Box>
                </Box>
                {/* ── 구분선 ── */}
                <Box mx={-16} style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.08)' }} />

                {/* 맨위로 이동 */}
                <Box
                    py="md"
                    onClick={() => {
                        const container = document.querySelector('.facility-detail-container');
                        if (container) container.scrollTo({ top: 0, behavior: 'smooth' });
                        else window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    style={{ cursor: 'pointer' }}
                >
                    <span className="material-symbols-outlined" style={{ fontSize: 28, color: 'rgba(255,255,255,0.6)' }}>keyboard_arrow_up</span>
                </Box>
            </Box>


            {/* Story Panel Overlay */}
            <InquiryPanel facility={facility} isOpen={inquiryOpen} onClose={() => setInquiryOpen(false)} allFacilities={allFacilities} />
            <ReviewsPanel facility={facility} isOpen={reviewsOpen} onClose={() => setReviewsOpen(false)} />

            {/* 상담 신청 - 모바일: Modal fullScreen, PC: Drawer 스타일 */}
            {
                isMobile ? (
                    <Drawer
                        opened={consultModalOpened}
                        onClose={() => setConsultModalOpened(false)}
                        position="right"
                        size="100%"
                        withCloseButton={false}
                        withinPortal
                        zIndex={10000}
                        padding={0}
                        lockScroll={false}
                        keepMounted
                        transitionProps={{
                            transition: 'slide-left',
                            duration: 300,
                            timingFunction: 'ease-out'
                        }}
                        styles={{
                            inner: {
                                height: '100%'
                            },
                            body: {
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                overflow: 'hidden'
                            },
                            content: {
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                overflow: 'hidden'
                            },
                            overlay: {
                                backgroundColor: 'transparent' // 오버레이 투명화로 깜빡임 방지
                            }
                        }}
                    >
                        {/* 헤더 */}
                        <Box
                            p="md"
                            style={{
                                borderBottom: '1px solid #f1f3f5',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                position: 'sticky',
                                top: 0,
                                background: 'white',
                                zIndex: 10
                            }}
                        >
                            <ActionIcon variant="subtle" color="gray" onClick={() => setConsultModalOpened(false)}>
                                <X size={20} />
                            </ActionIcon>
                            <Box style={{ width: 36 }} />
                        </Box>

                        {/* 본문 - 스크롤 영역 */}
                        {consultSuccess ? (
                            /* 성공 화면 - 깔끔한 디자인 */
                            <Box style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'white' }}>
                                {/* 스크롤 가능한 메인 콘텐츠 */}
                                <Box style={{
                                    flex: 1,
                                    overflowY: 'auto',
                                    padding: '32px 20px',
                                    WebkitOverflowScrolling: 'touch',
                                    touchAction: 'pan-y'
                                }}>
                                    {/* 체크 아이콘 + 메시지 */}
                                    <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
                                        <Box
                                            style={{
                                                width: 72,
                                                height: 72,
                                                borderRadius: '50%',
                                                background: 'var(--mantine-color-brand-6)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                marginBottom: 20
                                            }}
                                        >
                                            <Check size={36} color="white" strokeWidth={3} />
                                        </Box>
                                        <Text size="xl" fw={700} ta="center" mb={8}>
                                            상담 신청이 완료되었어요
                                        </Text>
                                        <Text size="sm" c="dimmed" ta="center">
                                            영업일 기준 1일 이내 연락드릴게요
                                        </Text>
                                    </Box>

                                    {/* 신청 정보 카드 */}
                                    <Box
                                        style={{
                                            background: '#f8f9fa',
                                            borderRadius: 12,
                                            padding: 20,
                                            marginBottom: 20
                                        }}
                                    >
                                        <Text size="xs" c="dimmed" mb={16} fw={600}>신청 정보</Text>
                                        <Stack gap={12}>
                                            <Group justify="space-between">
                                                <Text size="sm" c="dimmed">신청 시설</Text>
                                                <Text size="sm" fw={600}>{facility.name}</Text>
                                            </Group>
                                            <Group justify="space-between">
                                                <Text size="sm" c="dimmed">신청자</Text>
                                                <Text size="sm" fw={600}>{submittedConsultData?.name || '-'}</Text>
                                            </Group>
                                            <Group justify="space-between">
                                                <Text size="sm" c="dimmed">연락처</Text>
                                                <Text size="sm" fw={600}>{submittedConsultData?.phone || '-'}</Text>
                                            </Group>
                                            <Group justify="space-between">
                                                <Text size="sm" c="dimmed">희망 연락시간</Text>
                                                <Text size="sm" fw={600}>{submittedConsultData?.preferredTime || '시간 무관'}</Text>
                                            </Group>
                                            <Group justify="space-between">
                                                <Text size="sm" c="dimmed">궁금한 점</Text>
                                                <Text size="sm" fw={600}>
                                                    {submittedConsultData?.question === 'price' && '가격 문의'}
                                                    {submittedConsultData?.question === 'location' && '위치/교통'}
                                                    {submittedConsultData?.question === 'grave' && '장지 유형'}
                                                    {submittedConsultData?.question === 'other' && '기타'}
                                                </Text>
                                            </Group>
                                            {submittedConsultData?.message && (
                                                <Box style={{ borderTop: '1px solid #e9ecef', paddingTop: 12, marginTop: 4 }}>
                                                    <Text size="xs" c="dimmed" mb={4}>추가 요청사항</Text>
                                                    <Text size="sm">{submittedConsultData.message}</Text>
                                                </Box>
                                            )}
                                            <Group justify="space-between">
                                                <Text size="sm" c="dimmed">상담 방식</Text>
                                                <Text size="sm" fw={600}>
                                                    {submittedConsultData?.consultMethod === 'phone' && '전화 상담'}
                                                    {submittedConsultData?.consultMethod === 'field' && '방문 상담'}
                                                </Text>
                                            </Group>
                                        </Stack>
                                    </Box>

                                    {/* 안내 사항 */}
                                    <Box>
                                        <Text size="xs" c="dimmed" mb={12} fw={600}>안내 사항</Text>
                                        <Stack gap={8}>
                                            <Text size="sm" c="dimmed">• 입력하신 연락처로 전문 상담사가 연락드립니다</Text>
                                            <Text size="sm" c="dimmed">• 상담은 무료이며, 부담 없이 질문해 주세요</Text>
                                            <Text size="sm" c="dimmed">• 개인정보는 상담 목적으로만 사용됩니다</Text>
                                        </Stack>
                                    </Box>
                                </Box>

                                {/* 하단 버튼 - 뒤로 25% / 확인 75% */}
                                <Box p="lg" style={{ borderTop: '1px solid #f1f3f5' }}>
                                    <Group gap="sm">
                                        <Button
                                            variant="light"
                                            color="gray"
                                            size="lg"
                                            radius="md"
                                            styles={{ root: { height: 52, flex: '0 0 25%' } }}
                                            onClick={() => setConsultSuccess(false)}
                                        >
                                            뒤로
                                        </Button>
                                        <Button
                                            color="brand"
                                            size="lg"
                                            radius="md"
                                            styles={{ root: { height: 52, flex: 1 } }}
                                            onClick={() => {
                                                setConsultModalOpened(false);
                                                setConsultSuccess(false);
                                            }}
                                        >
                                            확인
                                        </Button>
                                    </Group>
                                </Box>
                            </Box>
                        ) : (
                            <Box style={{
                                flex: 1,
                                overflowY: 'auto',
                                padding: '24px 20px 100px',
                                WebkitOverflowScrolling: 'touch',
                                touchAction: 'pan-y'
                            }}>
                                {/* 타이틀 */}
                                <Box mb="xl">
                                    <Text size="24px" fw={700} lh={1.3} style={{ wordBreak: 'keep-all' }}>
                                        상담을 신청하려면{'\n'}
                                        <Text span c="brand" inherit>필수 정보</Text>가 필요해요.
                                    </Text>
                                    <Text size="sm" c="dimmed" mt="sm">
                                        {facility.name}
                                    </Text>
                                </Box>

                                <Stack gap="sm">
                                    {/* 1. 이름 - 클릭하면 1번만 열림 */}
                                    <Box
                                        p="lg"
                                        style={{
                                            border: consultStep === 1 ? '2px solid var(--mantine-color-brand-6)' : '1px solid #e9ecef',
                                            borderRadius: 12,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onClick={() => setConsultStep(consultStep === 1 ? -1 : 1)}
                                    >
                                        <Group justify="space-between">
                                            <Text size="md" fw={700}>1. 이름</Text>
                                            <Group gap="xs">
                                                {consultStep !== 0 && consultStep !== 1 && consultForm.name && <Text size="sm" c="dimmed">{consultForm.name}</Text>}
                                                <ChevronDown size={18} color="#adb5bd" style={{ transform: (consultStep === 0 || consultStep === 1) ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                                            </Group>
                                        </Group>
                                        <Collapse in={consultStep === 0 || consultStep === 1}>
                                            <Box mt="md">
                                                <TextInput
                                                    ref={nameInputRef}
                                                    placeholder="이름을 입력해 주세요."
                                                    variant="unstyled"
                                                    size="lg"
                                                    value={consultForm.name}
                                                    onChange={(e) => setConsultForm({ ...consultForm, name: e.currentTarget.value })}
                                                    styles={{ input: { borderBottom: '1px solid #dee2e6', borderRadius: 0, paddingBottom: 8 } }}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </Box>
                                        </Collapse>
                                    </Box>

                                    {/* 2. 연락처 - 클릭하면 2번만 열림 */}
                                    <Box
                                        p="lg"
                                        style={{
                                            border: consultStep === 2 ? '2px solid var(--mantine-color-brand-6)' : '1px solid #e9ecef',
                                            borderRadius: 12,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onClick={() => setConsultStep(consultStep === 2 ? -1 : 2)}
                                    >
                                        <Group justify="space-between">
                                            <Text size="md" fw={700}>2. 연락처</Text>
                                            <Group gap="xs">
                                                {consultStep !== 0 && consultStep !== 2 && consultForm.phone && <Text size="sm" c="dimmed">{consultForm.phone}</Text>}
                                                <ChevronDown size={18} color="#adb5bd" style={{ transform: (consultStep === 0 || consultStep === 2) ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                                            </Group>
                                        </Group>
                                        <Collapse in={consultStep === 0 || consultStep === 2}>
                                            <Box mt="md">
                                                <TextInput
                                                    placeholder="010-0000-0000"
                                                    variant="unstyled"
                                                    size="lg"
                                                    value={consultForm.phone}
                                                    onChange={(e) => setConsultForm({ ...consultForm, phone: formatPhoneNumber(e.currentTarget.value) })}
                                                    styles={{ input: { borderBottom: '1px solid #dee2e6', borderRadius: 0, paddingBottom: 8 } }}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                                <Text size="xs" c="dimmed" mt="xs">연락처는 상담사와 제휴시설에만 전달됩니다.</Text>
                                            </Box>
                                        </Collapse>
                                    </Box>

                                    {/* 3. 연락 가능 시간 - 클릭하면 3번만 열림 */}
                                    <Box
                                        p="lg"
                                        style={{
                                            border: consultStep === 3 ? '2px solid var(--mantine-color-brand-6)' : '1px solid #e9ecef',
                                            borderRadius: 12,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onClick={() => setConsultStep(consultStep === 3 ? -1 : 3)}
                                    >
                                        <Group justify="space-between">
                                            <Text size="md" fw={700}>3. 연락 가능 시간</Text>
                                            <Group gap="xs">
                                                {consultStep !== 0 && consultStep !== 3 && consultForm.preferredTime && <Text size="sm" c="dimmed">{consultForm.preferredTime}</Text>}
                                                <ChevronDown size={18} color="#adb5bd" style={{ transform: (consultStep === 0 || consultStep === 3) ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                                            </Group>
                                        </Group>
                                        <Collapse in={consultStep === 0 || consultStep === 3}>
                                            <Stack gap="xs" mt="md">
                                                {['09시~12시', '12시~14시', '14시~18시', '18시~21시', '시간 무관'].map((time) => (
                                                    <Box key={time}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setConsultForm({ ...consultForm, preferredTime: time });
                                                            setConsultStep(4); // 선택하면 4번 열림
                                                        }}
                                                        style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '8px 0' }}>
                                                        <Box style={{
                                                            width: 22, height: 22, borderRadius: '50%',
                                                            border: consultForm.preferredTime === time ? '6px solid var(--mantine-color-brand-6)' : '2px solid #ced4da', background: 'white'
                                                        }} />
                                                        <Text size="md">{time}</Text>
                                                    </Box>
                                                ))}
                                            </Stack>
                                        </Collapse>
                                    </Box>

                                    {/* 4. 상담 방법 */}
                                    <Box
                                        p="lg"
                                        style={{
                                            border: consultStep === 4 ? '2px solid var(--mantine-color-brand-6)' : '1px solid #e9ecef',
                                            borderRadius: 12,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onClick={() => setConsultStep(consultStep === 4 ? -1 : 4)}
                                    >
                                        <Group justify="space-between">
                                            <Text size="md" fw={700}>4. 상담 방법</Text>
                                            <Group gap="xs">
                                                {consultStep !== 4 && consultForm.consultMethod && <Text size="sm" c="dimmed">{
                                                    consultForm.consultMethod === 'phone' ? '전화 상담' :
                                                        consultForm.consultMethod === 'phone' ? '전화 상담' : '방문 상담'
                                                }</Text>}
                                                <ChevronDown size={18} color="#adb5bd" style={{ transform: consultStep === 4 ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                                            </Group>
                                        </Group>
                                        <Collapse in={consultStep === 4}>
                                            <Stack gap="sm" mt="md" onClick={(e) => e.stopPropagation()}>
                                                {[
                                                    { value: 'phone', label: '전화 상담', desc: '전화로 상담받기' },
                                                    { value: 'field', label: '방문 상담', desc: '시설 현장에서 상담' }
                                                ].map(method => (
                                                    <Box
                                                        key={method.value}
                                                        p="md"
                                                        style={{
                                                            border: consultForm.consultMethod === method.value ? '2px solid var(--mantine-color-brand-6)' : '1px solid #dee2e6',
                                                            borderRadius: 8,
                                                            cursor: 'pointer',
                                                            background: consultForm.consultMethod === method.value ? 'var(--mantine-color-brand-0)' : 'white'
                                                        }}
                                                        onClick={() => {
                                                            setConsultForm({ ...consultForm, consultMethod: method.value });
                                                            setConsultStep(5); // 선택하면 5번 열림
                                                        }}
                                                    >
                                                        <Text size="sm" fw={600}>{method.label}</Text>
                                                        <Text size="xs" c="dimmed">{method.desc}</Text>
                                                    </Box>
                                                ))}
                                            </Stack>
                                        </Collapse>
                                    </Box>

                                    {/* 5. 궁금한 점 - 클릭하면 5번만 열림 */}
                                    <Box
                                        p="lg"
                                        style={{
                                            border: consultStep === 5 ? '2px solid var(--mantine-color-brand-6)' : '1px solid #e9ecef',
                                            borderRadius: 12,
                                            transition: 'all 0.2s ease',
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => setConsultStep(consultStep === 5 ? -1 : 5)}
                                    >
                                        <Group justify="space-between">
                                            <Text size="md" fw={700}>5. 궁금한 점</Text>
                                            <Group gap="xs">
                                                {consultStep !== 5 && consultForm.question && <Text size="sm" c="dimmed">{
                                                    consultForm.question === 'price' ? '비용/가격' :
                                                        consultForm.question === 'location' ? '위치/교통' :
                                                            consultForm.question === 'grave' ? '묘지 유형' : '기타'
                                                }</Text>}
                                                <ChevronDown size={18} color="#adb5bd" style={{ transform: consultStep === 5 ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                                            </Group>
                                        </Group>
                                        <Collapse in={consultStep === 5}>
                                            <Stack gap="xs" mt="md">
                                                {[
                                                    { value: 'price', label: '비용/가격이 궁금해요' },
                                                    { value: 'location', label: '위치/교통이 궁금해요' },
                                                    { value: 'grave', label: '묘지 유형이 궁금해요' },
                                                    { value: 'other', label: '기타 문의' }
                                                ].map((q) => (
                                                    <Box key={q.value}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setConsultForm({ ...consultForm, question: q.value });
                                                            setConsultStep(6); // 선택하면 6번 열림
                                                        }}
                                                        style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '8px 0' }}>
                                                        <Box style={{
                                                            width: 22, height: 22, borderRadius: '50%',
                                                            border: consultForm.question === q.value ? '6px solid var(--mantine-color-brand-6)' : '2px solid #ced4da', background: 'white'
                                                        }} />
                                                        <Text size="md">{q.label}</Text>
                                                    </Box>
                                                ))}
                                            </Stack>
                                        </Collapse>
                                    </Box>

                                    {/* 6. 추가 요청사항 - 클릭하면 6번만 열림 */}
                                    <Box
                                        p="lg"
                                        style={{
                                            border: consultStep === 6 ? '2px solid var(--mantine-color-brand-6)' : '1px solid #e9ecef',
                                            borderRadius: 12,
                                            transition: 'all 0.2s ease',
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => setConsultStep(consultStep === 6 ? -1 : 6)}
                                    >
                                        <Group justify="space-between">
                                            <Text size="md" fw={700}>6. 추가 요청사항 (선택)</Text>
                                            <ChevronDown size={18} color="#adb5bd" style={{ transform: consultStep === 6 ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                                        </Group>
                                        <Collapse in={consultStep === 6}>
                                            <Box mt="md">
                                                <Textarea
                                                    placeholder="추가로 궁금한 점이 있으시면 입력해주세요."
                                                    variant="unstyled"
                                                    rows={3}
                                                    value={consultForm.message}
                                                    onChange={(e) => setConsultForm({ ...consultForm, message: e.currentTarget.value })}
                                                    styles={{ input: { border: '1px solid #dee2e6', borderRadius: 8, padding: 12 } }}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </Box>
                                        </Collapse>
                                    </Box>
                                </Stack>
                            </Box>
                        )}

                        {/* 하단 버튼 - 성공 화면에서는 숨김 */}
                        {!consultSuccess && (
                            <Box
                                p="md"
                                style={{
                                    borderTop: '1px solid #f1f3f5',
                                    background: 'white',
                                    position: 'fixed',
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    zIndex: 10
                                }}
                            >
                                <Button
                                    fullWidth
                                    color="brand"
                                    size="lg"
                                    radius="md"
                                    loading={consultSubmitting}
                                    disabled={!consultForm.name || !consultForm.phone}
                                    styles={{ root: { height: 52 } }}
                                    onClick={async () => {
                                        setConsultSubmitting(true);
                                        try {
                                            const res = await fetch('/api/consult', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    facilityId: facility.id,
                                                    facilityName: facility.name,
                                                    ...consultForm
                                                })
                                            });
                                            if (res.ok) {
                                                setSubmittedConsultData({ ...consultForm }); // 성공 화면용 데이터 저장
                                                setConsultForm({ name: '', phone: '', preferredTime: '', question: 'price', message: '', consultMethod: 'phone' });
                                                setConsultStep(0);
                                                setConsultSuccess(true); // 성공 화면 표시
                                            }
                                        } catch (err) {
                                            alert('신청 중 오류가 발생했습니다.');
                                        } finally {
                                            setConsultSubmitting(false);
                                        }
                                    }}
                                >
                                    상담 신청하기
                                </Button>
                            </Box>
                        )}
                    </Drawer>
                ) : (
                    <Drawer
                        opened={consultModalOpened}
                        onClose={() => { setConsultModalOpened(false); setConsultStep(1); }}
                        position="left"
                        size="400px"
                        withCloseButton={false}
                        withinPortal
                        zIndex={10000}
                        overlayProps={{ opacity: 0 }}
                        styles={{ body: { height: '100%', display: 'flex', flexDirection: 'column', padding: 0 } }}
                    >
                        {/* 헤더 */}
                        <Box
                            p="md"
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                background: 'white'
                            }}
                        >
                            <ActionIcon variant="subtle" color="gray" onClick={() => { setConsultModalOpened(false); setConsultStep(1); }}>
                                <X size={20} />
                            </ActionIcon>
                            <Box style={{ width: 36 }} />
                        </Box>

                        {/* 본문 */}
                        {consultSuccess ? (
                            /* 성공 화면 - 깔끔한 디자인 */
                            <Box style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'white' }}>
                                {/* 스크롤 가능한 메인 콘텐츠 */}
                                <Box style={{ flex: 1, overflowY: 'auto', padding: '32px 20px' }}>
                                    {/* 체크 아이콘 + 메시지 */}
                                    <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
                                        <Box
                                            style={{
                                                width: 72,
                                                height: 72,
                                                borderRadius: '50%',
                                                background: 'var(--mantine-color-brand-6)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                marginBottom: 20
                                            }}
                                        >
                                            <Check size={36} color="white" strokeWidth={3} />
                                        </Box>
                                        <Text size="xl" fw={700} ta="center" mb={8}>
                                            상담 신청이 완료되었어요
                                        </Text>
                                        <Text size="sm" c="dimmed" ta="center">
                                            영업일 기준 1일 이내 연락드릴게요
                                        </Text>
                                    </Box>

                                    {/* 신청 정보 카드 */}
                                    <Box
                                        style={{
                                            background: '#f8f9fa',
                                            borderRadius: 12,
                                            padding: 20,
                                            marginBottom: 20
                                        }}
                                    >
                                        <Text size="xs" c="dimmed" mb={16} fw={600}>신청 정보</Text>
                                        <Stack gap={12}>
                                            <Group justify="space-between">
                                                <Text size="sm" c="dimmed">신청 시설</Text>
                                                <Text size="sm" fw={600}>{facility.name}</Text>
                                            </Group>
                                            <Group justify="space-between">
                                                <Text size="sm" c="dimmed">신청자</Text>
                                                <Text size="sm" fw={600}>{submittedConsultData?.name || '-'}</Text>
                                            </Group>
                                            <Group justify="space-between">
                                                <Text size="sm" c="dimmed">연락처</Text>
                                                <Text size="sm" fw={600}>{submittedConsultData?.phone || '-'}</Text>
                                            </Group>
                                            <Group justify="space-between">
                                                <Text size="sm" c="dimmed">희망 연락시간</Text>
                                                <Text size="sm" fw={600}>{submittedConsultData?.preferredTime || '시간 무관'}</Text>
                                            </Group>
                                            <Group justify="space-between">
                                                <Text size="sm" c="dimmed">궁금한 점</Text>
                                                <Text size="sm" fw={600}>
                                                    {submittedConsultData?.question === 'price' && '가격 문의'}
                                                    {submittedConsultData?.question === 'location' && '위치/교통'}
                                                    {submittedConsultData?.question === 'grave' && '장지 유형'}
                                                    {submittedConsultData?.question === 'other' && '기타'}
                                                </Text>
                                            </Group>
                                            {submittedConsultData?.message && (
                                                <Box style={{ borderTop: '1px solid #e9ecef', paddingTop: 12, marginTop: 4 }}>
                                                    <Text size="xs" c="dimmed" mb={4}>추가 요청사항</Text>
                                                    <Text size="sm">{submittedConsultData.message}</Text>
                                                </Box>
                                            )}
                                            <Group justify="space-between">
                                                <Text size="sm" c="dimmed">상담 방식</Text>
                                                <Text size="sm" fw={600}>
                                                    {submittedConsultData?.consultMethod === 'phone' && '전화 상담'}
                                                    {submittedConsultData?.consultMethod === 'field' && '방문 상담'}
                                                </Text>
                                            </Group>
                                        </Stack>
                                    </Box>

                                    {/* 안내 사항 */}
                                    <Box>
                                        <Text size="xs" c="dimmed" mb={12} fw={600}>안내 사항</Text>
                                        <Stack gap={8}>
                                            <Text size="sm" c="dimmed">• 입력하신 연락처로 전문 상담사가 연락드립니다</Text>
                                            <Text size="sm" c="dimmed">• 상담은 무료이며, 부담 없이 질문해 주세요</Text>
                                            <Text size="sm" c="dimmed">• 개인정보는 상담 목적으로만 사용됩니다</Text>
                                        </Stack>
                                    </Box>
                                </Box>

                                {/* 하단 버튼 - 뒤로 25% / 확인 75% */}
                                <Box p="lg" style={{ borderTop: '1px solid #f1f3f5' }}>
                                    <Group gap="sm">
                                        <Button
                                            variant="light"
                                            color="gray"
                                            size="lg"
                                            radius="md"
                                            styles={{ root: { height: 52, flex: '0 0 25%' } }}
                                            onClick={() => setConsultSuccess(false)}
                                        >
                                            뒤로
                                        </Button>
                                        <Button
                                            color="brand"
                                            size="lg"
                                            radius="md"
                                            styles={{ root: { height: 52, flex: 1 } }}
                                            onClick={() => {
                                                setConsultModalOpened(false);
                                                setConsultSuccess(false);
                                            }}
                                        >
                                            확인
                                        </Button>
                                    </Group>
                                </Box>
                            </Box>
                        ) : (
                            <Box style={{ flex: 1, overflowY: 'auto', padding: '24px 20px 100px' }}>
                                <Box mb="xl">
                                    <Text size="24px" fw={700} lh={1.3} style={{ wordBreak: 'keep-all' }}>
                                        상담을 신청하려면{'\n'}
                                        <Text span c="brand" inherit>필수 정보</Text>가 필요해요.
                                    </Text>
                                    <Text size="sm" c="dimmed" mt="sm">
                                        {facility.name}
                                    </Text>
                                </Box>

                                <Stack gap="sm">
                                    {/* 1. 이름 - 클릭하면 1번만 열림 */}
                                    <Box
                                        p="lg"
                                        style={{
                                            border: consultStep === 1 ? '2px solid var(--mantine-color-brand-6)' : '1px solid #e9ecef',
                                            borderRadius: 12,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onClick={() => setConsultStep(consultStep === 1 ? -1 : 1)}
                                    >
                                        <Group justify="space-between">
                                            <Text size="md" fw={700}>1. 이름</Text>
                                            <Group gap="xs">
                                                {consultStep !== 0 && consultStep !== 1 && consultForm.name && <Text size="sm" c="dimmed">{consultForm.name}</Text>}
                                                <ChevronDown size={18} color="#adb5bd" style={{ transform: (consultStep === 0 || consultStep === 1) ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                                            </Group>
                                        </Group>
                                        <Collapse in={consultStep === 0 || consultStep === 1}>
                                            <Box mt="md">
                                                <TextInput
                                                    ref={nameInputRef}
                                                    placeholder="이름을 입력해 주세요."
                                                    variant="unstyled"
                                                    size="md"
                                                    value={consultForm.name}
                                                    onChange={(e) => setConsultForm({ ...consultForm, name: e.currentTarget.value })}
                                                    styles={{ input: { borderBottom: '1px solid #dee2e6', borderRadius: 0, paddingBottom: 8 } }}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </Box>
                                        </Collapse>
                                    </Box>

                                    {/* 2. 연락처 - 클릭하면 2번만 열림 */}
                                    <Box
                                        p="lg"
                                        style={{
                                            border: consultStep === 2 ? '2px solid var(--mantine-color-brand-6)' : '1px solid #e9ecef',
                                            borderRadius: 12,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onClick={() => setConsultStep(consultStep === 2 ? -1 : 2)}
                                    >
                                        <Group justify="space-between">
                                            <Text size="md" fw={700}>2. 연락처</Text>
                                            <Group gap="xs">
                                                {consultStep !== 0 && consultStep !== 2 && consultForm.phone && <Text size="sm" c="dimmed">{consultForm.phone}</Text>}
                                                <ChevronDown size={18} color="#adb5bd" style={{ transform: (consultStep === 0 || consultStep === 2) ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                                            </Group>
                                        </Group>
                                        <Collapse in={consultStep === 0 || consultStep === 2}>
                                            <Box mt="md">
                                                <TextInput
                                                    placeholder="010-0000-0000"
                                                    variant="unstyled"
                                                    size="md"
                                                    value={consultForm.phone}
                                                    onChange={(e) => setConsultForm({ ...consultForm, phone: formatPhoneNumber(e.currentTarget.value) })}
                                                    styles={{ input: { borderBottom: '1px solid #dee2e6', borderRadius: 0, paddingBottom: 8 } }}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                                <Text size="xs" c="dimmed" mt="xs">연락처는 상담사와 제휴시설에만 전달됩니다.</Text>
                                            </Box>
                                        </Collapse>
                                    </Box>

                                    {/* 3. 연락 가능 시간 - 클릭하면 3번만 열림 */}
                                    <Box
                                        p="lg"
                                        style={{
                                            border: consultStep === 3 ? '2px solid var(--mantine-color-brand-6)' : '1px solid #e9ecef',
                                            borderRadius: 12,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onClick={() => setConsultStep(consultStep === 3 ? -1 : 3)}
                                    >
                                        <Group justify="space-between">
                                            <Text size="md" fw={700}>3. 연락 가능 시간</Text>
                                            <Group gap="xs">
                                                {consultStep !== 0 && consultStep !== 3 && consultForm.preferredTime && <Text size="sm" c="dimmed">{consultForm.preferredTime}</Text>}
                                                <ChevronDown size={18} color="#adb5bd" style={{ transform: (consultStep === 0 || consultStep === 3) ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                                            </Group>
                                        </Group>
                                        <Collapse in={consultStep === 0 || consultStep === 3}>
                                            <Stack gap="xs" mt="md">
                                                {['09시~12시', '12시~14시', '14시~18시', '18시~21시', '시간 무관'].map((time) => (
                                                    <Box key={time}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setConsultForm({ ...consultForm, preferredTime: time });
                                                            setConsultStep(4); // 선택하면 4번 열림
                                                        }}
                                                        style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '8px 0' }}>
                                                        <Box style={{
                                                            width: 22, height: 22, borderRadius: '50%',
                                                            border: consultForm.preferredTime === time ? '6px solid var(--mantine-color-brand-6)' : '2px solid #ced4da', background: 'white'
                                                        }} />
                                                        <Text size="md">{time}</Text>
                                                    </Box>
                                                ))}
                                            </Stack>
                                        </Collapse>
                                    </Box>

                                    {/* 4. 상담 방법 */}
                                    <Box
                                        p="lg"
                                        style={{
                                            border: consultStep === 4 ? '2px solid var(--mantine-color-brand-6)' : '1px solid #e9ecef',
                                            borderRadius: 12,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onClick={() => setConsultStep(consultStep === 4 ? -1 : 4)}
                                    >
                                        <Group justify="space-between">
                                            <Text size="md" fw={700}>4. 상담 방법</Text>
                                            <Group gap="xs">
                                                {consultStep !== 4 && consultForm.consultMethod && <Text size="sm" c="dimmed">{
                                                    consultForm.consultMethod === 'phone' ? '전화 상담' :
                                                        consultForm.consultMethod === 'phone' ? '전화 상담' : '방문 상담'
                                                }</Text>}
                                                <ChevronDown size={18} color="#adb5bd" style={{ transform: consultStep === 4 ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                                            </Group>
                                        </Group>
                                        <Collapse in={consultStep === 4}>
                                            <Stack gap="sm" mt="md" onClick={(e) => e.stopPropagation()}>
                                                {[
                                                    { value: 'phone', label: '전화 상담', desc: '전화로 상담받기' },
                                                    { value: 'field', label: '방문 상담', desc: '시설 현장에서 상담' }
                                                ].map(method => (
                                                    <Box
                                                        key={method.value}
                                                        p="md"
                                                        style={{
                                                            border: consultForm.consultMethod === method.value ? '2px solid var(--mantine-color-brand-6)' : '1px solid #dee2e6',
                                                            borderRadius: 8,
                                                            cursor: 'pointer',
                                                            background: consultForm.consultMethod === method.value ? 'var(--mantine-color-brand-0)' : 'white'
                                                        }}
                                                        onClick={() => {
                                                            setConsultForm({ ...consultForm, consultMethod: method.value });
                                                            setConsultStep(5); // 선택하면 5번 열림
                                                        }}
                                                    >
                                                        <Text size="sm" fw={600}>{method.label}</Text>
                                                        <Text size="xs" c="dimmed">{method.desc}</Text>
                                                    </Box>
                                                ))}
                                            </Stack>
                                        </Collapse>
                                    </Box>

                                    {/* 5. 궁금한 점 - 클릭하면 5번만 열림 */}
                                    <Box
                                        p="lg"
                                        style={{
                                            border: consultStep === 5 ? '2px solid var(--mantine-color-brand-6)' : '1px solid #e9ecef',
                                            borderRadius: 12,
                                            transition: 'all 0.2s ease',
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => setConsultStep(consultStep === 5 ? -1 : 5)}
                                    >
                                        <Group justify="space-between">
                                            <Text size="md" fw={700}>5. 궁금한 점</Text>
                                            <Group gap="xs">
                                                {consultStep !== 5 && consultForm.question && <Text size="sm" c="dimmed">{
                                                    consultForm.question === 'price' ? '비용/가격' :
                                                        consultForm.question === 'location' ? '위치/교통' :
                                                            consultForm.question === 'grave' ? '묘지 유형' : '기타'
                                                }</Text>}
                                                <ChevronDown size={18} color="#adb5bd" style={{ transform: consultStep === 5 ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                                            </Group>
                                        </Group>
                                        <Collapse in={consultStep === 5}>
                                            <Stack gap="xs" mt="md">
                                                {[
                                                    { value: 'price', label: '비용/가격이 궁금해요' },
                                                    { value: 'location', label: '위치/교통이 궁금해요' },
                                                    { value: 'grave', label: '묘지 유형이 궁금해요' },
                                                    { value: 'other', label: '기타 문의' }
                                                ].map((q) => (
                                                    <Box key={q.value}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setConsultForm({ ...consultForm, question: q.value });
                                                            setConsultStep(6); // 선택하면 6번 열림
                                                        }}
                                                        style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '8px 0' }}>
                                                        <Box style={{
                                                            width: 22, height: 22, borderRadius: '50%',
                                                            border: consultForm.question === q.value ? '6px solid var(--mantine-color-brand-6)' : '2px solid #ced4da', background: 'white'
                                                        }} />
                                                        <Text size="md">{q.label}</Text>
                                                    </Box>
                                                ))}
                                            </Stack>
                                        </Collapse>
                                    </Box>

                                    {/* 6. 추가 요청사항 - 클릭하면 6번만 열림 */}
                                    <Box
                                        p="lg"
                                        style={{
                                            border: consultStep === 6 ? '2px solid var(--mantine-color-brand-6)' : '1px solid #e9ecef',
                                            borderRadius: 12,
                                            transition: 'all 0.2s ease',
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => setConsultStep(consultStep === 6 ? -1 : 6)}
                                    >
                                        <Group justify="space-between">
                                            <Text size="md" fw={700}>6. 추가 요청사항 (선택)</Text>
                                            <ChevronDown size={18} color="#adb5bd" style={{ transform: consultStep === 6 ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                                        </Group>
                                        <Collapse in={consultStep === 6}>
                                            <Box mt="md">
                                                <Textarea
                                                    placeholder="추가로 궁금한 점이 있으시면 입력해주세요."
                                                    variant="unstyled"
                                                    rows={3}
                                                    value={consultForm.message}
                                                    onChange={(e) => setConsultForm({ ...consultForm, message: e.currentTarget.value })}
                                                    styles={{ input: { border: '1px solid #dee2e6', borderRadius: 8, padding: 12 } }}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </Box>
                                        </Collapse>
                                    </Box>
                                </Stack>
                            </Box>
                        )}

                        {/* 하단 버튼 - 성공 화면에서는 숨김 */}
                        {!consultSuccess && (
                            <Box p="md" style={{ borderTop: '1px solid #f1f3f5', background: 'white' }}>
                                <Button
                                    fullWidth
                                    color="brand"
                                    size="lg"
                                    radius="md"
                                    loading={consultSubmitting}
                                    disabled={!consultForm.name || !consultForm.phone}
                                    styles={{ root: { height: 52 } }}
                                    onClick={async () => {
                                        setConsultSubmitting(true);
                                        try {
                                            const res = await fetch('/api/consult', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    facilityId: facility.id,
                                                    facilityName: facility.name,
                                                    ...consultForm
                                                })
                                            });
                                            if (res.ok) {
                                                setSubmittedConsultData({ ...consultForm }); // 성공 화면용 데이터 저장
                                                setConsultForm({ name: '', phone: '', preferredTime: '', question: 'price', message: '', consultMethod: 'phone' });
                                                setConsultStep(0);
                                                setConsultSuccess(true); // 성공 화면 표시
                                            }
                                        } catch (err) {
                                            alert('신청 중 오류가 발생했습니다.');
                                        } finally {
                                            setConsultSubmitting(false);
                                        }
                                    }}
                                >
                                    상담 신청하기
                                </Button>
                            </Box>
                        )}
                    </Drawer>
                )
            }

            {/* Floating Button Removed */}

            {/* 🖼️ 호갱노노 스타일 전체화면 이미지 갤러리 */}
            {
                opened && galleryImages.length > 0 && (
                    <Box
                        pos="fixed"
                        top={0}
                        left={0}
                        w="100%"
                        h="100dvh"
                        onClick={() => setOpened(false)} // 배경 클릭 시 닫기
                        style={{
                            zIndex: 9999,
                            backgroundColor: 'rgba(0, 0, 0, 0.8)', // 80% opacity로 더 어둡게
                            cursor: 'pointer',
                        }}
                    >
                        {/* 상단 헤더 */}
                        <Box
                            pos="absolute"
                            top={0}
                            left={0}
                            w="100%"
                            p="md"
                            style={{
                                zIndex: 10000,
                                background: 'linear-gradient(to bottom, rgba(0,0,0,0.4), transparent)',
                            }}
                        >
                            <Group justify="space-between" align="center">
                                <Text c="white" fw={600} size="md">
                                    {selectedImageIndex + 1} / {galleryImages.length}
                                </Text>
                                <ActionIcon
                                    variant="transparent"
                                    c="white"
                                    size="lg"
                                    onClick={() => setOpened(false)}
                                >
                                    <X size={28} />
                                </ActionIcon>
                            </Group>
                        </Box>

                        {/* 이미지 영역 - 인스타그램 스타일 무한 캐러셀 */}
                        <Box
                            pos="absolute"
                            top="50%"
                            left="0"
                            w="100%"
                            h="80vh"
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                transform: 'translateY(-50%)',
                                overflow: 'hidden',
                                touchAction: 'pan-x',
                            }}
                            onTouchStart={(e) => {
                                const touch = e.touches[0];
                                (e.currentTarget as any).startX = touch.clientX;
                                (e.currentTarget as any).startTime = Date.now();
                                (e.currentTarget as any).offsetX = 0;
                            }}
                            onTouchMove={(e) => {
                                if (isAnimating) return;
                                const touch = e.touches[0];
                                const diff = touch.clientX - (e.currentTarget as any).startX;
                                (e.currentTarget as any).offsetX = diff;
                                const container = e.currentTarget.querySelector('[data-carousel]') as HTMLElement;
                                if (container) {
                                    // +1 for cloned first image at start
                                    const baseOffset = -(selectedImageIndex + 1) * 100;
                                    const dragPercent = (diff / window.innerWidth) * 100;
                                    container.style.transition = 'none';
                                    container.style.transform = `translateX(${baseOffset + dragPercent}%)`;
                                }
                            }}
                            onTouchEnd={(e) => {
                                if (isAnimating) return;
                                const offsetX = (e.currentTarget as any).offsetX || 0;
                                const velocity = Math.abs(offsetX) / (Date.now() - (e.currentTarget as any).startTime);
                                const threshold = velocity > 0.3 ? 30 : 80;

                                const container = e.currentTarget.querySelector('[data-carousel]') as HTMLElement;

                                if (Math.abs(offsetX) > threshold && galleryImages.length > 1) {
                                    setIsAnimating(true);

                                    let nextIndex = selectedImageIndex;
                                    if (offsetX < 0) {
                                        nextIndex = selectedImageIndex + 1;
                                    } else {
                                        nextIndex = selectedImageIndex - 1;
                                    }

                                    // Animate to the virtual position
                                    if (container) {
                                        container.style.transition = 'transform 0.3s ease-out';
                                        container.style.transform = `translateX(${-(nextIndex + 1) * 100}%)`;
                                    }

                                    setTimeout(() => {
                                        // Handle wrap-around
                                        let realIndex = nextIndex;
                                        if (nextIndex >= galleryImages.length) {
                                            realIndex = 0;
                                        } else if (nextIndex < 0) {
                                            realIndex = galleryImages.length - 1;
                                        }

                                        // Instantly jump to real position without animation
                                        if (realIndex !== nextIndex && container) {
                                            container.style.transition = 'none';
                                            container.style.transform = `translateX(${-(realIndex + 1) * 100}%)`;
                                        }

                                        setSelectedImageIndex(realIndex);
                                        setTimeout(() => setIsAnimating(false), 50);
                                    }, 300);
                                } else {
                                    if (container) {
                                        container.style.transition = 'transform 0.3s ease-out';
                                        container.style.transform = `translateX(${-(selectedImageIndex + 1) * 100}%)`;
                                    }
                                }
                            }}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                (e.currentTarget as any).isDragging = true;
                                (e.currentTarget as any).startX = e.clientX;
                                (e.currentTarget as any).startTime = Date.now();
                                (e.currentTarget as any).offsetX = 0;
                            }}
                            onMouseMove={(e) => {
                                if (!(e.currentTarget as any).isDragging || isAnimating) return;
                                const diff = e.clientX - (e.currentTarget as any).startX;
                                (e.currentTarget as any).offsetX = diff;
                                const container = e.currentTarget.querySelector('[data-carousel]') as HTMLElement;
                                if (container) {
                                    const baseOffset = -(selectedImageIndex + 1) * 100;
                                    const dragPercent = (diff / window.innerWidth) * 100;
                                    container.style.transition = 'none';
                                    container.style.transform = `translateX(${baseOffset + dragPercent}%)`;
                                }
                            }}
                            onMouseUp={(e) => {
                                if (!(e.currentTarget as any).isDragging) return;
                                (e.currentTarget as any).isDragging = false;
                                if (isAnimating) return;

                                const offsetX = (e.currentTarget as any).offsetX || 0;
                                const velocity = Math.abs(offsetX) / (Date.now() - (e.currentTarget as any).startTime);
                                const threshold = velocity > 0.3 ? 30 : 80;

                                const container = e.currentTarget.querySelector('[data-carousel]') as HTMLElement;

                                if (Math.abs(offsetX) > threshold && galleryImages.length > 1) {
                                    setIsAnimating(true);

                                    let nextIndex = selectedImageIndex;
                                    if (offsetX < 0) {
                                        nextIndex = selectedImageIndex + 1;
                                    } else {
                                        nextIndex = selectedImageIndex - 1;
                                    }

                                    if (container) {
                                        container.style.transition = 'transform 0.3s ease-out';
                                        container.style.transform = `translateX(${-(nextIndex + 1) * 100}%)`;
                                    }

                                    setTimeout(() => {
                                        let realIndex = nextIndex;
                                        if (nextIndex >= galleryImages.length) {
                                            realIndex = 0;
                                        } else if (nextIndex < 0) {
                                            realIndex = galleryImages.length - 1;
                                        }

                                        if (realIndex !== nextIndex && container) {
                                            container.style.transition = 'none';
                                            container.style.transform = `translateX(${-(realIndex + 1) * 100}%)`;
                                        }

                                        setSelectedImageIndex(realIndex);
                                        setTimeout(() => setIsAnimating(false), 50);
                                    }, 300);
                                } else {
                                    if (container) {
                                        container.style.transition = 'transform 0.3s ease-out';
                                        container.style.transform = `translateX(${-(selectedImageIndex + 1) * 100}%)`;
                                    }
                                }
                            }}
                            onMouseLeave={(e) => {
                                if ((e.currentTarget as any).isDragging) {
                                    (e.currentTarget as any).isDragging = false;
                                    const container = e.currentTarget.querySelector('[data-carousel]') as HTMLElement;
                                    if (container) {
                                        container.style.transition = 'transform 0.3s ease-out';
                                        container.style.transform = `translateX(${-(selectedImageIndex + 1) * 100}%)`;
                                    }
                                }
                            }}
                        >
                            {/* 무한 캐러셀 컨테이너 - [마지막복제, ...원본들, 첫번째복제] */}
                            <Box
                                data-carousel
                                style={{
                                    display: 'flex',
                                    height: '100%',
                                    transform: `translateX(${-(selectedImageIndex + 1) * 100}%)`,
                                    transition: 'transform 0.3s ease-out',
                                }}
                            >
                                {/* 마지막 이미지 복제 (맨 앞) */}
                                <Box
                                    style={{
                                        minWidth: '100%',
                                        height: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Image
                                        src={getSingleFacilityImageUrl(galleryImages[galleryImages.length - 1])}
                                        fit="contain"
                                        h="100%"
                                        w="100%"
                                        alt={`${facility.name} 사진 (복제)`}
                                        style={{ pointerEvents: 'none' }}
                                    />
                                </Box>

                                {/* 원본 이미지들 */}
                                {galleryImages.map((img, idx) => (
                                    <Box
                                        key={idx}
                                        style={{
                                            minWidth: '100%',
                                            height: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <Image
                                            src={getSingleFacilityImageUrl(img)}
                                            fit="contain"
                                            h="100%"
                                            w="100%"
                                            alt={`${facility.name} 사진 ${idx + 1}`}
                                            style={{ pointerEvents: 'none' }}
                                        />
                                    </Box>
                                ))}

                                {/* 첫번째 이미지 복제 (맨 뒤) */}
                                <Box
                                    style={{
                                        minWidth: '100%',
                                        height: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Image
                                        src={getSingleFacilityImageUrl(galleryImages[0])}
                                        fit="contain"
                                        h="100%"
                                        w="100%"
                                        alt={`${facility.name} 사진 (복제)`}
                                        style={{ pointerEvents: 'none' }}
                                    />
                                </Box>
                            </Box>
                        </Box>

                        {/* 하단 dot indicator (PC만) */}
                        {!isMobile && (
                            <Box
                                pos="absolute"
                                bottom={40}
                                left={0}
                                w="100%"
                                style={{ zIndex: 10000 }}
                            >
                                <Group justify="center" gap={8}>
                                    {galleryImages.map((_, idx) => (
                                        <Box
                                            key={idx}
                                            w={idx === selectedImageIndex ? 10 : 8}
                                            h={idx === selectedImageIndex ? 10 : 8}
                                            style={{
                                                borderRadius: '50%',
                                                backgroundColor: idx === selectedImageIndex ? 'white' : 'rgba(255,255,255,0.4)',
                                                transition: 'all 0.2s',
                                                cursor: 'pointer',
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedImageIndex(idx);
                                            }}
                                        />
                                    ))}
                                </Group>
                            </Box>
                        )}

                        {/* 좌우 네비게이션 (PC만) */}
                        {!isMobile && galleryImages.length > 1 && (
                            <>
                                <ActionIcon
                                    variant="transparent"
                                    c="white"
                                    size="xl"
                                    pos="absolute"
                                    left={20}
                                    top="50%"
                                    style={{ transform: 'translateY(-50%)', zIndex: 10000 }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedImageIndex(prev => prev > 0 ? prev - 1 : galleryImages.length - 1);
                                    }}
                                >
                                    <ChevronLeft size={40} />
                                </ActionIcon>
                                <ActionIcon
                                    variant="transparent"
                                    c="white"
                                    size="xl"
                                    pos="absolute"
                                    right={20}
                                    top="50%"
                                    style={{ transform: 'translateY(-50%)', zIndex: 10000 }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedImageIndex(prev => prev < galleryImages.length - 1 ? prev + 1 : 0);
                                    }}
                                >
                                    <ChevronRight size={40} />
                                </ActionIcon>
                            </>
                        )}
                    </Box>
                )
            }
            {/* 후기 작성 패널 (블라인드/당근 스타일) */}
            {
                reviewModalOpened && (
                    <Box
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: isMobile ? 0 : 400,
                            width: isMobile ? '100%' : '400px',
                            height: '100dvh',
                            zIndex: 9999,
                            backgroundColor: 'white',
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        <LoadingOverlay visible={isSubmitting} />

                        {/* 헤더 */}
                        <Box
                            px="md"
                            py="sm"
                            style={{
                                borderBottom: '1px solid #f1f3f5',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                flexShrink: 0,
                                height: 56,
                            }}
                        >
                            <Box w={36} />

                            <Text size="md" fw={600}>후기 작성</Text>

                            <Button
                                variant="filled"
                                color="brand"
                                size="xs"
                                radius="md"
                                fw={600}
                                onClick={handleSubmitReview}
                                disabled={reviewForm.rating === 0 || !reviewForm.content.trim() || reviewForm.password.length < 4}
                            >
                                등록
                            </Button>
                        </Box>

                        {/* 컨텐츠 영역 */}
                        <Box style={{ flex: 1, overflowY: 'auto' }}>
                            {/* 시설명 */}
                            <Box p="md" style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #f1f3f5' }}>
                                <Text size="sm" c="dimmed">{facility.name}에 대한 솔직한 후기를 남겨주세요.</Text>
                            </Box>

                            {/* 별점 선택 */}
                            <Box px="md" py="lg" style={{ borderBottom: '1px solid #f1f3f5' }}>
                                <Text size="sm" fw={600} mb={12}>만족도를 선택해주세요</Text>
                                <Group gap={8} justify="center">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <ActionIcon
                                            key={star}
                                            variant="transparent"
                                            size={44}
                                            onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                                            style={{ transition: 'transform 0.15s ease' }}
                                        >
                                            <Star
                                                size={36}
                                                color={star <= reviewForm.rating ? '#fbbf24' : '#dee2e6'}
                                                fill={star <= reviewForm.rating ? '#fbbf24' : 'none'}
                                                strokeWidth={1.5}
                                            />
                                        </ActionIcon>
                                    ))}
                                </Group>
                                {reviewForm.rating > 0 && (
                                    <Text size="xs" c="dimmed" ta="center" mt={8}>
                                        {reviewForm.rating === 1 ? '별로예요' :
                                            reviewForm.rating === 2 ? '아쉬워요' :
                                                reviewForm.rating === 3 ? '보통이에요' :
                                                    reviewForm.rating === 4 ? '좋아요' : '최고예요!'}
                                    </Text>
                                )}
                            </Box>

                            {/* 후기 내용 */}
                            <Box px="md" py={14} style={{ borderBottom: '1px solid #f1f3f5', minHeight: 160 }}>
                                <Textarea
                                    placeholder="방문 경험을 자유롭게 작성해주세요.&#10;&#10;예: 시설이 깨끗하고 주차장이 넓어요. 직원분도 친절했습니다."
                                    variant="unstyled"
                                    size="md"
                                    autosize
                                    minRows={6}
                                    value={reviewForm.content}
                                    onChange={(e) => setReviewForm({ ...reviewForm, content: e.target.value })}
                                    styles={{
                                        input: {
                                            padding: 0,
                                            fontSize: '16px',
                                            lineHeight: 1.6,
                                            '&::placeholder': { color: '#adb5bd' }
                                        }
                                    }}
                                />

                                {/* 사진 추가 */}
                                <Box mt="lg">
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        ref={reviewFileInputRef}
                                        style={{ display: 'none' }}
                                        onChange={handleReviewPhotoChange}
                                    />
                                    <Group gap="xs" align="flex-start">
                                        <Box
                                            w={72}
                                            h={72}
                                            style={{
                                                border: '1px solid #dee2e6',
                                                borderRadius: 8,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                flexShrink: 0,
                                            }}
                                            onClick={() => reviewFileInputRef.current?.click()}
                                        >
                                            <Camera size={22} color="#868e96" strokeWidth={1.5} />
                                            <Text size="xs" c="dimmed" mt={2}>
                                                {reviewForm.photos.length}/5
                                            </Text>
                                        </Box>

                                        {reviewForm.photos.map((photo, idx) => (
                                            <Box key={idx} pos="relative" w={72} h={72}>
                                                <Image src={photo} w={72} h={72} radius="md" style={{ objectFit: 'cover', border: '1px solid #dee2e6' }} />
                                                <ActionIcon
                                                    size={18}
                                                    radius="xl"
                                                    color="dark"
                                                    variant="filled"
                                                    style={{ position: 'absolute', top: -6, right: -6 }}
                                                    onClick={() => removeReviewPhoto(idx)}
                                                >
                                                    <X size={10} />
                                                </ActionIcon>
                                            </Box>
                                        ))}
                                    </Group>
                                </Box>
                            </Box>

                            {/* 닉네임 */}
                            <Box px="md" py={14} style={{ borderBottom: '1px solid #f1f3f5' }}>
                                <TextInput
                                    label="닉네임"
                                    placeholder="닉네임을 입력하세요"
                                    value={reviewForm.nickname}
                                    onChange={(e) => setReviewForm({ ...reviewForm, nickname: e.currentTarget.value })}
                                    variant="unstyled"
                                    size="sm"
                                    styles={{
                                        label: { fontSize: 14, fontWeight: 500, marginBottom: 4 },
                                        input: {
                                            padding: 0,
                                            fontSize: '16px',
                                            '&::placeholder': { color: '#adb5bd' }
                                        }
                                    }}
                                />
                            </Box>

                            {/* 비밀번호 (삭제용) */}
                            <Box px="md" py={14} style={{ borderBottom: '1px solid #f1f3f5' }}>
                                <TextInput
                                    label="비밀번호"
                                    description="후기 삭제 시 필요합니다"
                                    placeholder="4자 이상 입력"
                                    type="password"
                                    value={reviewForm.password}
                                    onChange={(e) => setReviewForm({ ...reviewForm, password: e.currentTarget.value })}
                                    size="sm"
                                    radius="md"
                                    variant="default"
                                    styles={{
                                        label: { fontSize: 14, fontWeight: 500, marginBottom: 4 },
                                    }}
                                />
                            </Box>
                        </Box>
                    </Box>
                )
            }


            {/* 연락처 입력 모달 (등록 버튼 클릭 시) */}
            <Modal
                opened={phoneModalOpened}
                onClose={closePhoneModal}
                title="연락처 입력"
                size="sm"
                centered
                zIndex={10001}
            >
                <Stack gap="md">
                    <Text size="sm" c="dimmed">
                        문의 답변을 받으실 연락처를 입력해주세요.
                    </Text>

                    <TextInput
                        label="연락처"
                        placeholder="010-0000-0000"
                        value={inquiryForm.phone}
                        onChange={(e) => setInquiryForm({ ...inquiryForm, phone: formatPhoneNumber(e.currentTarget.value) })}
                        description="뒷자리 4자리가 비밀번호로 사용됩니다"
                        required
                        styles={{ input: { fontSize: '16px' } }}
                    />

                    <Paper p="sm" bg="gray.0" radius="md">
                        <Group align="flex-start" gap="sm">
                            <Switch
                                checked={inquiryForm.privacyAgreed}
                                onChange={(e) => setInquiryForm({ ...inquiryForm, privacyAgreed: e.currentTarget.checked })}
                                color="brand"
                                size="sm"
                                mt={2}
                            />
                            <Box style={{ flex: 1 }}>
                                <Text size="xs" fw={500}>개인정보 수집 동의</Text>
                                <Text size="xs" c="dimmed" lh={1.5} mt={4}>
                                    문의 답변 및 비밀번호 생성을 위해 연락처를 수집합니다.
                                </Text>
                            </Box>
                        </Group>
                    </Paper>

                    <Button
                        fullWidth
                        onClick={() => {
                            closePhoneModal();
                            handleSubmitInquiry();
                        }}
                        disabled={!inquiryForm.phone.trim() || inquiryForm.phone.replace(/\D/g, '').length < 10 || !inquiryForm.privacyAgreed}
                    >
                        문의 등록하기
                    </Button>
                </Stack>
            </Modal>

            {/* 문의 상세 바텀시트 */}
            <Modal
                opened={inquiryDetailOpened}
                onClose={closeInquiryDetail}
                withCloseButton={false}
                size="md"
                padding={0}
                zIndex={10001}
                centered={false}
                styles={{
                    content: {
                        position: 'fixed',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        margin: 0,
                        borderRadius: '20px 20px 0 0',
                        maxHeight: '80vh',
                        boxShadow: '0 -4px 30px rgba(0,0,0,0.1)',
                    },
                    body: { padding: 0 },
                    inner: { padding: 0, alignItems: 'flex-end' }
                }}
            >
                {selectedInquiry && (
                    <Box>
                        {/* 드래그 핸들 */}
                        <Box pt="sm" pb="xs" ta="center">
                            <Box w={40} h={4} bg="gray.3" mx="auto" style={{ borderRadius: 2 }} />
                        </Box>

                        {/* 헤더 */}
                        <Box px="lg" pb="md">
                            <Group justify="space-between" align="flex-start">
                                <Box style={{ flex: 1 }}>
                                    <Group gap={6} mb={4}>
                                        {selectedInquiry.isPrivate && (
                                            <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#868e96' }}>lock</span>
                                        )}
                                        <Text size="lg" fw={700} c="dark">{selectedInquiry.title}</Text>
                                    </Group>
                                    <Text size="xs" c="dimmed">
                                        {new Date(selectedInquiry.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </Text>
                                </Box>
                                <ActionIcon variant="subtle" color="gray" size="lg" onClick={closeInquiryDetail}>
                                    <X size={20} />
                                </ActionIcon>
                            </Group>
                        </Box>

                        {/* 구분선 */}
                        <Box h={1} bg="gray.1" />

                        {/* 내용 영역 */}
                        <Box p="lg" style={{ minHeight: 280 }}>
                            {/* 비공개이고 잠금 상태일 때 */}
                            {selectedInquiry.isPrivate && !inquiryUnlocked ? (
                                <Box ta="center" py="xl">
                                    <Box
                                        w={56} h={56} mb="md" mx="auto"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                                            borderRadius: 28
                                        }}
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: 28, color: '#495057' }}>lock</span>
                                    </Box>
                                    <Text size="md" fw={600} c="dark" mb={6}>비공개 문의입니다</Text>
                                    <Text size="sm" c="dimmed" mb="xl">
                                        작성 시 입력한 연락처 뒷자리 4자리를 입력해주세요.
                                    </Text>

                                    <Box maw={200} mx="auto">
                                        <TextInput
                                            placeholder="0000"
                                            value={inquiryPinInput}
                                            onChange={(e) => setInquiryPinInput(e.currentTarget.value.replace(/\D/g, '').slice(0, 4))}
                                            maxLength={4}
                                            styles={{
                                                input: {
                                                    textAlign: 'center',
                                                    fontSize: '22px',
                                                    fontWeight: 600,
                                                    letterSpacing: 10,
                                                    height: 52,
                                                    borderRadius: 12,
                                                    border: '2px solid #dee2e6',
                                                }
                                            }}
                                            error={inquiryPinError}
                                        />
                                        <Button
                                            fullWidth
                                            mt="md"
                                            size="md"
                                            radius="xl"
                                            onClick={handleInquiryUnlock}
                                            disabled={inquiryPinInput.length !== 4}
                                        >
                                            확인하기
                                        </Button>
                                    </Box>
                                </Box>
                            ) : (
                                /* 공개 또는 잠금 해제 시 */
                                <Stack gap="lg">
                                    <Text size="sm" c="dark" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                                        {selectedInquiry.content}
                                    </Text>

                                    {/* 답변 */}
                                    {selectedInquiry.replies && selectedInquiry.replies.length > 0 && (
                                        <Box p="md" style={{ backgroundColor: '#f0f4ff', borderRadius: 12, borderLeft: '4px solid #1D0098' }}>
                                            <Group gap={6} mb={6}>
                                                <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#1D0098' }}>support_agent</span>
                                                <Text size="xs" fw={600} c="brand">관리자 답변</Text>
                                            </Group>
                                            <Text size="sm" c="dark">{selectedInquiry.replies[0].content}</Text>
                                        </Box>
                                    )}

                                    {/* 삭제 버튼 (잠금 해제 시만) */}
                                    {inquiryUnlocked && selectedInquiry.isPrivate && (
                                        <Button
                                            variant="subtle"
                                            color="gray"
                                            size="sm"
                                            leftSection={<span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>}
                                            onClick={handleInquiryDelete}
                                            style={{ alignSelf: 'center' }}
                                        >
                                            이 문의 삭제
                                        </Button>
                                    )}
                                </Stack>
                            )}
                        </Box>
                    </Box>
                )}
            </Modal>

            {/* 🔴 플로팅 상담 버튼 (FAB) */}
            <Box
                onClick={() => setConsultModalOpened(true)}
                style={{
                    position: 'fixed',
                    bottom: isMobile ? 16 : 16,
                    right: 16,
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #1D0098 0%, #4B3FD3 100%)',
                    boxShadow: '0 4px 16px rgba(29, 0, 152, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 100,
                    transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                    e.currentTarget.style.boxShadow = '0 6px 24px rgba(29, 0, 152, 0.5)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(29, 0, 152, 0.4)';
                }}
            >
                <Text size="xs" fw={700} c="white" ta="center" lh={1.2}>
                    상담<br />하기
                </Text>
            </Box>

            {/* 🖼️ 풀스크린 이미지 뷰어 (기존 갤러리 스타일과 동일) */}
            {enlargedImages.length > 0 && (
                <Box
                    pos="fixed"
                    top={0}
                    left={0}
                    w="100%"
                    h="100dvh"
                    style={{
                        zIndex: 9999,
                        backgroundColor: 'rgba(0, 0, 0, 0.95)',
                    }}
                >
                    {/* 상단 헤더 */}
                    <Box
                        pos="absolute"
                        top={0}
                        left={0}
                        w="100%"
                        p="md"
                        style={{
                            zIndex: 10000,
                            background: 'linear-gradient(to bottom, rgba(0,0,0,0.4), transparent)',
                        }}
                    >
                        <Group justify="space-between" align="center">
                            <Text c="white" fw={600} size="md">
                                {enlargedImageIndex + 1} / {enlargedImages.length}
                            </Text>
                            <ActionIcon
                                variant="transparent"
                                c="white"
                                size="lg"
                                onClick={closeImageViewer}
                            >
                                <X size={28} />
                            </ActionIcon>
                        </Group>
                    </Box>

                    {/* 이미지 */}
                    <Box
                        style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '60px 16px 16px',
                        }}
                        onClick={closeImageViewer}
                    >
                        <img
                            src={enlargedImages[enlargedImageIndex]}
                            alt="확대 이미지"
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                maxWidth: '100%',
                                maxHeight: '85vh',
                                objectFit: 'contain',
                                borderRadius: '8px',
                            }}
                        />
                    </Box>

                    {/* 하단 인디케이터 (이미지 2장 이상) */}
                    {enlargedImages.length > 1 && (
                        <Box
                            pos="absolute"
                            bottom={24}
                            left={0}
                            w="100%"
                            style={{ zIndex: 10000 }}
                        >
                            <Group justify="center" gap={6}>
                                {enlargedImages.map((_, idx) => (
                                    <Box
                                        key={idx}
                                        w={idx === enlargedImageIndex ? 10 : 8}
                                        h={idx === enlargedImageIndex ? 10 : 8}
                                        style={{
                                            borderRadius: '50%',
                                            backgroundColor: idx === enlargedImageIndex ? 'white' : 'rgba(255,255,255,0.4)',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEnlargedImageIndex(idx);
                                        }}
                                    />
                                ))}
                            </Group>
                        </Box>
                    )}

                    {/* 좌우 네비게이션 (이미지 2장 이상) */}
                    {enlargedImages.length > 1 && (
                        <>
                            {enlargedImageIndex > 0 && (
                                <ActionIcon
                                    variant="transparent"
                                    c="white"
                                    size="xl"
                                    pos="absolute"
                                    top="50%"
                                    left={8}
                                    style={{ transform: 'translateY(-50%)', zIndex: 10000 }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setEnlargedImageIndex(prev => prev - 1);
                                    }}
                                >
                                    <ChevronLeft size={32} />
                                </ActionIcon>
                            )}
                            {enlargedImageIndex < enlargedImages.length - 1 && (
                                <ActionIcon
                                    variant="transparent"
                                    c="white"
                                    size="xl"
                                    pos="absolute"
                                    top="50%"
                                    right={8}
                                    style={{ transform: 'translateY(-50%)', zIndex: 10000 }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setEnlargedImageIndex(prev => prev + 1);
                                    }}
                                >
                                    <ChevronRight size={32} />
                                </ActionIcon>
                            )}
                        </>
                    )}
                </Box>
            )}

            {/* 💬 댓글 입력 바텀시트 모달 */}
            {replyingTo && (
                <>
                    {/* 배경 오버레이 */}
                    <Box
                        pos="fixed"
                        top={0}
                        left={0}
                        w="100%"
                        h="100%"
                        style={{
                            zIndex: 9998,
                            backgroundColor: 'rgba(0,0,0,0.4)',
                        }}
                        onClick={() => {
                            setReplyingTo(null);
                            setReplyContent('');
                            setReplyPhotos([]);
                            setReplyNickname('');
                            setReplyPassword('');
                        }}
                    />
                    {/* 바텀시트 */}
                    <Box
                        pos="fixed"
                        bottom={0}
                        left={0}
                        w="100%"
                        style={{
                            zIndex: 9999,
                            backgroundColor: 'white',
                            borderRadius: '16px 16px 0 0',
                            boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
                            animation: 'slideUp 0.15s ease-out',
                            maxHeight: '80vh',
                            overflowY: 'auto',
                        }}
                    >
                        {/* 드래그 핸들 */}
                        <Box ta="center" pt={8} pb={4}>
                            <Box
                                mx="auto"
                                w={40}
                                h={4}
                                style={{ backgroundColor: '#dee2e6', borderRadius: 2 }}
                            />
                        </Box>

                        <Box p="md" pt={4}>
                            {/* 제목 */}
                            <Group justify="space-between" mb="md">
                                <Text fw={600} size="md">댓글 작성</Text>
                                <ActionIcon
                                    variant="transparent"
                                    color="gray"
                                    onClick={() => {
                                        setReplyingTo(null);
                                        setReplyContent('');
                                        setReplyPhotos([]);
                                        setReplyNickname('');
                                        setReplyPassword('');
                                    }}
                                >
                                    <X size={20} />
                                </ActionIcon>
                            </Group>

                            {/* 닉네임 + 비밀번호 */}
                            <Group gap="xs" mb="sm">
                                <TextInput
                                    placeholder="닉네임"
                                    size="sm"
                                    value={replyNickname}
                                    onChange={(e) => setReplyNickname(e.currentTarget.value)}
                                    style={{ flex: 1 }}
                                    styles={{
                                        input: {
                                            fontSize: '14px',
                                            borderRadius: '10px',
                                            backgroundColor: '#f8f9fa',
                                            border: '1px solid #e9ecef',
                                        }
                                    }}
                                />
                                <TextInput
                                    placeholder="비밀번호"
                                    size="sm"
                                    type="password"
                                    value={replyPassword}
                                    onChange={(e) => setReplyPassword(e.currentTarget.value)}
                                    style={{ flex: 1 }}
                                    styles={{
                                        input: {
                                            fontSize: '14px',
                                            borderRadius: '10px',
                                            backgroundColor: '#f8f9fa',
                                            border: '1px solid #e9ecef',
                                        }
                                    }}
                                />
                            </Group>

                            {/* 댓글 내용 */}
                            <Textarea
                                placeholder="댓글을 입력하세요"
                                size="sm"
                                minRows={3}
                                maxRows={5}
                                autosize
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.currentTarget.value)}
                                styles={{
                                    input: {
                                        fontSize: '14px',
                                        borderRadius: '10px',
                                        backgroundColor: '#f8f9fa',
                                        border: '1px solid #e9ecef',
                                    }
                                }}
                            />

                            {/* 이미지 미리보기 */}
                            {replyPhotos.length > 0 && (
                                <Group gap={8} mt="sm">
                                    {replyPhotos.map((photo, idx) => (
                                        <Box key={idx} pos="relative" style={{ borderRadius: '10px', overflow: 'hidden' }}>
                                            <img src={photo} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: '10px', border: '1px solid #e9ecef' }} />
                                            <ActionIcon
                                                variant="filled"
                                                color="dark"
                                                size={18}
                                                radius="xl"
                                                pos="absolute"
                                                top={4}
                                                right={4}
                                                onClick={() => setReplyPhotos(prev => prev.filter((_, i) => i !== idx))}
                                            >
                                                <X size={10} />
                                            </ActionIcon>
                                        </Box>
                                    ))}
                                </Group>
                            )}

                            {/* 하단 액션 바 */}
                            <Group justify="space-between" mt="md" pb="env(safe-area-inset-bottom, 8px)">
                                <Group gap={6}>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        ref={replyFileInputRef}
                                        style={{ display: 'none' }}
                                        onChange={handleReplyPhotoUpload}
                                    />
                                    <ActionIcon
                                        variant="light"
                                        color="gray"
                                        size="lg"
                                        radius="xl"
                                        onClick={() => replyFileInputRef.current?.click()}
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#868e96' }}>photo_camera</span>
                                    </ActionIcon>
                                    <Text size="xs" c="dimmed">{replyPhotos.length}/3</Text>
                                </Group>

                                <Button
                                    size="sm"
                                    variant="filled"
                                    color="#1D0098"
                                    radius="xl"
                                    px="xl"
                                    onClick={() => handleSubmitReply(replyingTo)}
                                    disabled={!replyContent.trim() || !replyNickname.trim() || !replyPassword.trim()}
                                    styles={{
                                        root: {
                                            fontWeight: 600,
                                            '&:disabled': { backgroundColor: '#e9ecef', color: '#adb5bd' }
                                        }
                                    }}
                                >
                                    등록
                                </Button>
                            </Group>
                        </Box>
                    </Box>
                    <style>{`
                        @keyframes slideUp {
                            from { transform: translateY(100%); }
                            to { transform: translateY(0); }
                        }
                    `}</style>
                </>
            )}

            {/* 🔒 리뷰(이야기) 삭제 바텀시트 */}
            {deleteReviewModal && (
                <>
                    <Box
                        pos="fixed" top={0} left={0} w="100%" h="100%"
                        style={{ zIndex: 9998, backgroundColor: 'rgba(0,0,0,0.4)' }}
                        onClick={() => setDeleteReviewModal(null)}
                    />
                    <Box
                        pos="fixed" bottom={0} left={0} w="100%"
                        p="lg" pb={40}
                        style={{
                            zIndex: 9999, backgroundColor: 'white',
                            borderRadius: '16px 16px 0 0',
                            boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
                            animation: 'slideUp 0.15s ease-out',
                        }}
                    >
                        {/* 드래그 핸들 */}
                        <Box mx="auto" mb="md" w={36} h={4} style={{ borderRadius: 2, backgroundColor: '#dee2e6' }} />
                        <Group justify="space-between" mb="md">
                            <Text fw={600} size="lg">이야기 삭제</Text>
                            <ActionIcon variant="subtle" color="gray" onClick={() => setDeleteReviewModal(null)}>
                                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
                            </ActionIcon>
                        </Group>
                        <Text size="sm" c="dimmed" mb="md">이야기를 삭제하려면 비밀번호를 입력하세요.</Text>
                        <TextInput
                            placeholder="비밀번호"
                            type="password"
                            value={deleteReviewPassword}
                            onChange={(e) => {
                                setDeleteReviewPassword(e.currentTarget.value);
                                setDeleteReviewError('');
                            }}
                            error={deleteReviewError}
                            onKeyDown={(e) => e.key === 'Enter' && handleDeleteReview()}
                            mb="md"
                            styles={{ input: { borderRadius: 12, height: 44 } }}
                        />
                        <Group grow gap="sm">
                            <Button variant="light" color="gray" size="md" radius="xl" onClick={() => setDeleteReviewModal(null)}>
                                취소
                            </Button>
                            <Button variant="filled" color="dark.6" size="md" radius="xl" onClick={handleDeleteReview}>
                                삭제하기
                            </Button>
                        </Group>
                    </Box>
                    <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
                </>
            )}

            {/* 🔒 댓글 삭제 바텀시트 */}
            {deleteReplyModal && (
                <>
                    <Box
                        pos="fixed" top={0} left={0} w="100%" h="100%"
                        style={{ zIndex: 9998, backgroundColor: 'rgba(0,0,0,0.4)' }}
                        onClick={() => setDeleteReplyModal(null)}
                    />
                    <Box
                        pos="fixed" bottom={0} left={0} w="100%"
                        p="lg" pb={40}
                        style={{
                            zIndex: 9999, backgroundColor: 'white',
                            borderRadius: '16px 16px 0 0',
                            boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
                            animation: 'slideUp 0.15s ease-out',
                        }}
                    >
                        {/* 드래그 핸들 */}
                        <Box mx="auto" mb="md" w={36} h={4} style={{ borderRadius: 2, backgroundColor: '#dee2e6' }} />
                        <Group justify="space-between" mb="md">
                            <Text fw={600} size="lg">댓글 삭제</Text>
                            <ActionIcon variant="subtle" color="gray" onClick={() => setDeleteReplyModal(null)}>
                                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
                            </ActionIcon>
                        </Group>
                        <Text size="sm" c="dimmed" mb="md">댓글을 삭제하려면 비밀번호를 입력하세요.</Text>
                        <TextInput
                            placeholder="비밀번호"
                            type="password"
                            value={deleteReplyPassword}
                            onChange={(e) => {
                                setDeleteReplyPassword(e.currentTarget.value);
                                setDeleteReplyError('');
                            }}
                            error={deleteReplyError}
                            onKeyDown={(e) => e.key === 'Enter' && handleDeleteReply()}
                            mb="md"
                            styles={{ input: { borderRadius: 12, height: 44 } }}
                        />
                        <Group grow gap="sm">
                            <Button variant="light" color="gray" size="md" radius="xl" onClick={() => setDeleteReplyModal(null)}>
                                취소
                            </Button>
                            <Button variant="filled" color="dark.6" size="md" radius="xl" onClick={handleDeleteReply}>
                                삭제하기
                            </Button>
                        </Group>
                    </Box>
                    <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
                </>
            )}
        </Box >
    );
}

