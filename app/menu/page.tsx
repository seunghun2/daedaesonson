'use client';

import { Box, Text, Group, Stack, ActionIcon } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { Home, MessageCircle, Clock, HelpCircle, FileText, Mail, BookOpen, Briefcase, Search, Settings, ChevronRight, User } from 'lucide-react';
import BottomNav from '@/components/common/BottomNav';
import { useAuth } from '@/components/auth/AuthProvider';
import LoginModal from '@/components/auth/LoginModal';
import { useState } from 'react';

export default function MenuPage() {
    const router = useRouter();
    const { user, profile } = useAuth();
    const [showLogin, setShowLogin] = useState(false);

    const displayName = profile?.nickname || user?.user_metadata?.name || '사용자';
    const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;

    const serviceItems = [
        { label: '대대손손 소개', icon: Home, path: '/about', description: '서비스 안내' },
        { label: '내 문의 내역', icon: MessageCircle, path: '/inquiries', description: '문의 목록 보기' },
        { label: '최근 본 시설', icon: Clock, path: '/history', description: '둘러본 시설 기록' },
        { label: '장례 가이드 블로그', icon: FileText, path: '/blog', description: '장례 절차·비용 정보' },
    ];

    const infoItems = [
        { label: '용어 가이드', icon: BookOpen, path: '/glossary' },
        { label: '자주 묻는 질문', icon: HelpCircle, path: '/faq' },
        { label: '1:1 문의하기', icon: Mail, path: '/contact' },
        { label: '광고/제휴 문의', icon: Briefcase, path: '/partnership' },
    ];

    const legalItems = [
        { label: '이용약관', path: '/terms' },
        { label: '개인정보 처리방침', path: '/privacy' },
    ];

    return (
        <Box
            style={{
                minHeight: '100dvh',
                backgroundColor: '#F2F4F6',
                paddingBottom: 'calc(76px + env(safe-area-inset-bottom))',
            }}
        >
            <Box style={{ maxWidth: 600, margin: '0 auto' }}>
                {/* 헤더 */}
                <Box
                    px="lg"
                    py={12}
                    style={{
                        backgroundColor: 'white',
                        borderBottom: '1px solid #E5E8EB',
                        position: 'sticky',
                        top: 0,
                        zIndex: 100,
                    }}
                >
                    <Group justify="space-between" align="center">
                        <Text size="lg" fw={800} c="#191F28" style={{ letterSpacing: '-0.3px' }}>
                            전체
                        </Text>
                        <Group gap={6}>
                            <ActionIcon
                                variant="subtle"
                                color="gray"
                                size={38}
                                radius="md"
                                onClick={() => router.push('/search')}
                                aria-label="검색"
                            >
                                <Search size={20} color="#191F28" />
                            </ActionIcon>
                            <ActionIcon
                                variant="subtle"
                                color="gray"
                                size={38}
                                radius="md"
                                onClick={() => {
                                    if (user) {
                                        router.push('/myinfo');
                                    } else {
                                        setShowLogin(true);
                                    }
                                }}
                                aria-label="설정"
                            >
                                <Settings size={20} color="#191F28" />
                            </ActionIcon>
                        </Group>
                    </Group>
                </Box>

                {/* 로그인 영역 */}
                <Box p="md">
                    {!user ? (
                        /* 비로그인 상태 */
                        <Box
                            p="xl"
                            bg="white"
                            style={{
                                borderRadius: 16,
                                border: '1px solid rgba(15, 23, 42, 0.05)',
                                textAlign: 'center',
                            }}
                        >
                            <Box
                                style={{
                                    width: 56,
                                    height: 56,
                                    borderRadius: '50%',
                                    backgroundColor: '#EFF6FF',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 14px',
                                }}
                            >
                                <User size={26} color="#2563EB" strokeWidth={2} />
                            </Box>
                            <Text size="md" fw={700} c="#191F28" mb={4} style={{ letterSpacing: '-0.3px' }}>
                                로그인하면 더 많은 기능을 이용할 수 있어요
                            </Text>
                            <Text size="xs" c="#6B7684" mb={18}>
                                관심 시설 저장과 상담 문의 내역을 간편하게 관리해보세요
                            </Text>
                            <button
                                onClick={() => setShowLogin(true)}
                                style={{
                                    backgroundColor: '#2563EB',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: 10,
                                    padding: '12px 32px',
                                    fontSize: 14,
                                    fontWeight: 700,
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
                            style={{
                                borderRadius: 16,
                                border: '1px solid rgba(15, 23, 42, 0.05)',
                                cursor: 'pointer',
                            }}
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
                                            backgroundColor: '#2563EB',
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
                                    <Text size="md" fw={700} c="#191F28">{displayName}</Text>
                                    <Text size="xs" c="#6B7684">
                                        {profile?.provider === 'kakao' ? '카카오 로그인' : '휴대전화 로그인'} · 내 정보 보기
                                    </Text>
                                </Box>
                                <ChevronRight size={18} color="#8B95A1" />
                            </Group>
                        </Box>
                    )}
                </Box>

                {/* 서비스 메뉴 */}
                <Box px="md" pb="md">
                    <Text size="xs" c="#8B95A1" mb={8} fw={700} px={4} style={{ letterSpacing: '-0.2px' }}>
                        서비스
                    </Text>
                    <Stack
                        gap={0}
                        bg="white"
                        style={{
                            borderRadius: 16,
                            overflow: 'hidden',
                            border: '1px solid rgba(15, 23, 42, 0.05)',
                        }}
                    >
                        {serviceItems.map((item, idx) => {
                            const Icon = item.icon;
                            return (
                                <Box
                                    key={item.path}
                                    px="md"
                                    py={14}
                                    style={{
                                        borderBottom: idx < serviceItems.length - 1 ? '1px solid #F2F4F6' : 'none',
                                        cursor: 'pointer',
                                    }}
                                    onClick={() => router.push(item.path)}
                                >
                                    <Group gap="md" wrap="nowrap" justify="space-between">
                                        <Group gap="md" wrap="nowrap">
                                            <Box
                                                style={{
                                                    width: 38,
                                                    height: 38,
                                                    borderRadius: 10,
                                                    backgroundColor: '#EFF6FF',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0,
                                                }}
                                            >
                                                <Icon size={18} color="#2563EB" />
                                            </Box>
                                            <Box>
                                                <Text size="sm" fw={700} c="#191F28">{item.label}</Text>
                                                <Text size="xs" c="#6B7684">{item.description}</Text>
                                            </Box>
                                        </Group>
                                        <ChevronRight size={16} color="#8B95A1" />
                                    </Group>
                                </Box>
                            );
                        })}
                    </Stack>
                </Box>

                {/* 고객지원 */}
                <Box px="md" pb="md">
                    <Text size="xs" c="#8B95A1" mb={8} fw={700} px={4} style={{ letterSpacing: '-0.2px' }}>
                        고객지원
                    </Text>
                    <Stack
                        gap={0}
                        bg="white"
                        style={{
                            borderRadius: 16,
                            overflow: 'hidden',
                            border: '1px solid rgba(15, 23, 42, 0.05)',
                        }}
                    >
                        {infoItems.map((item, idx) => {
                            const Icon = item.icon;
                            return (
                                <Box
                                    key={item.path}
                                    px="md"
                                    py={14}
                                    style={{
                                        borderBottom: idx < infoItems.length - 1 ? '1px solid #F2F4F6' : 'none',
                                        cursor: 'pointer',
                                    }}
                                    onClick={() => router.push(item.path)}
                                >
                                    <Group gap="md" wrap="nowrap" justify="space-between">
                                        <Group gap="md" wrap="nowrap">
                                            <Icon size={18} color="#6B7684" />
                                            <Text size="sm" fw={600} c="#333D4B">{item.label}</Text>
                                        </Group>
                                        <ChevronRight size={16} color="#8B95A1" />
                                    </Group>
                                </Box>
                            );
                        })}
                    </Stack>
                </Box>

                {/* 법적 정보 */}
                <Box px="md" pb="xs">
                    <Group gap="md" justify="center" py="sm">
                        {legalItems.map((item, idx) => (
                            <span key={item.path}>
                                <Text
                                    component="span"
                                    size="xs"
                                    c="#8B95A1"
                                    fw={500}
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => router.push(item.path)}
                                >
                                    {item.label}
                                </Text>
                                {idx < legalItems.length - 1 && (
                                    <Text component="span" size="xs" c="#D1D6DB" mx={8}>·</Text>
                                )}
                            </span>
                        ))}
                    </Group>
                </Box>

                {/* 버전 정보 */}
                <Box ta="center" pb="xl">
                    <Text size="xs" c="#8B95A1">대대손손 v1.0.0</Text>
                </Box>
            </Box>

            {/* 로그인 모달 */}
            <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />

            {/* 하단 탭바 */}
            <BottomNav />
        </Box>
    );
}
