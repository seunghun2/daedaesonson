'use client';

import { useState, useEffect, useRef } from 'react';
import AIChatbot from './AIChatbot';

const NAVY = '#302E92';

const ROLLING_MESSAGES = [
    { title: '대손AI 상담사', sub: '무엇을 도와드릴까요?' },
    { title: '장지 비교·추천', sub: '맞춤 상담 도와드려요' },
    { title: '24시간 무료 상담', sub: '편하게 물어보세요' },
];

export default function ChatFloatingButton({ hidden = false }: { hidden?: boolean }) {
    const [isOpen, setIsOpen] = useState(false);
    const [showLabel, setShowLabel] = useState(false);
    const [labelVisible, setLabelVisible] = useState(false);
    const [msgIndex, setMsgIndex] = useState(0);
    const [msgFade, setMsgFade] = useState(true);
    const timerRef = useRef<ReturnType<typeof setTimeout>[]>([]);
    const rollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (isOpen) return;
        const dismissed = sessionStorage.getItem('chat_fab_dismissed');
        if (dismissed) return;

        // 2초 후 라벨 슬라이드인
        const t1 = setTimeout(() => {
            setShowLabel(true);
            setMsgIndex(0);
            setMsgFade(true);
            requestAnimationFrame(() => setLabelVisible(true));

            // 3초마다 문구 롤링
            rollingRef.current = setInterval(() => {
                setMsgFade(false); // 페이드아웃
                setTimeout(() => {
                    setMsgIndex(prev => (prev + 1) % ROLLING_MESSAGES.length);
                    setMsgFade(true); // 페이드인
                }, 300);
            }, 3000);
        }, 2000);

        // 전체 1사이클(9초) + 여유 4초 = 13초 후 자동 숨김
        const t2 = setTimeout(() => {
            if (rollingRef.current) clearInterval(rollingRef.current);
            setLabelVisible(false);
            setTimeout(() => {
                setShowLabel(false);
                sessionStorage.setItem('chat_fab_dismissed', '1');
            }, 350);
        }, 13000);

        timerRef.current = [t1, t2];
        return () => {
            timerRef.current.forEach(clearTimeout);
            if (rollingRef.current) clearInterval(rollingRef.current);
        };
    }, [isOpen]);

    const handleToggle = () => {
        setIsOpen(prev => !prev);
        if (showLabel) {
            if (rollingRef.current) clearInterval(rollingRef.current);
            setLabelVisible(false);
            setTimeout(() => setShowLabel(false), 300);
            sessionStorage.setItem('chat_fab_dismissed', '1');
        }
    };

    const msg = ROLLING_MESSAGES[msgIndex];

    return (
        <>
            {/* ── 라벨 말풍선 (롤링) ── */}
            {!isOpen && showLabel && (
                <div style={{
                    position: 'fixed', right: 76, bottom: 80, zIndex: 9989,
                    background: '#fff', borderRadius: 12,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                    padding: '10px 16px',
                    display: 'flex', alignItems: 'center', gap: 6,
                    width: 'fit-content', overflow: 'visible',
                    whiteSpace: 'nowrap', cursor: 'pointer',
                    opacity: labelVisible ? 1 : 0,
                    transform: labelVisible ? 'translateX(0)' : 'translateX(12px)',
                    transition: 'opacity 0.3s ease, transform 0.3s ease',
                }} onClick={handleToggle}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        opacity: msgFade ? 1 : 0,
                        transform: msgFade ? 'translateY(0)' : 'translateY(-6px)',
                        transition: 'opacity 0.3s ease, transform 0.3s ease',
                    }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#222' }}>{msg.title}</span>
                        <span style={{ fontSize: 13, color: '#888' }}>{msg.sub}</span>
                    </div>
                    {/* 말풍선 꼬리 */}
                    <div style={{
                        position: 'absolute', right: -5, bottom: 14,
                        width: 10, height: 10, background: '#fff',
                        transform: 'rotate(45deg)',
                        boxShadow: '2px -2px 4px rgba(0,0,0,0.06)',
                    }} />
                </div>
            )}

            {/* ── FAB ── */}
            <button
                onClick={handleToggle}
                aria-label={isOpen ? '채팅 닫기' : '장지 상담하기'}
                style={{
                    position: 'fixed', right: 16, bottom: 70, zIndex: 9991,
                    width: 56, height: 56, borderRadius: '50%',
                    background: NAVY, border: 'none',
                    cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 16px rgba(48,46,146,0.35)',
                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), background 0.2s ease',
                    transform: hidden ? 'translateX(100px)' : 'scale(1)',
                }}
                onMouseEnter={e => { if (!hidden) e.currentTarget.style.transform = 'scale(1.08)'; }}
                onMouseLeave={e => { if (!hidden) e.currentTarget.style.transform = 'scale(1)'; }}
            >
                {isOpen ? (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
                            stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                )}
            </button>

            <AIChatbot isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
    );
}
