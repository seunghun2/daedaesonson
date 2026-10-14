'use client';

import { Box, Group, Text, SegmentedControl } from '@mantine/core';

interface FilterBarProps {
    sortBy: string;
    setSortBy: (val: string) => void;
    totalCount: number;
    institutionFilter: 'all' | 'public' | 'private';
    setInstitutionFilter: (val: 'all' | 'public' | 'private') => void;
    regionName?: string;
    hideInquiry?: boolean;
    setHideInquiry?: (val: boolean) => void;
}

const SORT_OPTIONS = [
    { value: 'recommend', label: '추천순' },
    { value: 'price_asc', label: '낮은가격순' },
    { value: 'price_desc', label: '높은가격순' },
];

export default function FilterBar({
    sortBy,
    setSortBy,
    totalCount,
    institutionFilter,
    setInstitutionFilter,
    regionName,
}: FilterBarProps) {
    return (
        <Box bg="white" style={{ borderBottom: '1px solid #E5E8EB', zIndex: 10 }}>
            {/* 상단: 현재 지역명 + 개수 & 공설/사설 세그먼트 */}
            <Group px={16} py={11} justify="space-between" wrap="nowrap">
                <Group gap={6} align="baseline" wrap="nowrap" style={{ minWidth: 0 }}>
                    <Text
                        fw={700}
                        style={{
                            fontSize: '15px',
                            color: '#191F28',
                            letterSpacing: '-0.3px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}
                    >
                        {regionName || '지도 주변 시설'}
                    </Text>
                    <Text
                         component="span"
                        fw={800}
                        style={{
                            fontSize: '14px',
                            color: '#191F28',
                            letterSpacing: '-0.3px',
                            flexShrink: 0,
                        }}
                    >
                        {totalCount.toLocaleString()}곳
                    </Text>
                </Group>

                <SegmentedControl
                    size="xs"
                    radius="md"
                    value={institutionFilter}
                    onChange={(v) => setInstitutionFilter(v as 'all' | 'public' | 'private')}
                    data={[
                        { value: 'all', label: '전체' },
                        { value: 'public', label: '공설' },
                        { value: 'private', label: '사설' },
                    ]}
                    styles={{
                        root: {
                            backgroundColor: '#F2F4F6',
                            padding: '3px',
                            border: 'none',
                        },
                        label: {
                            fontSize: '12px',
                            fontWeight: 600,
                            padding: '4px 10px',
                        },
                    }}
                />
            </Group>

            {/* 하단: 호갱노노/네이버부동산 스타일 정렬 바 */}
            <Group
                px={16}
                py={8}
                justify="space-between"
                style={{
                    backgroundColor: '#F8FAFC',
                    borderTop: '1px solid #F2F4F6',
                }}
            >
                <Group gap={14}>
                    {SORT_OPTIONS.map((opt) => {
                        const isActive = sortBy === opt.value;
                        return (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => setSortBy(opt.value)}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    background: 'none',
                                    border: 'none',
                                    padding: 0,
                                    cursor: 'pointer',
                                    fontSize: '12.5px',
                                    fontWeight: isActive ? 700 : 500,
                                    color: isActive ? '#191F28' : '#8B95A1',
                                    letterSpacing: '-0.2px',
                                    transition: 'color 0.15s ease',
                                }}
                            >
                                <span
                                    style={{
                                        width: '5px',
                                        height: '5px',
                                        borderRadius: '50%',
                                        backgroundColor: isActive ? '#191F28' : 'transparent',
                                        transition: 'background-color 0.15s ease',
                                    }}
                                />
                                {opt.label}
                            </button>
                        );
                    })}
                </Group>
            </Group>
        </Box>
    );
}

