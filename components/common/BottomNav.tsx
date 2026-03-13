'use client';

import { Box, Group, Text } from '@mantine/core';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import ChatFloatingButton from '@/components/chatbot/ChatFloatingButton';

interface BottomNavProps {
    historyCount?: number;
    hidden?: boolean;
}

// 호갱노노 스타일 아이콘: 비활성=진한 아웃라인, 활성=브랜드컬러 filled
function HomeIcon({ active }: { active: boolean }) {
    const color = active ? '#1D0098' : '#adb5bd';
    return (
        <svg width="22" height="22" viewBox="0 0 24 24">
            <path d="M12 3L4 9v12h5v-7h6v7h5V9L12 3z" fill={color} />
        </svg>
    );
}

function InquiryIcon({ active }: { active: boolean }) {
    const color = active ? '#1D0098' : '#adb5bd';
    return (
        <svg width="22" height="22" viewBox="0 0 24 24">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill={color} />
        </svg>
    );
}

function HistoryIcon({ active }: { active: boolean }) {
    const color = active ? '#1D0098' : '#adb5bd';
    return (
        <svg width="22" height="22" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" fill={color} />
            <polyline points="12 6 12 12 16 14" fill="none" stroke={active ? '#fff' : '#fff'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function MenuIcon({ active }: { active: boolean }) {
    const color = active ? '#1D0098' : '#adb5bd';
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="18" x2="20" y2="18" />
        </svg>
    );
}

const iconMap: Record<string, React.FC<{ active: boolean }>> = {
    home: HomeIcon,
    inquiries: InquiryIcon,
    history: HistoryIcon,
    menu: MenuIcon,
};

export default function BottomNav({ historyCount = 0, hidden = false }: BottomNavProps) {
    const pathname = usePathname();

    const tabs = [
        { id: 'home', label: '홈', path: '/' },
        { id: 'inquiries', label: '문의', path: '/inquiries' },
        { id: 'history', label: '최근 본', path: '/history' },
        { id: 'menu', label: '전체', path: '/menu' },
    ];

    return (
        <>
            <ChatFloatingButton hidden={hidden} />
            <Box
            style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                height: 56,
                backgroundColor: '#fff',
                borderTop: '1px solid #ddd',
                zIndex: 2000,
                paddingBottom: 'env(safe-area-inset-bottom)',
                transform: hidden ? 'translateY(100%)' : 'translateY(0)',
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
        >
            <Group h={56} justify="space-around" align="center" px={0}>
                {tabs.map((tab) => {
                    const isActive = pathname === tab.path || (tab.path === '/' && pathname === '/');
                    const IconComponent = iconMap[tab.id];

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
                                flex: 1,
                                height: '100%',
                                WebkitTapHighlightColor: 'transparent',
                                gap: 4,
                            }}
                        >
                            <Box style={{ position: 'relative', lineHeight: 0 }}>
                                <IconComponent active={isActive} />
                                {tab.id === 'history' && historyCount > 0 && (
                                    <Box
                                        style={{
                                            position: 'absolute',
                                            top: -4,
                                            right: -8,
                                            backgroundColor: '#ff3b30',
                                            color: 'white',
                                            fontSize: 9,
                                            fontWeight: 700,
                                            minWidth: 15,
                                            height: 15,
                                            borderRadius: 8,
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
                                    fontSize: 14,
                                    fontWeight: isActive ? 700 : 500,
                                    color: isActive ? '#1D0098' : '#868e96',
                                    lineHeight: 1,
                                    letterSpacing: '-0.02em',
                                }}
                            >
                                {tab.label}
                            </Text>
                        </Link>
                    );
                })}
            </Group>
        </Box>
        </>
    );
}
