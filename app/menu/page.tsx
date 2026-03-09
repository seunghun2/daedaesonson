'use client';

import { Box, Text, Group, Stack } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { Home, MessageCircle, Clock, Info, HelpCircle, FileText, Mail, Shield, BookOpen, Briefcase, Search, Settings, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import BottomNav from '@/components/common/BottomNav';
import { useAuth } from '@/components/auth/AuthProvider';
import LoginModal from '@/components/auth/LoginModal';
import { useState } from 'react';

export default function MenuPage() {
    const router = useRouter();
    const { user, profile, signOut } = useAuth();
    const [showLogin, setShowLogin] = useState(false);

    const displayName = profile?.nickname || user?.user_metadata?.name || '사용자';
    const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;

    const serviceItems = [
        { label: '홈', icon: Home, path: '/', description: '지도에서 시설 찾기' },
        { label: '문의하기', icon: MessageCircle, path: '/inquiries', description: '문의 목록 보기' },
        { label: '기록', icon: Clock, path: '/history', description: '최근 본 시설' },
    ];

    const infoItems = [
        { label: '서비스 안내', icon: Info, path: '/about' },
        { label: '용어 가이드', icon: BookOpen, path: '/glossary' },
        { label: '자주 묻는 질문', icon: HelpCircle, path: '/faq' },
    ];

    const legalItems = [
        { label: '이용약관', path: '/terms' },
        { label: '개인정보 처리방침', path: '/privacy' },
    ];

    return (
        <Box style={{ minHeight: '100dvh', backgroundColor: '#f8f9fa', paddingBottom: 70 }}>
            {/* 헤더 */}
            <Box
                px="lg"
                py="md"
                style={{
                    backgroundColor: 'white',
                    borderBottom: '1px solid #e9ecef',
                    position: 'sticky',
                    top: 0,
                    zIndex: 100,
                }}
            >
                <Group justify="space-between" align="center">
                    <Text size="lg" fw={700}>전체</Text>
                    <Group gap="lg">
                        <Search size={20} color="#495057" style={{ cursor: 'pointer' }} onClick={() => router.push('/search')} />
                        <Settings size={20} color="#495057" style={{ cursor: 'pointer' }} />
                    </Group>
                </Group>
            </Box>

            {/* 로그인 영역 */}
            <Box p="md">
                {!user ? (
                    /* 비로그인 상태 */
                    <Box
                        p="xl"
                        ta="center"
                        bg="white"
                        style={{ borderRadius: 16 }}
                    >
                        <Box
                            style={{
                                width: 60,
                                height: 60,
                                borderRadius: '50%',
                                backgroundColor: '#f1f3f5',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 16px',
                            }}
                        >
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#adb5bd" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                        </Box>
                        <Text size="md" fw={600} c="dark.7" mb={4}>
                            로그인하면 더 많은 기능을
                        </Text>
                        <Text size="md" fw={600} c="dark.7" mb="lg">
                            이용하실 수 있어요.
                        </Text>
                        <button
                            onClick={() => setShowLogin(true)}
                            style={{
                                backgroundColor: '#1D0098',
                                color: 'white',
                                border: 'none',
                                borderRadius: 8,
                                padding: '12px 32px',
                                fontSize: 14,
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'opacity 0.2s',
                            }}
                        >
                            로그인 하기
                        </button>
                    </Box>
                ) : (
                    /* 로그인 상태 */
                    <Box
                        p="lg"
                        bg="white"
                        style={{ borderRadius: 16, cursor: 'pointer' }}
                        onClick={() => router.push('/myinfo')}
                    >
                        <Group gap="md" wrap="nowrap">
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt={displayName}
                                    width={48}
                                    height={48}
                                    style={{ borderRadius: '50%', objectFit: 'cover' }}
                                />
                            ) : (
                                <Box
                                    style={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: '50%',
                                        backgroundColor: '#1D0098',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                    }}
                                >
                                    <Text c="white" fw={700} size="lg">
                                        {displayName.charAt(0)}
                                    </Text>
                                </Box>
                            )}
                            <Box style={{ flex: 1 }}>
                                <Text size="md" fw={700}>{displayName}</Text>
                                <Text size="xs" c="dimmed">
                                    {profile?.provider === 'kakao' ? '카카오 로그인' : '휴대전화 로그인'}
                                </Text>
                            </Box>
                            <ChevronRight size={18} color="#adb5bd" />
                        </Group>
                    </Box>
                )}
            </Box>

            {/* 서비스 메뉴 */}
            <Box px="md" pb="md">
                <Text size="xs" c="dimmed" mb={8} fw={600} px={4}>서비스</Text>
                <Stack gap={0} bg="white" style={{ borderRadius: 12, overflow: 'hidden' }}>
                    {serviceItems.map((item, idx) => {
                        const Icon = item.icon;
                        return (
                            <Box
                                key={item.path}
                                px="md"
                                py={14}
                                style={{
                                    borderBottom: idx < serviceItems.length - 1 ? '1px solid #f1f3f5' : 'none',
                                    cursor: 'pointer',
                                }}
                                onClick={() => router.push(item.path)}
                            >
                                <Group gap="md" wrap="nowrap" justify="space-between">
                                    <Group gap="md" wrap="nowrap">
                                        <Box
                                            style={{
                                                width: 36,
                                                height: 36,
                                                borderRadius: 10,
                                                backgroundColor: '#f0f0ff',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                            }}
                                        >
                                            <Icon size={18} color="#1D0098" />
                                        </Box>
                                        <Box>
                                            <Text size="sm" fw={600}>{item.label}</Text>
                                            <Text size="xs" c="dimmed">{item.description}</Text>
                                        </Box>
                                    </Group>
                                    <ChevronRight size={16} color="#ced4da" />
                                </Group>
                            </Box>
                        );
                    })}
                </Stack>
            </Box>

            {/* 고객센터 */}
            <Box px="md" pb="md">
                <Text size="xs" c="dimmed" mb={8} fw={600} px={4}>고객센터</Text>
                <Stack gap={0} bg="white" style={{ borderRadius: 12, overflow: 'hidden' }}>
                    {infoItems.map((item, idx) => {
                        const Icon = item.icon;
                        return (
                            <Box
                                key={item.path}
                                px="md"
                                py={14}
                                style={{
                                    borderBottom: idx < infoItems.length - 1 ? '1px solid #f1f3f5' : 'none',
                                    cursor: 'pointer',
                                }}
                                onClick={() => router.push(item.path)}
                            >
                                <Group gap="md" wrap="nowrap">
                                    <Icon size={18} color="#868e96" />
                                    <Text size="sm" c="dark.6">{item.label}</Text>
                                </Group>
                            </Box>
                        );
                    })}
                    <Box
                        px="md"
                        py={14}
                        style={{ cursor: 'pointer' }}
                        onClick={() => router.push('/contact')}
                    >
                        <Group gap="md" wrap="nowrap">
                            <Mail size={18} color="#868e96" />
                            <Text size="sm" c="dark.6">문의하기</Text>
                        </Group>
                    </Box>
                    <Box
                        px="md"
                        py={14}
                        style={{ borderTop: '1px solid #f1f3f5', cursor: 'pointer' }}
                        onClick={() => router.push('/partnership')}
                    >
                        <Group gap="md" wrap="nowrap">
                            <Briefcase size={18} color="#868e96" />
                            <Text size="sm" c="dark.6">광고/제휴 문의</Text>
                        </Group>
                    </Box>
                </Stack>
            </Box>

            {/* 법적 정보 + 로그아웃 */}
            <Box px="md" pb="md">
                <Group gap="md" justify="center" py="sm">
                    {legalItems.map((item, idx) => (
                        <span key={item.path}>
                            <Text
                                component="span"
                                size="xs"
                                c="dimmed"
                                style={{ cursor: 'pointer' }}
                                onClick={() => router.push(item.path)}
                            >
                                {item.label}
                            </Text>
                            {idx < legalItems.length - 1 && (
                                <Text component="span" size="xs" c="dimmed" mx={8}>·</Text>
                            )}
                        </span>
                    ))}
                </Group>

                {user && (
                    <Box ta="center" mt="xs">
                        <button
                            onClick={signOut}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#adb5bd',
                                fontSize: 13,
                                cursor: 'pointer',
                                textDecoration: 'underline',
                            }}
                        >
                            로그아웃
                        </button>
                    </Box>
                )}
            </Box>

            {/* 버전 정보 */}
            <Box ta="center" pb="xl">
                <Text size="xs" c="dimmed">대대손손 v1.0.0</Text>
            </Box>

            {/* 로그인 모달 */}
            <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />

            {/* 하단 탭바 */}
            <BottomNav />
        </Box>
    );
}
