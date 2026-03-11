'use client';

import { AppShell, Burger, Group, NavLink, Text, Avatar, Box, ThemeIcon, ActionIcon, Tooltip, TextInput, Button, Paper, Stack, PasswordInput } from '@mantine/core';
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
    MessageCircle as IconMessage,
    PhoneCall as IconPhoneCall,
    Briefcase as IconBriefcase,
    Star as IconStar,
    FileEdit as IconFileEdit,
    Lock as IconLock,
    BookOpen as IconBlog
} from 'lucide-react';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [opened, { toggle, close }] = useDisclosure();
    const [collapsed, setCollapsed] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null); // null = 확인 중
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [loginLoading, setLoginLoading] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const isMobile = useMediaQuery('(max-width: 768px)', undefined, { getInitialValueInEffect: true });

    // 인증 상태 확인
    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            // admin API를 호출해서 401이면 미인증
            const res = await fetch('/api/admin/faqs', { method: 'GET' });
            setIsAuthenticated(res.ok);
        } catch {
            setIsAuthenticated(false);
        }
    };

    // 로그인
    const handleLogin = async () => {
        setLoginLoading(true);
        setLoginError('');
        try {
            const res = await fetch('/api/admin/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });

            if (res.ok) {
                setIsAuthenticated(true);
                setPassword('');
            } else {
                setLoginError('비밀번호가 올바르지 않습니다.');
            }
        } catch {
            setLoginError('로그인 중 오류가 발생했습니다.');
        } finally {
            setLoginLoading(false);
        }
    };

    // 로그아웃
    const handleLogout = async () => {
        await fetch('/api/admin/auth', { method: 'DELETE' });
        setIsAuthenticated(false);
        setPassword('');
    };

    // localStorage에서 사이드바 상태 불러오기
    useEffect(() => {
        const saved = localStorage.getItem('adminSidebarCollapsed');
        if (saved === 'true') setCollapsed(true);
    }, []);

    const toggleCollapsed = () => {
        const newValue = !collapsed;
        setCollapsed(newValue);
        localStorage.setItem('adminSidebarCollapsed', String(newValue));
    };

    // 로딩 중
    if (isAuthenticated === null) {
        return (
            <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f8f9fa' }}>
                <Text c="dimmed">확인 중...</Text>
            </Box>
        );
    }

    // 미인증 → 로그인 폼
    if (!isAuthenticated) {
        return (
            <Box style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #1a1b2e 0%, #16213e 50%, #0f3460 100%)',
            }}>
                <Paper shadow="xl" p="xl" radius="lg" w={380} style={{
                    background: 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(20px)',
                }}>
                    <Stack align="center" gap="lg">
                        <ThemeIcon size={60} radius="xl" color="blue" variant="light">
                            <IconLock size={28} />
                        </ThemeIcon>
                        <div style={{ textAlign: 'center' }}>
                            <Text size="xl" fw={800}>관리자 로그인</Text>
                            <Text size="sm" c="dimmed" mt={4}>대대손손 관리자 페이지</Text>
                        </div>

                        <PasswordInput
                            placeholder="비밀번호를 입력하세요"
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setLoginError(''); }}
                            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                            error={loginError}
                            w="100%"
                            size="md"
                        />

                        <Button
                            fullWidth
                            size="md"
                            onClick={handleLogin}
                            loading={loginLoading}
                            color="blue"
                            radius="md"
                        >
                            로그인
                        </Button>
                    </Stack>
                </Paper>
            </Box>
        );
    }

    // 인증됨 → 어드민 대시보드
    const navItems = [
        { label: '대시보드', icon: IconDashboard, link: '/admin' },
        { label: '회원 관리', icon: IconBriefcase, link: '/admin/members' },
        { label: '시설 데이터 관리', icon: IconDatabase, link: '/admin/upload' },
        { label: '상담신청관리', icon: IconPhoneCall, link: '/admin/consults' },
        { label: '댓글문의관리', icon: IconMessage, link: '/admin/inquiries' },
        { label: '정보수정요청', icon: IconFileEdit, link: '/admin/corrections' },
        { label: '방문후기관리', icon: IconStar, link: '/admin/reviews' },
        { label: '제휴문의관리', icon: IconBriefcase, link: '/admin/partnership' },
        { label: '블로그 관리', icon: IconBlog, link: '/admin/blog' },
        { label: '설정', icon: IconSettings, link: '/admin/settings' },
    ];

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
                            component={Link}
                            href={item.link}
                            prefetch={true}
                            label={collapsed ? '' : item.label}
                            leftSection={<item.icon size={20} strokeWidth={1.5} />}
                            active={pathname === item.link}
                            variant="filled"
                            color="blue"
                            onClick={() => { if (isMobile) close(); }}
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
                        onClick={handleLogout}
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
