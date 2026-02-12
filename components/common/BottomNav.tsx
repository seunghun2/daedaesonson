'use client';

import { Box, Group, Text } from '@mantine/core';
import { usePathname } from 'next/navigation';
import { Home, Clock, MessageCircle, Menu } from 'lucide-react';
import Link from 'next/link';

interface BottomNavProps {
    historyCount?: number;
    hidden?: boolean;
}

export default function BottomNav({ historyCount = 0, hidden = false }: BottomNavProps) {
    const pathname = usePathname();

    const tabs = [
        { id: 'home', label: '홈', icon: Home, path: '/' },
        { id: 'inquiries', label: '문의', icon: MessageCircle, path: '/inquiries' },
        { id: 'history', label: '최근 본', icon: Clock, path: '/history' },
        { id: 'menu', label: '전체', icon: Menu, path: '/menu' },
    ];

    return (
        <Box
            style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                height: 52,
                backgroundColor: 'rgba(255,255,255,0.97)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderTop: '1px solid rgba(0,0,0,0.06)',
                zIndex: 2000,
                paddingBottom: 'env(safe-area-inset-bottom)',
                transform: hidden ? 'translateY(100%)' : 'translateY(0)',
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
        >
            <Group h={52} justify="space-around" align="center" px="xs">
                {tabs.map((tab) => {
                    const isActive = pathname === tab.path || (tab.path === '/' && pathname === '/');
                    const Icon = tab.icon;

                    return (
                        <Link
                            key={tab.id}
                            href={tab.path}
                            prefetch={true}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textDecoration: 'none',
                                padding: '6px 16px 2px',
                                position: 'relative',
                                WebkitTapHighlightColor: 'transparent',
                                gap: 0,
                            }}
                        >
                            <Box style={{ position: 'relative' }}>
                                <Icon
                                    size={20}
                                    color={isActive ? '#1D0098' : '#868e96'}
                                    fill={isActive ? '#1D0098' : 'none'}
                                    strokeWidth={isActive ? 2 : 1.5}
                                />
                                {/* 기록 카운트 뱃지 */}
                                {tab.id === 'history' && historyCount > 0 && (
                                    <Box
                                        style={{
                                            position: 'absolute',
                                            top: -5,
                                            right: -9,
                                            backgroundColor: '#ff3b30',
                                            color: 'white',
                                            fontSize: 9,
                                            fontWeight: 700,
                                            minWidth: 14,
                                            height: 14,
                                            borderRadius: 7,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            padding: '0 3px',
                                            lineHeight: 1,
                                        }}
                                    >
                                        {historyCount > 99 ? '99+' : historyCount}
                                    </Box>
                                )}
                            </Box>
                            <Text
                                style={{
                                    fontSize: 11,
                                    fontWeight: isActive ? 600 : 400,
                                    color: isActive ? '#1D0098' : '#868e96',
                                    lineHeight: 1.2,
                                    letterSpacing: '-0.02em',
                                    marginTop: -2,
                                }}
                            >
                                {tab.label}
                            </Text>
                        </Link>
                    );
                })}
            </Group>
        </Box>
    );
}
