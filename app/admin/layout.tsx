'use client';

import { AppShell, Burger, Group, NavLink, Text, Avatar, Box, ThemeIcon, ActionIcon, Tooltip, Button, Paper, Stack, PasswordInput, ScrollArea, Divider, Badge } from '@mantine/core';
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
    BookOpen as IconBlog,
    Bot as IconBot,
    Gift as IconGift,
    List as IconList,
    Table2 as IconTable,
    Users as IconUsers
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
            const res = await fetch('/api/admin/auth', { method: 'GET' });
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
            <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0F172A' }}>
                <Text c="gray.4" size="sm" fw={500}>인증 상태 확인 중...</Text>
            </Box>
        );
    }

    // 미인증 → 로그인 폼
    if (!isAuthenticated) {
        return (
            <Box style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            }}>
                <Paper shadow="xl" p="xl" radius="lg" w={390} style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                }}>
                    <Stack align="center" gap="lg">
                        <ThemeIcon size={60} radius="xl" style={{ backgroundColor: '#EFF6FF', color: '#2563EB' }}>
                            <IconLock size={28} />
                        </ThemeIcon>
                        <div style={{ textAlign: 'center' }}>
                            <Text size="xl" fw={800} c="#0F172A">관리자 로그인</Text>
                            <Text size="sm" c="dimmed" mt={4}>대대손손 통합 어드민 센터</Text>
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
                            radius="md"
                            style={{ backgroundColor: '#2563EB' }}
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
        { label: '시설 데이터 통합관리', icon: IconDatabase, link: '/admin/upload' },
        { label: '시설 빠른 목록', icon: IconList, link: '/admin/facilities' },
        { label: '가격 테이블 에디터', icon: IconTable, link: '/admin/pricing-v2' },
        { label: '상담신청 관리', icon: IconPhoneCall, link: '/admin/consults' },
        { label: '댓글문의 관리', icon: IconMessage, link: '/admin/inquiries' },
        { label: '정보수정 요청', icon: IconFileEdit, link: '/admin/corrections' },
        { label: '방문후기 관리', icon: IconStar, link: '/admin/reviews' },
        { label: '제휴문의 관리', icon: IconBriefcase, link: '/admin/partnership' },
        { label: '맞춤추천 관리', icon: IconGift, link: '/admin/recommendations' },
        { label: 'AI 상담 관리', icon: IconBot, link: '/admin/chat-logs' },
        { label: '회원 관리', icon: IconUsers, link: '/admin/members' },
        { label: '블로그 관리', icon: IconBlog, link: '/admin/blog' },
        { label: '설정', icon: IconSettings, link: '/admin/settings' },
    ];

    return (
        <AppShell
            header={{ height: 64 }}
            navbar={{
                width: collapsed ? 80 : 260,
                breakpoint: 'sm',
                collapsed: { mobile: !opened }
            }}
            padding={isMobile ? 'xs' : 'lg'}
            layout="alt"
        >
            <AppShell.Header style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E2E8F0' }}>
                <Group h="100%" px="lg" justify="space-between">
                    <Group gap="sm">
                        <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" color="#0F172A" />
                        <Text size="lg" fw={800} c="#0F172A" hiddenFrom="sm">관리자</Text>
                        <Group gap="xs" visibleFrom="sm">
                            <Text size="lg" fw={800} c="#0F172A">대대손손 어드민</Text>
                            <Badge size="xs" variant="light" color="blue" style={{ backgroundColor: '#EFF6FF', color: '#2563EB' }}>
                                ADMIN
                            </Badge>
                        </Group>
                    </Group>
                    <Group gap="sm">
                        <Avatar radius="xl" size={isMobile ? 'sm' : 'md'} style={{ backgroundColor: '#2563EB', color: '#FFFFFF', fontWeight: 700 }}>
                            AD
                        </Avatar>
                        <Box visibleFrom="sm">
                            <Text size="sm" fw={700} c="#0F172A" lh={1.2}>Super Admin</Text>
                            <Text size="xs" c="dimmed">master@daedaesonson.com</Text>
                        </Box>
                    </Group>
                </Group>
            </AppShell.Header>

            <AppShell.Navbar
                p="md"
                style={{
                    backgroundColor: '#0F172A',
                    borderRight: '1px solid #1E293B',
                    color: '#F8FAFC',
                    transition: 'width 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <Group
                    mb={24}
                    mt={6}
                    px="xs"
                    style={{ cursor: 'pointer' }}
                    onClick={() => { router.push('/'); if (isMobile) close(); }}
                    justify={collapsed ? 'center' : 'flex-start'}
                >
                    <ThemeIcon size={38} radius="md" style={{ backgroundColor: '#2563EB', color: '#FFFFFF' }}>
                        <MapPin size={20} color="#FFFFFF" />
                    </ThemeIcon>
                    {!collapsed && (
                        <div>
                            <Text size="lg" fw={900} c="#FFFFFF" lh={1.1} style={{ fontFamily: 'Pretendard', letterSpacing: '-0.3px' }}>
                                대대손손
                            </Text>
                            <Text size="11px" c="#94A3B8" fw={500}>
                                데이터 및 운영 관리
                            </Text>
                        </div>
                    )}
                </Group>

                <Divider color="#1E293B" mb="sm" />

                <ScrollArea style={{ flex: 1 }} scrollbarSize={4} offsetScrollbars>
                    <Stack gap={4}>
                        {navItems.map((item) => {
                            const isActive = item.link === '/admin'
                                ? pathname === '/admin'
                                : pathname === item.link || pathname?.startsWith(`${item.link}/`);
                            return (
                                <Tooltip key={item.link} label={item.label} position="right" disabled={!collapsed}>
                                    <NavLink
                                        component={Link}
                                        href={item.link}
                                        prefetch={true}
                                        label={collapsed ? '' : item.label}
                                        leftSection={<item.icon size={19} strokeWidth={isActive ? 2.2 : 1.7} />}
                                        active={isActive}
                                        variant="filled"
                                        onClick={() => { if (isMobile) close(); }}
                                        styles={{
                                            root: {
                                                color: isActive ? '#FFFFFF' : '#94A3B8',
                                                backgroundColor: isActive ? '#2563EB' : 'transparent',
                                                borderRadius: 8,
                                                padding: collapsed ? '10px 0' : '9px 12px',
                                                justifyContent: collapsed ? 'center' : 'flex-start',
                                                transition: 'all 0.15s ease',
                                            },
                                            label: {
                                                fontSize: 14,
                                                fontWeight: isActive ? 700 : 500,
                                                color: isActive ? '#FFFFFF' : '#CBD5E1',
                                            },
                                            section: {
                                                marginRight: collapsed ? 0 : 10,
                                                color: isActive ? '#FFFFFF' : '#94A3B8',
                                            },
                                        }}
                                    />
                                </Tooltip>
                            );
                        })}
                    </Stack>
                </ScrollArea>

                <Divider color="#1E293B" my="sm" />

                {/* 접기/펼치기 버튼 - PC only */}
                <Group justify="center" mb="xs" visibleFrom="sm">
                    <ActionIcon
                        variant="subtle"
                        size="lg"
                        onClick={toggleCollapsed}
                        style={{ color: '#94A3B8', backgroundColor: '#1E293B' }}
                    >
                        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                    </ActionIcon>
                </Group>

                <Tooltip label="로그아웃" position="right" disabled={!collapsed}>
                    <NavLink
                        label={collapsed ? '' : '로그아웃'}
                        leftSection={<IconLogout size={19} strokeWidth={1.7} />}
                        variant="subtle"
                        color="red"
                        onClick={handleLogout}
                        styles={{
                            root: {
                                borderRadius: 8,
                                color: '#F87171',
                                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                                justifyContent: collapsed ? 'center' : 'flex-start',
                                padding: collapsed ? '10px 0' : '9px 12px',
                            },
                            label: { fontSize: 14, fontWeight: 600, color: '#F87171' },
                            section: { marginRight: collapsed ? 0 : 10, color: '#F87171' },
                        }}
                    />
                </Tooltip>
            </AppShell.Navbar>

            <AppShell.Main style={{ backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
                {children}
            </AppShell.Main>
        </AppShell>
    );
}

