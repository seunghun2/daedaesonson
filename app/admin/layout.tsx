'use client';

import { AppShell, Burger, Group, NavLink, Text, Avatar, Box, rem, ThemeIcon } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
// Use Lucide icons only
import {
    LayoutDashboard as IconDashboard,
    Database as IconDatabase,
    Upload as IconUpload,
    Settings as IconSettings,
    LogOut as IconLogout,
    MapPin
} from 'lucide-react';

import { usePathname, useRouter } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [opened, { toggle }] = useDisclosure();
    const pathname = usePathname();
    const router = useRouter();

    const navItems = [
        { label: '대시보드', icon: IconDashboard, link: '/admin' },
        // { label: '시설 데이터 관리', icon: IconDatabase, link: '/admin/facilities' }, // Deprecated
        { label: '시설 데이터 관리', icon: IconDatabase, link: '/admin/upload' }, // Now the main management page
        { label: '설정', icon: IconSettings, link: '/admin/settings' },
    ];

    return (
        <AppShell
            header={{ height: 60 }}
            navbar={{ width: 260, breakpoint: 'sm', collapsed: { mobile: !opened } }}
            padding="md"
            layout="alt" // 사이드바가 헤더까지 차지하는 스타일
        >
            <AppShell.Header>
                <Group h="100%" px="md" justify="space-between">
                    <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
                    <Text size="lg" fw={700} visibleFrom="sm">관리자 페이지</Text>
                    <Group>
                        <Avatar color="blue" radius="xl">AD</Avatar>
                        <Box visibleFrom="sm">
                            <Text size="sm" fw={500}>Super Admin</Text>
                            <Text size="xs" c="dimmed">master@daedaesonson.com</Text>
                        </Box>
                    </Group>
                </Group>
            </AppShell.Header>

            <AppShell.Navbar p="md" bg="dark.7" style={{ borderRight: 'none', color: 'white' }}>
                <Group mb={40} mt={10} px="xs" style={{ cursor: 'pointer' }} onClick={() => router.push('/')}>
                    <ThemeIcon size="lg" radius="md" color="blue" variant="filled">
                        <MapPin size={20} color="white" />
                    </ThemeIcon>
                    <Text size="xl" fw={900} c="white" style={{ fontFamily: 'Pretendard' }}>대대손손</Text>
                </Group>

                {navItems.map((item) => (
                    <NavLink
                        key={item.link}
                        label={item.label}
                        leftSection={<item.icon size={20} strokeWidth={1.5} />}
                        href={item.link}
                        active={pathname === item.link}
                        variant="filled"
                        color="blue"
                        onClick={(e) => {
                            e.preventDefault();
                            router.push(item.link);
                        }}
                        styles={{
                            root: { color: '#adb5bd', borderRadius: 8, marginBottom: 4 },
                            label: { fontSize: 15, fontWeight: 500 },
                        }}
                    />
                ))}

                <Box style={{ flex: 1 }} />

                <NavLink
                    label="로그아웃"
                    leftSection={<IconLogout size={20} strokeWidth={1.5} />}
                    variant="subtle"
                    color="red"
                    c="red.4"
                    onClick={() => alert('로그아웃 되었습니다.')}
                    styles={{ root: { borderRadius: 8 } }}
                />
            </AppShell.Navbar>

            <AppShell.Main bg="gray.0">
                {children}
            </AppShell.Main>
        </AppShell>
    );
}
