'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Phone, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp?: string;
    imageUrl?: string;
}

interface FacilityContext {
    id: number;
    name: string;
    category: string;
    address?: string;
    phone?: string;
    representativePrice?: number;
    institutionType?: string;
    description?: string;
    standardizedPrices?: any[];
    amenities?: Record<string, boolean>;
}

interface AIChatbotProps {
    isOpen: boolean;
    onClose: () => void;
    facilityContext?: FacilityContext | null;
    onOpenConsultForm?: () => void;
}

const NAVY = '#302E92';

export default function AIChatbot({ isOpen, onClose, facilityContext, onOpenConsultForm }: AIChatbotProps) {
    const [messages, setMessages] = useState<Message[]>(() => {
        if (typeof window === 'undefined') return [];
        try { return JSON.parse(sessionStorage.getItem('chat_messages') || '[]'); } catch { return []; }
    });
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(() => {
        if (typeof window === 'undefined') return null;
        return sessionStorage.getItem('chat_session_id') || null;
    });
    const [showContactForm, setShowContactForm] = useState(false);
    const [contactName, setContactName] = useState('');
    const [pendingImage, setPendingImage] = useState<File | null>(null);
    const [pendingImagePreview, setPendingImagePreview] = useState<string | null>(null);
    const [contactPhone, setContactPhone] = useState('');
    const [contactSubmitted, setContactSubmitted] = useState(false);
    const [messageCount, setMessageCount] = useState(() => {
        if (typeof window === 'undefined') return 0;
        return parseInt(sessionStorage.getItem('chat_msg_count') || '0', 10);
    });
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    /* ── 초기 인사 ── */
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            const greeting = facilityContext
                ? `안녕하세요, 대손이입니다.\n${facilityContext.name}에 대해 궁금하신 점을 편하게 물어봐 주세요.`
                : '안녕하세요, 대손이입니다.\n궁금하신 점을 편하게 물어봐 주세요.';
            setMessages([{ role: 'assistant', content: greeting, timestamp: new Date().toISOString() }]);
        }
    }, [isOpen, facilityContext]);

    /* ── 세션 저장 ── */
    useEffect(() => {
        if (typeof window === 'undefined') return;
        sessionStorage.setItem('chat_messages', JSON.stringify(messages));
    }, [messages]);
    useEffect(() => {
        if (sessionId) sessionStorage.setItem('chat_session_id', sessionId);
    }, [sessionId]);
    useEffect(() => {
        if (typeof window === 'undefined') return;
        sessionStorage.setItem('chat_msg_count', messageCount.toString());
    }, [messageCount]);

    /* ── 스크롤 ── */
    useEffect(() => {
        if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading, isOpen]);

    /* ── Focus ── */
    useEffect(() => {
        if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
    }, [isOpen]);

    /* ── 메시지 전송 ── */
    const sendMessage = useCallback(async () => {
        if ((!input.trim() && !pendingImage) || isLoading) return;
        const userMsg = input.trim() || (pendingImage ? '(이미지 첨부)' : '');
        const imageUrl = pendingImagePreview || undefined;
        setInput('');
        setPendingImage(null);
        setPendingImagePreview(null);

        setMessages(prev => [...prev, { role: 'user', content: userMsg, timestamp: new Date().toISOString(), imageUrl }]);
        setIsLoading(true);
        setMessageCount(prev => prev + 1);

        try {
            const msgToSend = pendingImage
                ? `${userMsg} [사용자가 이미지를 첨부했습니다: ${pendingImage.name}]`
                : userMsg;

            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: msgToSend, history: messages, sessionId, facilityContext }),
            });
            const data = await res.json();
            if (data.sessionId) setSessionId(data.sessionId);

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.response || '죄송합니다. 잠시 후 다시 시도해주세요.',
                timestamp: new Date().toISOString(),
            }]);

            if (messageCount >= 3 && !contactSubmitted && !showContactForm) {
                setTimeout(() => setShowContactForm(true), 1500);
            }
        } catch {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: '네트워크 오류가 발생했어요. 잠시 후 다시 시도해주세요.',
                timestamp: new Date().toISOString(),
            }]);
        } finally {
            setIsLoading(false);
        }
    }, [input, isLoading, messages, sessionId, facilityContext, messageCount, contactSubmitted, showContactForm, pendingImage, pendingImagePreview]);

    /* ── 상담 폼 제출 ── */
    const submitContact = async () => {
        if (!contactName.trim() || !contactPhone.trim()) return;
        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, customerInfo: { name: contactName, phone: contactPhone } }),
            });
            const data = await res.json();
            setMessages(prev => [...prev, { role: 'assistant', content: data.response, timestamp: new Date().toISOString() }]);
            setContactSubmitted(true);
            setShowContactForm(false);
        } catch {}
    };

    /* ── 마크다운 링크 렌더링 ── */
    const renderContent = (text: string) => {
        // ** 마크다운 볼드 제거
        let cleaned = text.replace(/\*\*(.*?)\*\*/g, '$1');
        // * 이탤릭 제거
        cleaned = cleaned.replace(/(?<!\*)\*(?!\*)(.*?)\*(?!\*)/g, '$1');

        // URL을 감지하여 클릭 가능한 버튼으로 변환
        const urlRegex = /(https?:\/\/[^\s),]+)/g;
        const parts = cleaned.split(urlRegex);

        return parts.map((part, i) => {
            if (urlRegex.test(part)) {
                // 시설 상세 페이지 URL인지 확인
                const facilityMatch = part.match(/daedaesonson\.com\/facility\/(park-\d+)/);
                if (facilityMatch) {
                    return (
                        <a key={i} href={`/facility/${facilityMatch[1]}`}
                            onClick={(e) => { e.preventDefault(); router.push(`/facility/${facilityMatch[1]}`); onClose(); }}
                            style={{
                                display: 'inline-block', margin: '4px 0',
                                padding: '5px 10px', borderRadius: 6,
                                background: 'transparent', color: NAVY,
                                border: `1px solid ${NAVY}`,
                                fontSize: 12, fontWeight: 600,
                                textDecoration: 'none', cursor: 'pointer',
                            }}>
                            상세 보기 →
                        </a>
                    );
                }
                // 일반 URL
                return (
                    <a key={i} href={part} target="_blank" rel="noopener noreferrer"
                        style={{ color: NAVY, textDecoration: 'underline' }}>
                        {part}
                    </a>
                );
            }
            // 마크다운 링크 [text](url) 처리
            const mdParts = part.split(/(\[.*?\]\(.*?\))/g);
            return mdParts.map((mdPart, j) => {
                const mdMatch = mdPart.match(/\[(.*?)\]\((.*?)\)/);
                if (mdMatch) {
                    const facilityMatch2 = mdMatch[2].match(/facility\/(park-\d+)/);
                    if (facilityMatch2) {
                        return (
                            <a key={`${i}-${j}`} href={`/facility/${facilityMatch2[1]}`}
                                onClick={(e) => { e.preventDefault(); router.push(`/facility/${facilityMatch2[1]}`); onClose(); }}
                                style={{
                                    display: 'inline-block', margin: '4px 0',
                                    padding: '5px 10px', borderRadius: 6,
                                    background: 'transparent', color: NAVY,
                                    border: `1px solid ${NAVY}`,
                                    fontSize: 12, fontWeight: 600,
                                    textDecoration: 'none', cursor: 'pointer',
                                }}>
                                상세 보기 →
                            </a>
                        );
                    }
                    return (
                        <a key={`${i}-${j}`} href={mdMatch[2]} target="_blank" rel="noopener noreferrer"
                            style={{ color: NAVY, textDecoration: 'underline', fontWeight: 600 }}>
                            {mdMatch[1]}
                        </a>
                    );
                }
                return <span key={`${i}-${j}`}>{mdPart}</span>;
            });
        });
    };

    if (!isOpen) return null;

    return (
        <>
            {/* ── 오버레이 (모바일) ── */}
            <div className="chatbot-overlay" onClick={onClose} style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
                zIndex: 9990,
            }} />

            {/* ── 채팅 컨테이너 ── */}
            <div className="chatbot-container" style={{
                position: 'fixed', zIndex: 9991,
                display: 'flex', flexDirection: 'column',
                background: '#fff',
                boxShadow: '0 12px 40px rgba(0,0,0,0.16)',
                overflow: 'hidden',
                animation: 'chatSlideUp 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
            }}>

                {/* ── 헤더 ── */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '14px 16px', background: '#fff',
                    borderBottom: '1px solid #f0f0f0', flexShrink: 0,
                }}>
                    <div style={{
                        width: 40, height: 40, borderRadius: 12,
                        background: '#EEEDFA',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        overflow: 'hidden',
                    }}>
                        <img src="/images/daesoni-icon.svg" alt="대손이" width={34} height={34} style={{ objectFit: 'contain' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>대손이</div>
                        <div style={{ fontSize: 12, color: '#999' }}>
                            {facilityContext ? facilityContext.name : '장지 전문 AI 상담'}
                        </div>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        padding: 6, color: '#999', display: 'flex',
                    }}>
                        <X size={20} />
                    </button>
                </div>

                {/* ── 시설 컨텍스트 배너 ── */}
                {facilityContext && (
                    <button
                        onClick={() => { if (facilityContext.id) { onClose(); router.push(`/facility/${facilityContext.id}`); } }}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            width: '100%', background: '#f8f8fc', padding: '10px 16px',
                            border: 'none', borderBottom: '1px solid #f0f0f0',
                            cursor: 'pointer', textAlign: 'left',
                        }}
                    >
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#444' }}>{facilityContext.name}</span>
                        <ChevronRight size={14} color="#bbb" />
                    </button>
                )}

                {/* ── 메시지 영역 ── */}
                <div style={{
                    flex: 1, overflowY: 'auto', padding: '20px 16px 12px',
                    background: '#fff',
                    WebkitOverflowScrolling: 'touch',
                }}>
                    {/* 브랜드 인트로 */}
                    <div style={{ textAlign: 'center', marginBottom: 20 }}>
                        <div style={{
                            width: 56, height: 56, borderRadius: 16,
                            background: '#EEEDFA', margin: '0 auto 10px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            overflow: 'hidden',
                        }}>
                            <img src="/images/daesoni-icon.svg" alt="대손이" width={46} height={46} style={{ objectFit: 'contain' }} />
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>대대손손</div>
                        <div style={{ fontSize: 13, color: '#999', marginTop: 2 }}>
                            장지 전문 상담 · AI 대손이가 24시간 답변해드려요
                        </div>
                    </div>

                    {/* 메시지 목록 */}
                    {messages.map((msg, i) => (
                        <div key={i} style={{
                            display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                            marginBottom: 10, alignItems: 'flex-end', gap: 6,
                        }}>

                            <div style={{ maxWidth: '75%' }}>
                                {/* 이미지 첨부 */}
                                {msg.imageUrl && (
                                    <div style={{ marginBottom: 6, borderRadius: 14, overflow: 'hidden', maxWidth: 200 }}>
                                        <img src={msg.imageUrl} alt="첨부" style={{ width: '100%', display: 'block' }} />
                                    </div>
                                )}
                                {/* 말풍선 */}
                                <div style={{
                                    padding: '10px 14px',
                                    borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                    background: msg.role === 'user' ? NAVY : '#f2f2f2',
                                    color: msg.role === 'user' ? '#fff' : '#1a1a1a',
                                    fontSize: 15, lineHeight: 1.55, letterSpacing: '-0.2px',
                                    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                                }}>
                                    {renderContent(msg.content)}
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* 로딩 */}
                    {isLoading && (
                        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', marginBottom: 10 }}>
                            <div style={{
                                padding: '12px 18px', borderRadius: 18, background: '#f2f2f2',
                                display: 'flex', gap: 5,
                            }}>
                                {[0, 1, 2].map(n => (
                                    <div key={n} style={{
                                        width: 7, height: 7, borderRadius: '50%', background: '#bbb',
                                        animation: `dotPulse 1.2s ease infinite ${n * 0.15}s`,
                                    }} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 상담 신청 폼 */}
                    {showContactForm && !contactSubmitted && (
                        <div style={{
                            background: '#f8f8fc', borderRadius: 14, padding: 16, marginTop: 8,
                            border: '1px solid #eee',
                        }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#333', marginBottom: 10 }}>
                                더 자세한 안내가 필요하시면 연락처를 남겨주세요.
                            </div>
                            <input value={contactName} onChange={e => setContactName(e.target.value)}
                                placeholder="이름" style={{
                                    width: '100%', padding: '10px 12px', borderRadius: 10,
                                    border: '1px solid #e0e0e0', fontSize: 14, marginBottom: 8,
                                    outline: 'none', boxSizing: 'border-box',
                                }} />
                            <input value={contactPhone} onChange={e => setContactPhone(e.target.value)}
                                placeholder="연락처" type="tel" style={{
                                    width: '100%', padding: '10px 12px', borderRadius: 10,
                                    border: '1px solid #e0e0e0', fontSize: 14, marginBottom: 10,
                                    outline: 'none', boxSizing: 'border-box',
                                }} />
                            <button onClick={submitContact} style={{
                                width: '100%', padding: '10px', borderRadius: 10,
                                background: NAVY, color: '#fff', border: 'none',
                                fontSize: 14, fontWeight: 600, cursor: 'pointer',
                            }}>
                                상담 신청하기
                            </button>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* ── 퀵 리플라이 ── */}
                {messages.length <= 1 && (
                    <div style={{
                        display: 'flex', flexWrap: 'wrap', gap: 6,
                        padding: '0 16px 12px',
                    }}>
                        {(facilityContext
                            ? ['가격이 궁금해요', '비슷한 가격대 장지', '위치·교통편', '편의시설 안내', '연락처 알려주세요', '장례 절차가 궁금해요']
                            : ['근처 봉안당 추천해주세요', '수목장이 뭔가요?', '장례 절차 안내', '가격대별 추천']
                        ).map(q => (
                            <button key={q} onClick={() => setInput(q)} style={{
                                padding: '8px 14px', borderRadius: 20,
                                border: '1px solid #e5e5e5', background: '#fff',
                                color: '#4a4a4a', fontSize: 13, fontWeight: 500,
                                cursor: 'pointer', transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#f5f5f5'; e.currentTarget.style.borderColor = '#ccc'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e5e5e5'; }}
                            >
                                {q}
                            </button>
                        ))}
                    </div>
                )}

                {/* ── 하단 입력 영역 (채널톡 스타일) ── */}
                <div style={{ background: '#f2f2f2', flexShrink: 0 }}>
                    {/* 이미지 미리보기 */}
                    {pendingImage && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '10px 16px', background: '#e8e8e8',
                        }}>
                            <img src={pendingImagePreview || ''} alt="" style={{
                                width: 44, height: 44, borderRadius: 8, objectFit: 'cover',
                            }} />
                            <span style={{ fontSize: 12, color: '#666', flex: 1 }}>{pendingImage.name}</span>
                            <button onClick={() => { setPendingImage(null); setPendingImagePreview(null); }}
                                style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', padding: 4 }}>
                                <X size={14} />
                            </button>
                        </div>
                    )}

                    {/* 입력바 */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '10px 10px 10px 12px',
                    }}>
                        {/* 첨부파일 아이콘 */}
                        <label style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: 32, height: 32, cursor: 'pointer', color: '#999', flexShrink: 0,
                        }}>
                            <input type="file" accept="image/*" style={{ display: 'none' }}
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file && file.type.startsWith('image/')) {
                                        setPendingImage(file);
                                        const reader = new FileReader();
                                        reader.onload = (ev) => setPendingImagePreview(ev.target?.result as string);
                                        reader.readAsDataURL(file);
                                    }
                                    e.target.value = '';
                                }}
                            />
                            {/* 클립 아이콘 */}
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                            </svg>
                        </label>

                        {/* 텍스트 입력 */}
                        <input
                            ref={inputRef} type="text" value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && sendMessage()}
                            placeholder="AI에게 질문해 주세요."
                            style={{
                                flex: 1, padding: '10px 14px', borderRadius: 20,
                                border: 'none', fontSize: 16, outline: 'none',
                                background: 'transparent', color: '#1a1a1a',
                            }}
                        />

                        {/* 전송 버튼 (↑ 화살표) */}
                        <button
                            onClick={() => sendMessage()}
                            disabled={(!input.trim() && !pendingImage) || isLoading}
                            style={{
                                width: 34, height: 34, borderRadius: '50%',
                                background: (input.trim() || pendingImage) ? NAVY : '#d1d1d1',
                                border: 'none', cursor: (input.trim() || pendingImage) ? 'pointer' : 'default',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0, transition: 'background 0.2s',
                            }}
                        >
                            {/* ↑ 화살표 */}
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="19" x2="12" y2="5" />
                                <polyline points="5 12 12 5 19 12" />
                            </svg>
                        </button>
                    </div>

                    {/* 직접 문의 신청 */}
                    {onOpenConsultForm && (
                        <button onClick={() => { onClose(); onOpenConsultForm(); }} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            width: '100%', padding: '10px', background: '#e8e8e8',
                            border: 'none', color: '#777', fontSize: 12, cursor: 'pointer',
                        }}>
                            <Phone size={11} />
                            직접 문의 신청
                        </button>
                    )}
                </div>
            </div>

            {/* ── 스타일 ── */}
            <style jsx global>{`
                @keyframes dotPulse {
                    0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
                    40% { opacity: 1; transform: scale(1); }
                }
                @keyframes chatSlideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .chatbot-container {
                    inset: 0; border-radius: 0;
                }
                .chatbot-overlay { display: block; }
                @media (min-width: 768px) {
                    .chatbot-container {
                        inset: auto; right: 24px; bottom: 80px;
                        width: 400px; height: 620px; border-radius: 24px;
                    }
                    .chatbot-overlay { display: none; }
                }
            `}</style>
        </>
    );
}
