'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, ArrowRight, Phone, ChevronRight } from 'lucide-react';
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

/* ── 브랜드 아이콘 (SVG) ── */
const BotAvatar = () => (
    <div style={{
        width: 34, height: 34, borderRadius: 10,
        background: 'linear-gradient(135deg, #302E92, #4a47c4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
    }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
                stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    </div>
);

const FloatingBubbleIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
            stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

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

    // sessionStorage에 대화 저장
    useEffect(() => {
        if (messages.length > 0) {
            sessionStorage.setItem('chat_messages', JSON.stringify(messages));
        }
    }, [messages]);
    useEffect(() => {
        if (sessionId) sessionStorage.setItem('chat_session_id', sessionId);
    }, [sessionId]);
    useEffect(() => {
        sessionStorage.setItem('chat_msg_count', String(messageCount));
    }, [messageCount]);

    // 초기 인사 (저장된 대화가 없을 때만)
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            const greeting = facilityContext
                ? `안녕하세요, 대손이입니다.\n${facilityContext.name}에 대해 궁금하신 점을 편하게 물어봐 주세요.`
                : '안녕하세요, 대손이입니다.\n\n전국 봉안당·수목장·화장시설 정보를 안내해드릴게요. 어떤 장지를 찾고 계신가요?';

            setMessages([{ role: 'assistant', content: greeting, timestamp: new Date().toISOString() }]);
        }
    }, [isOpen]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

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

    const submitContact = async () => {
        if (!contactName.trim() || !contactPhone.trim()) return;
        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ customerInfo: { name: contactName, phone: contactPhone }, sessionId }),
            });
            const data = await res.json();
            setMessages(prev => [...prev, { role: 'assistant', content: data.response, timestamp: new Date().toISOString() }]);
            setShowContactForm(false);
            setContactSubmitted(true);
        } catch { /* silent */ }
    };

    // 링크 파싱
    const parseContent = (content: string) => {
        const parts = content.split(/(\[.*?\]\(.*?\))/g);
        return parts.map((part, i) => {
            const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
            if (linkMatch) {
                const [, text, url] = linkMatch;
                const facilityMatch = url.match(/facility\/(\d+)/);
                if (facilityMatch) {
                    return (
                        <button key={i} onClick={() => { onClose(); router.push(`/facility/${facilityMatch[1]}`); }}
                            style={{ color: '#302E92', fontWeight: 600, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 'inherit' }}>
                            {text}
                            <ChevronRight size={12} style={{ verticalAlign: 'middle', marginLeft: 2 }} />
                        </button>
                    );
                }
                return <a key={i} href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#302E92', fontWeight: 600 }}>{text}</a>;
            }
            return <span key={i} style={{ whiteSpace: 'pre-wrap' }}>{part}</span>;
        });
    };

    if (!isOpen) return null;

    const NAVY = '#302E92';

    return (
        <>
            {/* 오버레이 (모바일) */}
            <div onClick={onClose} className="chatbot-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9998 }} />

            {/* 컨테이너 */}
            <div className="chatbot-container" style={{
                position: 'fixed', zIndex: 9999, display: 'flex', flexDirection: 'column',
                background: '#fff', overflow: 'hidden', boxShadow: '0 12px 48px rgba(0,0,0,0.15)',
            }}>
                {/* ── 헤더 ── */}
                <div style={{
                    background: NAVY, color: '#fff', padding: '18px 20px 16px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <BotAvatar />
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.3px' }}>대손이</div>
                            <div style={{ fontSize: 11, opacity: 0.7, marginTop: 1 }}>
                                {facilityContext ? facilityContext.name : '대대손손 AI 전문 상담사'}
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff',
                        width: 30, height: 30, borderRadius: 8, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <X size={16} />
                    </button>
                </div>

                {/* ── 시설 컨텍스트 배너 ── */}
                {facilityContext && (
                    <button
                        onClick={() => { if (facilityContext.id) { onClose(); router.push(`/facility/${facilityContext.id}`); } }}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            width: '100%', background: '#f7f7fc', padding: '10px 20px',
                            border: 'none', borderBottom: '1px solid #eeecf5', cursor: 'pointer', textAlign: 'left',
                        }}
                    >
                        <div style={{ fontSize: 13, color: '#444' }}>
                            <span style={{ fontWeight: 600 }}>{facilityContext.name}</span>
                            {facilityContext.representativePrice && (
                                <span style={{ marginLeft: 8, color: NAVY, fontWeight: 700, fontSize: 13 }}>
                                    {facilityContext.representativePrice >= 10000
                                        ? `${Math.round(facilityContext.representativePrice / 10000)}만원~`
                                        : `${facilityContext.representativePrice.toLocaleString()}원~`}
                                </span>
                            )}
                        </div>
                        <ChevronRight size={16} color="#999" />
                    </button>
                )}

                {/* ── 메시지 영역 ── */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px 12px', background: '#fafafa' }}>
                    {/* 브랜드 인트로 (채널톡 스타일) */}
                    <div style={{
                        textAlign: 'center', marginBottom: 20, padding: '0 8px',
                    }}>
                        <div style={{
                            width: 44, height: 44, borderRadius: 14,
                            background: NAVY, margin: '0 auto 10px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                                <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
                                    stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#222', letterSpacing: '-0.3px' }}>대대손손</div>
                        <div style={{ fontSize: 12, color: '#888', marginTop: 4, lineHeight: 1.4 }}>
                            장지 전문 상담 · AI 대손이가 24시간 답변해드려요
                        </div>
                    </div>

                    {messages.map((msg, i) => (
                        <div key={i} style={{
                            display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                            marginBottom: 14, gap: 8, alignItems: 'flex-end',
                        }}>
                            {msg.role === 'assistant' && <BotAvatar />}
                            <div>
                                {msg.role === 'assistant' && i <= 1 && (
                                    <div style={{ fontSize: 11, color: '#999', marginBottom: 4, marginLeft: 2 }}>대손이</div>
                                )}
                                {msg.imageUrl && (
                                    <div style={{
                                        maxWidth: 200, marginBottom: 6,
                                        borderRadius: 12, overflow: 'hidden',
                                    }}>
                                        <img src={msg.imageUrl} alt="첨부 이미지" style={{
                                            width: '100%', display: 'block', borderRadius: 12,
                                        }} />
                                    </div>
                                )}
                                <div style={{
                                    maxWidth: 268, padding: '11px 14px',
                                    borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                    background: msg.role === 'user' ? NAVY : '#fff',
                                    color: msg.role === 'user' ? '#fff' : '#222',
                                    fontSize: 14, lineHeight: 1.55, letterSpacing: '-0.2px',
                                    boxShadow: msg.role === 'user' ? 'none' : '0 1px 3px rgba(0,0,0,0.06)',
                                    border: msg.role === 'user' ? 'none' : '1px solid #f0f0f0',
                                }}>
                                    {parseContent(msg.content)}
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* 타이핑 */}
                    {isLoading && (
                        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 14 }}>
                            <BotAvatar />
                            <div style={{
                                padding: '12px 16px', borderRadius: '16px 16px 16px 4px',
                                background: '#fff', border: '1px solid #f0f0f0',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                            }}>
                                <div style={{ display: 'flex', gap: 5 }}>
                                    {[0, 1, 2].map(j => (
                                        <div key={j} style={{
                                            width: 6, height: 6, borderRadius: '50%', background: '#bbb',
                                            animation: `dotPulse 1.2s ease-in-out ${j * 0.2}s infinite`,
                                        }} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── 전문 상담사 연결 카드 ── */}
                    {showContactForm && !contactSubmitted && (
                        <div style={{
                            margin: '8px 0 16px 42px', padding: 0,
                            background: '#fff', borderRadius: 14,
                            border: '1px solid #e8e6f0',
                            overflow: 'hidden',
                        }}>
                            <div style={{
                                padding: '14px 16px 10px', borderBottom: '1px solid #f3f2f8',
                            }}>
                                <div style={{ fontSize: 14, fontWeight: 700, color: '#222', marginBottom: 3 }}>
                                    전문 상담사 연결
                                </div>
                                <div style={{ fontSize: 12, color: '#888', lineHeight: 1.4 }}>
                                    연락처를 남겨주시면 담당 상담사가<br />직접 연락드리겠습니다.
                                </div>
                            </div>
                            <div style={{ padding: '12px 16px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <input type="text" placeholder="성함" value={contactName}
                                    onChange={e => setContactName(e.target.value)}
                                    style={{
                                        padding: '10px 12px', borderRadius: 8, border: '1px solid #e0e0e0',
                                        fontSize: 14, outline: 'none', transition: 'border-color 0.2s',
                                    }}
                                    onFocus={e => e.target.style.borderColor = NAVY}
                                    onBlur={e => e.target.style.borderColor = '#e0e0e0'}
                                />
                                <input type="tel" placeholder="연락처" value={contactPhone}
                                    onChange={e => setContactPhone(e.target.value)}
                                    style={{
                                        padding: '10px 12px', borderRadius: 8, border: '1px solid #e0e0e0',
                                        fontSize: 14, outline: 'none', transition: 'border-color 0.2s',
                                    }}
                                    onFocus={e => e.target.style.borderColor = NAVY}
                                    onBlur={e => e.target.style.borderColor = '#e0e0e0'}
                                />
                                <button onClick={submitContact} style={{
                                    padding: '11px', borderRadius: 8, background: NAVY,
                                    color: '#fff', border: 'none', fontWeight: 600, fontSize: 14,
                                    cursor: 'pointer', transition: 'opacity 0.2s',
                                }}>
                                    상담 신청
                                </button>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* ── 퀵 액션 ── */}
                {messageCount === 0 && (
                    <div style={{
                        padding: '8px 16px 6px', display: 'flex', gap: 6, flexWrap: 'wrap',
                        borderTop: '1px solid #f0f0f0', background: '#fff', flexShrink: 0,
                    }}>
                        {(facilityContext
                            ? ['가격이 궁금해요', '비슷한 가격대 장지', '위치·교통편', '편의시설 안내', '연락처 알려주세요', '장례 절차가 궁금해요']
                            : ['근처 봉안당 추천해주세요', '수목장이 뭔가요?', '장례 절차 안내', '가격대별 추천']
                        ).map(q => (
                            <button key={q} onClick={() => { setInput(q); }} style={{
                                padding: '7px 14px', borderRadius: 20, border: '1px solid #e4e3f0',
                                background: '#fff', color: '#555', fontSize: 12, fontWeight: 500,
                                cursor: 'pointer', transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#f7f6ff'; e.currentTarget.style.borderColor = '#c0bfe0'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e4e3f0'; }}
                            >
                                {q}
                            </button>
                        ))}
                    </div>
                )}

                {/* ── 입력 영역 ── */}
                <div style={{ borderTop: '1px solid #eee', background: '#fff', flexShrink: 0 }}>
                    {/* 이미지 미리보기 */}
                    {pendingImage && (
                        <div style={{ padding: '8px 12px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <img src={pendingImagePreview || ''} alt="미리보기" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }} />
                            <span style={{ fontSize: 12, color: '#666', flex: 1 }}>{pendingImage.name}</span>
                            <button onClick={() => { setPendingImage(null); setPendingImagePreview(null); }} style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', padding: 4 }}>
                                <X size={14} />
                            </button>
                        </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 12px 10px 10px' }}>
                        {/* 첨부파일 */}
                        <label style={{
                            width: 34, height: 34, borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', flexShrink: 0, color: '#999',
                            transition: 'color 0.2s',
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
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                            </svg>
                        </label>
                        <input
                            ref={inputRef} type="text" value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && sendMessage()}
                            placeholder="궁금한 점을 물어보세요"
                            style={{
                                flex: 1, padding: '10px 14px', borderRadius: 22,
                                border: '1px solid #e8e8e8', fontSize: 16, outline: 'none',
                                background: '#f9f9f9', transition: 'border-color 0.2s',
                            }}
                            onFocus={e => e.target.style.borderColor = '#c0bfe0'}
                            onBlur={e => e.target.style.borderColor = '#e8e8e8'}
                        />
                        <button onClick={() => sendMessage()} disabled={(!input.trim() && !pendingImage) || isLoading} style={{
                            width: 38, height: 38, borderRadius: '50%',
                            background: (input.trim() || pendingImage) ? NAVY : '#ddd', border: 'none',
                            color: '#fff', cursor: (input.trim() || pendingImage) ? 'pointer' : 'default',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, transition: 'background 0.2s',
                        }}>
                            <Send size={16} />
                        </button>
                    </div>

                    {/* 직접 상담 신청 */}
                    {onOpenConsultForm && (
                        <button onClick={() => { onClose(); onOpenConsultForm(); }} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            width: '100%', padding: '11px', background: '#fafafa',
                            border: 'none', borderTop: '1px solid #f0f0f0',
                            color: '#777', fontSize: 12, cursor: 'pointer',
                        }}>
                            <Phone size={11} />
                            직접 문의 신청
                        </button>
                    )}
                </div>
            </div>

            {/* ── 반응형 스타일 ── */}
            <style jsx global>{`
                @keyframes dotPulse {
                    0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
                    40% { opacity: 1; transform: scale(1); }
                }
                .chatbot-container {
                    inset: 0; border-radius: 0;
                }
                .chatbot-overlay { display: block; }
                @media (min-width: 768px) {
                    .chatbot-container {
                        inset: auto; right: 24px; bottom: 24px;
                        width: 380px; height: 600px; border-radius: 16px;
                    }
                    .chatbot-overlay { display: none; }
                }
            `}</style>
        </>
    );
}
