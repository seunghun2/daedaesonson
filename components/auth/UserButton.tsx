'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import LoginModal from './LoginModal';

export default function UserButton({ variant = 'light' }: { variant?: 'light' | 'dark' }) {
    const isDark = variant === 'dark';
    const { user, profile, loading, signOut } = useAuth();
    const [showLogin, setShowLogin] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // 외부 클릭 감지
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    if (loading) {
        return (
            <div style={{
                width: isDark ? 32 : 36,
                height: isDark ? 32 : 36,
                borderRadius: '50%',
                backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : '#f1f3f5',
            }} />
        );
    }

    // 로그인 안 된 상태
    if (!user) {
        return (
            <>
                <button
                    onClick={() => setShowLogin(true)}
                    aria-label="로그인"
                    style={{
                        width: isDark ? 32 : 36,
                        height: isDark ? 32 : 36,
                        borderRadius: '50%',
                        backgroundColor: isDark ? 'transparent' : '#f1f3f5',
                        border: isDark ? '1.5px solid rgba(255,255,255,0.5)' : 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background-color 0.2s',
                        flexShrink: 0,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.15)' : '#e9ecef')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = isDark ? 'transparent' : '#f1f3f5')}
                >
                    <svg
                        width={isDark ? 16 : 20}
                        height={isDark ? 16 : 20}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={isDark ? 'white' : '#868e96'}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                    </svg>
                </button>
                <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
            </>
        );
    }

    // 로그인 된 상태
    const displayName = profile?.nickname || user.user_metadata?.name || '사용자';
    const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url;

    return (
        <div ref={menuRef} style={{ position: 'relative', flexShrink: 0 }}>
            <button
                onClick={() => setShowMenu(!showMenu)}
                style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    border: showMenu ? '2px solid #5c3fbf' : '2px solid transparent',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: avatarUrl ? 'transparent' : '#5c3fbf',
                    padding: 0,
                    transition: 'border-color 0.2s',
                }}
            >
                {avatarUrl ? (
                    <img
                        src={avatarUrl}
                        alt={displayName}
                        width={36}
                        height={36}
                        style={{ objectFit: 'cover' }}
                    />
                ) : (
                    <span style={{
                        color: 'white',
                        fontSize: 14,
                        fontWeight: 700,
                    }}>
                        {displayName.charAt(0)}
                    </span>
                )}
            </button>

            {/* 드롭다운 메뉴 */}
            {showMenu && (
                <div
                    style={{
                        position: 'absolute',
                        top: 44,
                        right: 0,
                        backgroundColor: 'white',
                        borderRadius: 12,
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.12)',
                        padding: '8px 0',
                        minWidth: 180,
                        zIndex: 1000,
                        animation: 'fadeIn 0.15s ease',
                    }}
                >
                    {/* 유저 정보 */}
                    <div style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #f1f3f5',
                    }}>
                        <div style={{
                            fontSize: 15,
                            fontWeight: 600,
                            color: '#212529',
                        }}>
                            {displayName}
                        </div>
                        <div style={{
                            fontSize: 12,
                            color: '#868e96',
                            marginTop: 2,
                        }}>
                            {profile?.provider === 'kakao' ? '카카오 로그인' : '휴대전화 로그인'}
                        </div>
                    </div>

                    {/* 메뉴 항목 */}
                    <MenuItem
                        icon={
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                            </svg>
                        }
                        label="관심 시설"
                        onClick={() => { setShowMenu(false); /* TODO: navigate */ }}
                    />
                    <MenuItem
                        icon={
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                        }
                        label="내 정보"
                        onClick={() => { setShowMenu(false); /* TODO: navigate */ }}
                    />

                    <div style={{ height: 1, backgroundColor: '#f1f3f5', margin: '4px 0' }} />

                    <MenuItem
                        icon={
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                <polyline points="16 17 21 12 16 7" />
                                <line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                        }
                        label="로그아웃"
                        onClick={() => { signOut(); setShowMenu(false); }}
                        color="#fa5252"
                    />
                </div>
            )}
        </div>
    );
}

function MenuItem({ icon, label, onClick, color }: {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    color?: string;
}) {
    return (
        <button
            onClick={onClick}
            style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 16px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: 14,
                color: color || '#495057',
                textAlign: 'left',
                transition: 'background-color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8f9fa')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
            {icon}
            {label}
        </button>
    );
}
