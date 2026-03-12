'use client';

import { useState, useEffect, useRef } from 'react';
import AIChatbot from './AIChatbot';

const NAVY = '#302E92';

const ChatBubbleIcon = ({ size = 22, color = NAVY }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
            stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

type Phase = 'hidden' | 'label-in' | 'label-out' | 'ring-glow' | 'idle';

export default function ChatFloatingButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [phase, setPhase] = useState<Phase>('hidden');
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const dismissed = sessionStorage.getItem('chat_label_dismissed');
        if (dismissed) { setPhase('idle'); return; }

        // 2초 후 라벨 등장
        timerRef.current = setTimeout(() => setPhase('label-in'), 2000);
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, []);

    useEffect(() => {
        if (phase === 'label-in') {
            // 5초 후 라벨 쏙 들어가기
            const t = setTimeout(() => setPhase('label-out'), 5000);
            return () => clearTimeout(t);
        }
        if (phase === 'label-out') {
            // 축소 애니메이션 완료 후 → 링 글로우
            const t = setTimeout(() => setPhase('ring-glow'), 400);
            return () => clearTimeout(t);
        }
        if (phase === 'ring-glow') {
            // 링 애니메이션 1회 후 idle
            const t = setTimeout(() => {
                setPhase('idle');
                sessionStorage.setItem('chat_label_dismissed', '1');
            }, 1200);
            return () => clearTimeout(t);
        }
    }, [phase]);

    const handleOpen = () => {
        setIsOpen(true);
        setPhase('idle');
        sessionStorage.setItem('chat_label_dismissed', '1');
    };

    const showLabel = phase === 'label-in' || phase === 'label-out';
    const showRing = phase === 'ring-glow';

    return (
        <>
            {!isOpen && (
                <div style={{
                    position: 'fixed', right: 16, bottom: 16, zIndex: 9990,
                    display: 'flex', alignItems: 'center', gap: 0,
                }}>
                    {/* ── 라벨: "대손AI 상담사 · 무엇을 도와드릴까요?" ── */}
                    {showLabel && (
                        <div
                            onClick={handleOpen}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '10px 14px',
                                background: '#fff', border: '1px solid #eee', borderRight: 'none',
                                borderRadius: '28px 0 0 28px',
                                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                                cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden',
                                animation: phase === 'label-in'
                                    ? 'fabLabelIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards'
                                    : 'fabLabelOut 0.35s cubic-bezier(0.7, 0, 0.84, 0) forwards',
                                transformOrigin: 'right center',
                            }}
                        >
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#333', letterSpacing: '-0.3px' }}>
                                대손AI 상담사
                            </span>
                            <span style={{ fontSize: 12, color: '#888' }}>·</span>
                            <span style={{ fontSize: 12, color: '#666' }}>
                                무엇을 도와드릴까요?
                            </span>
                        </div>
                    )}

                    {/* ── FAB ── */}
                    <button
                        onClick={handleOpen}
                        aria-label="장지 상담하기"
                        style={{
                            width: 56, height: 56, borderRadius: '50%',
                            background: '#fff', border: '1px solid #eee',
                            cursor: 'pointer', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.1), 0 1px 4px rgba(0,0,0,0.06)',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            flexShrink: 0, position: 'relative', zIndex: 1,
                            animation: showRing ? 'fabRingGlow 1.2s ease-out' : 'none',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.transform = 'scale(1.08)';
                            e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.14)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1), 0 1px 4px rgba(0,0,0,0.06)';
                        }}
                    >
                        <ChatBubbleIcon size={24} color={NAVY} />
                    </button>
                </div>
            )}

            <AIChatbot isOpen={isOpen} onClose={() => setIsOpen(false)} />

            <style jsx global>{`
                @keyframes fabLabelIn {
                    from { max-width: 0; padding-left: 0; padding-right: 0; opacity: 0; }
                    to { max-width: 280px; padding-left: 14px; padding-right: 14px; opacity: 1; }
                }
                @keyframes fabLabelOut {
                    from { max-width: 280px; padding-left: 14px; padding-right: 14px; opacity: 1; }
                    to { max-width: 0; padding-left: 0; padding-right: 0; opacity: 0; }
                }
                @keyframes fabRingGlow {
                    0% { box-shadow: 0 0 0 0 rgba(48, 46, 146, 0); }
                    20% { box-shadow: 0 0 0 4px rgba(48, 46, 146, 0.25); }
                    40% { box-shadow: 0 0 0 6px rgba(99, 102, 241, 0.2); }
                    60% { box-shadow: 0 0 0 5px rgba(139, 92, 246, 0.15); }
                    80% { box-shadow: 0 0 0 3px rgba(48, 46, 146, 0.08); }
                    100% { box-shadow: 0 4px 16px rgba(0,0,0,0.1), 0 1px 4px rgba(0,0,0,0.06); }
                }
            `}</style>
        </>
    );
}
