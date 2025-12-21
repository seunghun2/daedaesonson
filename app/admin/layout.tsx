'use client';

import { AppShell, Burger, Group, NavLink, Text, Avatar, Box, ThemeIcon, ActionIcon, Tooltip } from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { useState, useEffect } from 'react';
import {
    LayoutDashboard as IconDashboard,
    Database as IconDatabase,
    Settings as IconSettings,
    LogOut as IconLogout,
    MapPin,
    ChevronLeft,
    ChevronRight,
    MessageCircle as IconMessage
} from 'lucide-react';

import { usePathname, useRouter } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [opened, { toggle, close }] = useDisclosure();
    const [collapsed, setCollapsed] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    // SSR 시 undefined로 시작, useEffect에서 값 설정 (hydration mismatch 방지)
    const isMobile = useMediaQuery('(max-width: 768px)', undefined, { getInitialValueInEffect: true });

    // localStorage에서 상태 불러오기
    useEffect(() => {
        const saved = localStorage.getItem('adminSidebarCollapsed');
        if (saved === 'true') setCollapsed(true);
    }, []);

    // 상태 변경 시 저장
    const toggleCollapsed = () => {
        const newValue = !collapsed;
        setCollapsed(newValue);
        localStorage.setItem('adminSidebarCollapsed', String(newValue));
    };

    const navItems = [
        { label: '대시보드', icon: IconDashboard, link: '/admin' },
        { label: '시설 데이터 관리', icon: IconDatabase, link: '/admin/upload' },
        { label: '문의 관리', icon: IconMessage, link: '/admin/inquiries' },
        { label: '설정', icon: IconSettings, link: '/admin/settings' },
    ];

    const handleNavClick = (link: string) => {
        router.push(link);
        if (isMobile) close(); // 모바일에서 네비 클릭 후 자동 닫힘
    };

    return (
        <AppShell
            header={{ height: 60 }}
            navbar={{
                width: collapsed ? 80 : 260,
                breakpoint: 'sm',
                collapsed: { mobile: !opened }
            }}
            padding={isMobile ? 'xs' : 'md'}
            layout="alt"
        >
            <AppShell.Header>
                <Group h="100%" px="md" justify="space-between">
                    <Group gap="sm">
                        <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
                        <Text size="lg" fw={700} hiddenFrom="sm">관리자</Text>
                        <Text size="lg" fw={700} visibleFrom="sm">관리자 페이지</Text>
                    </Group>
                    <Group>
                        <Avatar color="blue" radius="xl" size={isMobile ? 'sm' : 'md'}>AD</Avatar>
                        <Box visibleFrom="sm">
                            <Text size="sm" fw={500}>Super Admin</Text>
                            <Text size="xs" c="dimmed">master@daedaesonson.com</Text>
                        </Box>
                    </Group>
                </Group>
            </AppShell.Header>

            <AppShell.Navbar p="md" bg="dark.7" style={{ borderRight: 'none', color: 'white', transition: 'width 0.2s ease' }}>
                <Group mb={40} mt={10} px="xs" style={{ cursor: 'pointer' }} onClick={() => { router.push('/'); if (isMobile) close(); }} justify={collapsed ? 'center' : 'flex-start'}>
                    <ThemeIcon size="lg" radius="md" color="blue" variant="filled">
                        <MapPin size={20} color="white" />
                    </ThemeIcon>
                    {!collapsed && <Text size="xl" fw={900} c="white" style={{ fontFamily: 'Pretendard' }}>대대손손</Text>}
                </Group>

                {navItems.map((item) => (
                    <Tooltip key={item.link} label={item.label} position="right" disabled={!collapsed}>
                        <NavLink
                            label={collapsed ? '' : item.label}
                            leftSection={<item.icon size={20} strokeWidth={1.5} />}
                            href={item.link}
                            active={pathname === item.link}
                            variant="filled"
                            color="blue"
                            onClick={(e) => {
                                e.preventDefault();
                                handleNavClick(item.link);
                            }}
                            styles={{
                                root: { color: '#adb5bd', borderRadius: 8, marginBottom: 4, justifyContent: collapsed ? 'center' : 'flex-start' },
                                label: { fontSize: 15, fontWeight: 500 },
                                section: { marginRight: collapsed ? 0 : undefined },
                            }}
                        />
                    </Tooltip>
                ))}

                <Box style={{ flex: 1 }} />

                {/* 접기/펼치기 버튼 - PC only */}
                <Group justify="center" mb="md" visibleFrom="sm">
                    <ActionIcon
                        variant="subtle"
                        color="gray"
                        size="lg"
                        onClick={toggleCollapsed}
                        style={{ color: '#adb5bd' }}
                    >
                        {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                    </ActionIcon>
                </Group>

                <Tooltip label="로그아웃" position="right" disabled={!collapsed}>
                    <NavLink
                        label={collapsed ? '' : '로그아웃'}
                        leftSection={<IconLogout size={20} strokeWidth={1.5} />}
                        variant="subtle"
                        color="red"
                        c="red.4"
                        onClick={() => alert('로그아웃 되었습니다.')}
                        styles={{ root: { borderRadius: 8, justifyContent: collapsed ? 'center' : 'flex-start' } }}
                    />
                </Tooltip>
            </AppShell.Navbar>

            <AppShell.Main bg="gray.0">
                {children}
            </AppShell.Main>
        </AppShell>
    );
}
