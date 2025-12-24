'use client';

import { Box, Group, Text } from '@mantine/core';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Clock, MessageCircle, Menu } from 'lucide-react';

interface BottomNavProps {
    historyCount?: number;
    hidden?: boolean;
}

export default function BottomNav({ historyCount = 0, hidden = false }: BottomNavProps) {
    const pathname = usePathname();
    const router = useRouter();

    const tabs = [
        { id: 'home', label: '홈', icon: Home, path: '/' },
        { id: 'inquiries', label: '문의', icon: MessageCircle, path: '/inquiries' },
        { id: 'history', label: '기록', icon: Clock, path: '/history' },
        { id: 'menu', label: '전체', icon: Menu, path: '/menu' },
    ];

    return (
        <Box
            style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                height: 56,
                backgroundColor: 'white',
                borderTop: '1px solid #e9ecef',
                zIndex: 2000,
                paddingBottom: 'env(safe-area-inset-bottom)',
                transform: hidden ? 'translateY(100%)' : 'translateY(0)',
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
        >
            <Group h={56} justify="space-around" align="center" px="md">
                {tabs.map((tab) => {
                    const isActive = pathname === tab.path || (tab.path === '/' && pathname === '/');
                    const Icon = tab.icon;

                    return (
                        <Box
                            key={tab.id}
                            onClick={() => router.push(tab.path)}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                cursor: 'pointer',
                                padding: '4px 20px',
                                position: 'relative',
                            }}
                        >
                            <Box style={{ position: 'relative' }}>
                                <Icon
                                    size={22}
                                    color={isActive ? '#1D0098' : '#adb5bd'}
                                    fill={'none'}
                                    strokeWidth={isActive ? 1.8 : 1.5}
                                />
                                {/* 기록 카운트 뱃지 */}
                                {tab.id === 'history' && historyCount > 0 && (
                                    <Box
                                        style={{
                                            position: 'absolute',
                                            top: -6,
                                            right: -10,
                                            backgroundColor: '#1D0098',
                                            color: 'white',
                                            fontSize: 10,
                                            fontWeight: 700,
                                            minWidth: 16,
                                            height: 16,
                                            borderRadius: 8,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            padding: '0 4px',
                                        }}
                                    >
                                        {historyCount > 99 ? '99+' : historyCount}
                                    </Box>
                                )}
                            </Box>
                            <Text
                                size="xs"
                                c={isActive ? '#1D0098' : 'dimmed'}
                                fw={isActive ? 600 : 400}
                                style={{ marginTop: -2 }}
                            >
                                {tab.label}
                            </Text>
                        </Box>
                    );
                })}
            </Group>
        </Box>
    );
}
