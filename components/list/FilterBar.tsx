'use client';

import { Group, Text, SegmentedControl } from '@mantine/core';

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

export default function FilterBar({ sortBy, setSortBy, totalCount, institutionFilter, setInstitutionFilter, regionName }: FilterBarProps) {
    return (
        <Group
            p="sm"
            bg="white"
            style={{ borderBottom: '1px solid #e9ecef', zIndex: 10 }}
            justify="space-between"
        >
            {/* 왼쪽: 현재 지역명 */}
            <Text size="sm" fw={600} c="dark">
                {regionName || '전체 지역'}
            </Text>

            {/* 오른쪽: 공설/사설 필터 */}
            <SegmentedControl
                size="xs"
                value={institutionFilter}
                onChange={(v) => setInstitutionFilter(v as 'all' | 'public' | 'private')}
                data={[
                    { value: 'all', label: '전체' },
                    { value: 'public', label: '공설' },
                    { value: 'private', label: '사설' }
                ]}
                styles={{
                    root: { backgroundColor: '#f1f3f5' },
                }}
            />
        </Group>
    );
}
