'use client';

import { Group, Button, Select } from '@mantine/core';
import { ArrowDownUp, Filter as FilterIcon } from 'lucide-react';

interface FilterBarProps {
    sortBy: string;
    setSortBy: (val: string) => void;
    totalCount: number;
}

export default function FilterBar({ sortBy, setSortBy, totalCount }: FilterBarProps) {
    return (
        <Group
            p="sm"
            bg="white"
            style={{ borderBottom: '1px solid #e9ecef', zIndex: 10 }}
            justify="space-between"
        >
            <Group gap="xs">
                <Button
                    variant="default"
                    size="xs"
                    leftSection={<ArrowDownUp size={14} />}
                    radius="xl"
                    onClick={() => setSortBy(sortBy === 'price' ? 'rating' : 'price')}
                >
                    {sortBy === 'price' ? '가격순' : '평점순'}
                </Button>
                <Button
                    variant="default"
                    size="xs"
                    leftSection={<FilterIcon size={14} />}
                    radius="xl"
                >
                    필터
                </Button>
            </Group>

            <Select
                size="xs"
                w={100}
                value={sortBy}
                onChange={(v) => v && setSortBy(v)}
                data={[
                    { value: 'rating', label: '평점 높은순' },
                    { value: 'price', label: '가격 낮은순' },
                    { value: 'review', label: '리뷰 많은순' },
                ]}
                styles={{ input: { borderRadius: '20px' } }}
            />
        </Group>
    );
}
