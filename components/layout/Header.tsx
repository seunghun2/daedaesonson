'use client';

import { Group, Text, TextInput, ActionIcon, Container, Tabs, Box } from '@mantine/core';
import { Search } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface HeaderProps {
    activeTab: string;
    onTabChange: (value: string) => void;
}

export default function Header({ activeTab, onTabChange }: HeaderProps) {
    return (
        <Box style={{ borderBottom: '1px solid #e9ecef', height: 60, backgroundColor: 'white' }}>
            <Container fluid h="100%" px="md">
                <Group h="100%" justify="space-between" wrap="nowrap">
                    {/* 로고 및 서비스명 */}
                    {/* 로고 및 서비스명 */}
                    <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                        <Image
                            src="/logo-horizontal.svg?v=4"
                            alt="대대손손"
                            width={105}
                            height={30}
                            style={{ objectFit: 'contain' }}
                            priority
                        />
                    </Link>

                    {/* 중앙 검색창 (PC에서만 넓게, 모바일은 작게) */}
                    <Box style={{ flex: 1, maxWidth: 500 }} mx="md">
                        <TextInput
                            placeholder="지역, 시설명 검색"
                            leftSection={<Search size={16} />}
                            radius="xl"
                            styles={{ input: { backgroundColor: '#f1f3f5', border: 'none' } }}
                        />
                    </Box>

                    {/* 우측 탭 (카테고리) - PC에서는 글자, 모바일은 공간 부족하면 숨기거나 아이콘화 */}
                    <Tabs
                        value={activeTab}
                        onChange={(v) => onTabChange(v || 'all')}
                        variant="pills"
                        radius="xl"
                        visibleFrom="sm" // 모바일에서는 일단 숨김 (공간 부족)
                    >
                        <Tabs.List>
                            <Tabs.Tab value="all">전체</Tabs.Tab>
                            <Tabs.Tab value="charnel">봉안당</Tabs.Tab>
                            <Tabs.Tab value="natural">수목장</Tabs.Tab>
                            <Tabs.Tab value="park">공원묘지</Tabs.Tab>
                        </Tabs.List>
                    </Tabs>

                    {/* 모바일용 메뉴 버튼 (필요시 추가) */}
                </Group>
            </Container>
        </Box>
    );
}
