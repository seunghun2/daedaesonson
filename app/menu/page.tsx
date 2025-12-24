'use client';

import { Box, Text, Group, Stack } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Home, MessageCircle, Clock, Info, HelpCircle, FileText, Mail, Shield } from 'lucide-react';
import Link from 'next/link';
import BottomNav from '@/components/common/BottomNav';

export default function MenuPage() {
    const router = useRouter();

    const menuItems = [
        { label: '홈', icon: Home, path: '/', description: '지도에서 시설 찾기' },
        { label: '문의하기', icon: MessageCircle, path: '/inquiries', description: '문의 목록 보기' },
        { label: '기록', icon: Clock, path: '/history', description: '최근 본 시설' },
    ];

    const infoItems = [
        { label: '서비스 안내', icon: Info, path: '/about' },
        { label: '자주 묻는 질문', icon: HelpCircle, path: '/faq' },
        { label: '이용약관', icon: FileText, path: '/terms' },
        { label: '개인정보 처리방침', icon: Shield, path: '/privacy' },
        { label: '문의하기', icon: Mail, path: '/contact' },
    ];

    return (
        <Box style={{ minHeight: '100dvh', backgroundColor: '#f8f9fa', paddingBottom: 70 }}>
            {/* 헤더 */}
            <Box
                p="md"
                style={{
                    backgroundColor: 'white',
                    borderBottom: '1px solid #e9ecef',
                    position: 'sticky',
                    top: 0,
                    zIndex: 100,
                }}
            >
                <Group justify="space-between" align="center">
                    <Group gap="sm">
                        <Link href="/" style={{ display: 'flex', alignItems: 'center' }}>
                            <ArrowLeft size={20} color="#495057" />
                        </Link>
                        <Text size="lg" fw={700}>전체</Text>
                    </Group>
                </Group>
            </Box>

            {/* 메인 메뉴 */}
            <Box p="md">
                <Text size="xs" c="dimmed" mb="sm" fw={600}>메뉴</Text>
                <Stack gap={0} bg="white" style={{ borderRadius: 12, overflow: 'hidden' }}>
                    {menuItems.map((item, idx) => {
                        const Icon = item.icon;
                        return (
                            <Box
                                key={item.path}
                                p="md"
                                style={{
                                    borderBottom: idx < menuItems.length - 1 ? '1px solid #f1f3f5' : 'none',
                                    cursor: 'pointer',
                                }}
                                onClick={() => router.push(item.path)}
                            >
                                <Group gap="md" wrap="nowrap">
                                    <Box
                                        style={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: 10,
                                            backgroundColor: '#f8f9fa',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <Icon size={20} color="#1D0098" />
                                    </Box>
                                    <Box>
                                        <Text size="sm" fw={600}>{item.label}</Text>
                                        <Text size="xs" c="dimmed">{item.description}</Text>
                                    </Box>
                                </Group>
                            </Box>
                        );
                    })}
                </Stack>
            </Box>

            {/* 정보 */}
            <Box p="md" pt={0}>
                <Text size="xs" c="dimmed" mb="sm" fw={600}>서비스 정보</Text>
                <Stack gap={0} bg="white" style={{ borderRadius: 12, overflow: 'hidden' }}>
                    {infoItems.map((item, idx) => {
                        const Icon = item.icon;
                        const isExternal = item.path.startsWith('mailto:');
                        return (
                            <Box
                                key={item.path}
                                p="md"
                                style={{
                                    borderBottom: idx < infoItems.length - 1 ? '1px solid #f1f3f5' : 'none',
                                    cursor: 'pointer',
                                }}
                                onClick={() => {
                                    if (isExternal) {
                                        window.location.href = item.path;
                                    } else {
                                        router.push(item.path);
                                    }
                                }}
                            >
                                <Group gap="md" wrap="nowrap">
                                    <Icon size={18} color="#868e96" />
                                    <Text size="sm" c="dark.6">{item.label}</Text>
                                </Group>
                            </Box>
                        );
                    })}
                </Stack>
            </Box>

            {/* 버전 정보 */}
            <Box ta="center" py="xl">
                <Text size="xs" c="dimmed">대대손손 v1.0.0</Text>
            </Box>

            {/* 하단 탭바 */}
            <BottomNav />
        </Box>
    );
}
