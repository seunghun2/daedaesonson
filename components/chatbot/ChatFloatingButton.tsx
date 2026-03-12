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

export default function ChatFloatingButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [labelPhase, setLabelPhase] = useState<'hidden' | 'visible' | 'collapsing' | 'gone'>('hidden');
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const dismissed = sessionStorage.getItem('chat_label_dismissed');
        if (dismissed) { setLabelPhase('gone'); return; }

        // 2초 후 라벨 표시
        timerRef.current = setTimeout(() => setLabelPhase('visible'), 2000);
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, []);

    useEffect(() => {
        if (labelPhase !== 'visible') return;
        // 6초 후 쏙 들어가기
        const t = setTimeout(() => {
            setLabelPhase('collapsing');
            setTimeout(() => {
                setLabelPhase('gone');
                sessionStorage.setItem('chat_label_dismissed', '1');
            }, 400);
        }, 6000);
        return () => clearTimeout(t);
    }, [labelPhase]);

    const handleOpen = () => {
        setIsOpen(true);
        setLabelPhase('gone');
        sessionStorage.setItem('chat_label_dismissed', '1');
    };

    return (
        <>
            {!isOpen && (
                <div style={{
                    position: 'fixed', right: 16, bottom: 16, zIndex: 9990,
                    display: 'flex', alignItems: 'center', gap: 0,
                }}>
                    {/* ── 라벨 (1줄, 쏙 들어가는 애니메이션) ── */}
                    {(labelPhase === 'visible' || labelPhase === 'collapsing') && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '10px 16px',
                            background: '#fff', border: '1px solid #eee', borderRight: 'none',
                            borderRadius: '28px 0 0 28px',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            animation: labelPhase === 'visible'
                                ? 'labelExpand 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards'
                                : 'labelCollapse 0.35s cubic-bezier(0.7, 0, 0.84, 0) forwards',
                            transformOrigin: 'right center',
                            overflow: 'hidden',
                        }}
                            onClick={handleOpen}
                        >
                            <span style={{
                                fontSize: 13, fontWeight: 600, color: '#333',
                                letterSpacing: '-0.3px',
                            }}>
                                대손AI 상담사
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
                @keyframes labelExpand {
                    from { max-width: 0; padding-left: 0; padding-right: 0; opacity: 0; }
                    to { max-width: 200px; padding-left: 16px; padding-right: 16px; opacity: 1; }
                }
                @keyframes labelCollapse {
                    from { max-width: 200px; padding-left: 16px; padding-right: 16px; opacity: 1; }
                    to { max-width: 0; padding-left: 0; padding-right: 0; opacity: 0; }
                }
            `}</style>
        </>
    );
}
