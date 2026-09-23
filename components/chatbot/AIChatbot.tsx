'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Phone, ChevronRight, Calendar, FileText, MessageSquare, Shield, Zap, Sparkles, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import LoginModal from '@/components/auth/LoginModal';

interface FacilityCard {
    id: string;
    name: string;
    category: string;
    address: string;
    isPublic: boolean | null;
    minPrice: number | null;
    matchedPrice: number | null;
    matchedItem: string | null;
    distanceKm?: number;
}

interface PricingRow {
    name: string;
    grade?: string;
    price: string;
}

interface PricingSection {
    title: string;
    rows: PricingRow[];
    maintenance?: string;
}

interface PricingTable {
    facilityName: string;
    facilityId: string;
    isPublic: boolean | null;
    sections: PricingSection[];
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp?: string;
    imageUrl?: string;
    facilityCards?: FacilityCard[];
    pricingTable?: PricingTable;
}

interface FacilityContext {
    id: number | string;
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
const MAX_TURNS = 10;

export default function AIChatbot({ isOpen, onClose, facilityContext, onOpenConsultForm }: AIChatbotProps) {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>(() => {
        if (typeof window === 'undefined') return [];
        try { return JSON.parse(sessionStorage.getItem('chat_messages') || '[]'); } catch { return []; }
    });
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [streamingText, setStreamingText] = useState<string | null>(null);
    const streamingRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(() => {
        if (typeof window === 'undefined') return null;
        return sessionStorage.getItem('chat_session_id') || null;
    });
    const [showContactForm, setShowContactForm] = useState(false);
    const [consultCardDismissed, setConsultCardDismissed] = useState(false);
    const [contactName, setContactName] = useState('');
    const [pendingImage, setPendingImage] = useState<File | null>(null);
    const [pendingImagePreview, setPendingImagePreview] = useState<string | null>(null);
    const [contactPhone, setContactPhone] = useState('');
    const [contactMethod, setContactMethod] = useState<'call' | 'kakao'>('kakao'); // 기본값을 부담 없는 카카오톡/문자로 설정
    const [contactPreferredTime, setContactPreferredTime] = useState('카톡/문자로 먼저 받기');
    const [contactNote, setContactNote] = useState('실시간 공실/할인 견적 문의');
    const [isSubmittingContact, setIsSubmittingContact] = useState(false);
    const [contactSubmitted, setContactSubmitted] = useState(false);
    const [messageCount, setMessageCount] = useState(() => {
        if (typeof window === 'undefined') return 0;
        return parseInt(sessionStorage.getItem('chat_msg_count') || '0', 10);
    });
    const [showLoginModal, setShowLoginModal] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    // 유저 로그인 시 성함/연락처 자동 채움
    useEffect(() => {
        if (user) {
            if (!contactName && user.user_metadata?.full_name) {
                setContactName(user.user_metadata.full_name);
            }
            if (!contactPhone && user.user_metadata?.phone) {
                setContactPhone(user.user_metadata.phone);
            }
        }
    }, [user, contactName, contactPhone]);

    // 전화번호 자동 포맷팅
    const formatPhoneNumber = (val: string) => {
        const nums = val.replace(/\D/g, '');
        if (nums.length <= 3) return nums;
        if (nums.length <= 7) return `${nums.slice(0, 3)}-${nums.slice(3)}`;
        return `${nums.slice(0, 3)}-${nums.slice(3, 7)}-${nums.slice(7, 11)}`;
    };

    // 로그인 후 → 제한 해제 (대화 유지, 모달만 닫기)
    useEffect(() => {
        if (user && showLoginModal) {
            setShowLoginModal(false);
        }
    }, [user]);

    const prevFacilityIdRef = useRef<string | number | null>(null);

    /* ── 스트리밍 인터벌 cleanup (버그 #9) ── */
    useEffect(() => {
        return () => {
            if (streamingRef.current) clearInterval(streamingRef.current);
        };
    }, []);

    /* ── 시설 전환 시 대화 컨텍스트 갱신 (버그 #4: sessionId 초기화) ── */
    useEffect(() => {
        const currentId = facilityContext?.id ?? null;
        if (prevFacilityIdRef.current !== null && currentId !== null && String(currentId) !== String(prevFacilityIdRef.current)) {
            // 시설이 바뀌었으면 대화를 새 시설 기준으로 시작
            const greeting = currentId && facilityContext
                ? `안녕하세요, 대손이입니다.\n${facilityContext.name}에 대해 궁금하신 점을 편하게 물어봐 주세요.`
                : '안녕하세요, 대손이입니다.\n궁금하신 점을 편하게 물어봐 주세요.';
            setMessages([{ role: 'assistant', content: greeting, timestamp: new Date().toISOString() }]);
            setSessionId(null);
            sessionStorage.removeItem('chat_session_id');
            setMessageCount(0);
            sessionStorage.setItem('chat_msg_count', '0');
        }
        prevFacilityIdRef.current = currentId;
    }, [facilityContext]);

    /* ── 초기 인사 ── */
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            const greeting = facilityContext
                ? `안녕하세요, 대손이입니다.\n${facilityContext.name}에 대해 궁금하신 점을 편하게 물어봐 주세요.`
                : '안녕하세요, 대손이입니다.\n궁금하신 점을 편하게 물어봐 주세요.';
            setMessages([{ role: 'assistant', content: greeting, timestamp: new Date().toISOString() }]);
        }
    }, [isOpen, facilityContext]);

    /* ── 세션 저장 (버그 #12: 볼륨오버 방지 - 카드/테이블 제외) ── */
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const lite = messages.map(m => ({ role: m.role, content: m.content, timestamp: m.timestamp }));
        try { sessionStorage.setItem('chat_messages', JSON.stringify(lite)); } catch { /* quota exceeded */ }
    }, [messages]);
    useEffect(() => {
        if (sessionId) sessionStorage.setItem('chat_session_id', sessionId);
    }, [sessionId]);
    useEffect(() => {
        if (typeof window === 'undefined') return;
        sessionStorage.setItem('chat_msg_count', messageCount.toString());
    }, [messageCount]);

    /* ── 스크롤 (즉시 최하단) ── */
    useEffect(() => {
        if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'instant' as ScrollBehavior });
    }, [messages, isLoading, isOpen, streamingText]);

    /* ── Focus ── */
    useEffect(() => {
        if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
    }, [isOpen]);

    /* ── 메시지 전송 ── */
    const sendMessage = useCallback(async (overrideText?: string) => {
        const textToSend = (typeof overrideText === 'string' ? overrideText : input).trim();
        if ((!textToSend && !pendingImage) || isLoading || streamingText !== null) return;
        // 상담 신청 완료 후 추가 메시지 차단
        if (contactSubmitted) return;
        // 대화가 6턴 이상 진행되고 아직 상담 신청 안 한 경우 부드럽게 상담 폼 안내
        if (!contactSubmitted && messageCount >= 6 && !showContactForm) {
            setShowContactForm(true);
        }
        // 버그 #3: 기존 스트리밍 인터벌 정리
        if (streamingRef.current) { clearInterval(streamingRef.current); streamingRef.current = null; }
        const userMsg = textToSend || (pendingImage ? '(이미지 첨부)' : '');
        const imageUrl = pendingImagePreview || undefined;
        if (!overrideText) setInput('');
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
                body: JSON.stringify({ message: msgToSend, history: messages.slice(-20), sessionId, facilityContext }),
            });
            const data = await res.json();
            if (data.sessionId) setSessionId(data.sessionId);

            if (!res.ok || data.error) {
                const errorMsg = data.error || '상담 서비스에 일시적인 지연이 발생했어요. 잠시 후 다시 시도해 주세요.';
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: errorMsg,
                    timestamp: new Date().toISOString(),
                }]);
                return;
            }

            const fullText = data.response || '죄송합니다. 잠시 후 다시 시도해주세요.';

            // 타이핑 스트리밍 효과
            setIsLoading(false);
            setStreamingText('');
            let idx = 0;
            streamingRef.current = setInterval(() => {
                idx += 2;
                const chunk = fullText.slice(0, idx);
                setStreamingText(chunk);
                if (idx >= fullText.length) {
                    if (streamingRef.current) clearInterval(streamingRef.current);
                    streamingRef.current = null;
                    setStreamingText(null);
                    setMessages(prev => [...prev, {
                        role: 'assistant',
                        content: fullText,
                        timestamp: new Date().toISOString(),
                        facilityCards: data.facilityCards || undefined,
                        pricingTable: data.pricingTable || undefined,
                    }]);
                }
            }, 15);

            if (data.showContactForm) setShowContactForm(true);
            return;
        } catch {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: '네트워크 오류가 발생했어요. 잠시 후 다시 시도해주세요.',
                timestamp: new Date().toISOString(),
            }]);
        } finally {
            setIsLoading(false);
        }
    }, [input, isLoading, messages, sessionId, facilityContext, messageCount, contactSubmitted, showContactForm, pendingImage, pendingImagePreview, streamingText, user]);

    /* ── 상담 폼 제출 (리드 수집 & 대표님 알림) ── */
    const submitContact = async () => {
        if (!contactName.trim() || !contactPhone.trim() || isSubmittingContact) return;
        setIsSubmittingContact(true);
        try {
            const recentUserMsgs = messages
                .filter(m => m.role === 'user')
                .map(m => m.content)
                .slice(-3)
                .join(' | ');

            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId,
                    customerInfo: {
                        name: contactName.trim(),
                        phone: contactPhone.trim(),
                        contactMethod,
                        preferredTime: contactPreferredTime,
                        note: contactNote,
                        facilityName: facilityContext?.name || null,
                        recentSummary: recentUserMsgs || '장지 비교 및 견적 문의',
                    }
                }),
            });
            const data = await res.json();
            const contactMethodLabel = contactMethod === 'kakao' ? '카카오톡/문자' : '전화';
            const defaultGreeting = `**${contactName}님, 맞춤 상담 신청이 정상 접수되었습니다.**\n\n불쑥 전화를 드리지 않으니 안심하세요! 대대손손 수석 상담사(대표)가 선택해주신 **[${contactPreferredTime}]**에 맞춰, 남겨주신 연락처(${contactPhone})로 **${contactMethodLabel} 맞춤 비교자료 및 비공개 견적**을 먼저 정성껏 보내드리겠습니다.\n\n그동안 대손이에게 시설이나 가격에 대해 편하게 더 물어보세요.`;
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.response || defaultGreeting,
                timestamp: new Date().toISOString()
            }]);
            setContactSubmitted(true);
            setShowContactForm(false);
            if (typeof window !== 'undefined' && (window as any).gtag) {
                (window as any).gtag('event', '상담신청_접수', {
                    method: contactMethod,
                    facility: facilityContext?.name || '일반'
                });
            }
        } catch {
            alert('상담 신청 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        } finally {
            setIsSubmittingContact(false);
        }
    };

    /* ── 마크다운 링크 + 볼드 렌더링 ── */
    const renderContent = (text: string) => {
        // * 이탤릭 제거 (볼드는 유지)
        let cleaned = text.replace(/(?<!\*)\*(?!\*)(.*?)\*(?!\*)/g, '$1');

        // URL을 감지하여 클릭 가능한 버튼으로 변환
        const urlRegex = /(https?:\/\/[^\s),]+)/;
        const parts = cleaned.split(urlRegex);

        return parts.map((part, i) => {
            if (/^https?:\/\//.test(part)) {
                // 시설 상세 페이지 URL인지 확인
                const facilityMatch = part.match(/daedaesonson\.com\/facility\/(park-\d+)/);
                if (facilityMatch) {
                    return (
                        <a key={i} href={`/facility/${facilityMatch[1]}`}
                            onClick={(e) => { e.preventDefault(); router.push(`/facility/${facilityMatch[1]}`); onClose(); }}
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                background: '#EEEDFA', color: NAVY,
                                borderRadius: 20, padding: '6px 14px',
                                fontSize: 13, fontWeight: 600,
                                textDecoration: 'none', cursor: 'pointer',
                                margin: '4px 0',
                            }}>
                            바로가기
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
                                    display: 'inline-flex', alignItems: 'center', gap: 4,
                                    background: '#EEEDFA', color: NAVY,
                                    borderRadius: 20, padding: '6px 14px',
                                    fontSize: 13, fontWeight: 600,
                                    textDecoration: 'none', cursor: 'pointer',
                                    margin: '4px 0',
                                }}>
                                {mdMatch[1] || '바로가기'}
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
                // **볼드** 처리
                const boldParts = mdPart.split(/(\*\*.*?\*\*)/g);
                return boldParts.map((bp, bk) => {
                    const boldMatch = bp.match(/^\*\*(.*?)\*\*$/);
                    if (boldMatch) return <strong key={`${i}-${j}-${bk}`} style={{ fontWeight: 700 }}>{boldMatch[1]}</strong>;
                    return <span key={`${i}-${j}-${bk}`}>{bp}</span>;
                });
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
                    }} aria-label="닫기">
                        <X size={20} />
                    </button>
                </div>

                {/* ── 상단 실시간 상담 전환 바 (Sticky CTA Bar) ── */}
                <div style={{
                    backgroundColor: '#1D0098',
                    color: '#ffffff',
                    padding: '8px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: 12,
                    boxShadow: '0 2px 6px rgba(29,0,152,0.15)',
                    flexShrink: 0,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
                        <Zap size={14} color="#ffd43b" style={{ flexShrink: 0 }} />
                        <span style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            실시간 공실·비공개 할인 1:1 맞춤 안내
                        </span>
                    </div>
                    <button
                        onClick={() => setShowContactForm(true)}
                        style={{
                            backgroundColor: '#ffffff',
                            color: '#1D0098',
                            border: 'none',
                            borderRadius: 12,
                            padding: '4px 10px',
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                            flexShrink: 0,
                            marginLeft: 8,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                        }}
                    >
                        <Calendar size={12} />
                        <span>상담 예약</span>
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
                    {messages.map((msg, i) => {
                        // AI 응답에서 {{선택1|선택2}} 빠른 응답 파싱
                        const quickReplies: string[] = [];
                        let displayContent = msg.content;
                        if (msg.role === 'assistant') {
                            const qrMatch = msg.content.match(/\{\{(.+?)\}\}/);
                            if (qrMatch) {
                                displayContent = msg.content.replace(/\{\{.+?\}\}/, '').trim();
                                qrMatch[1].split('|').forEach(s => quickReplies.push(s.trim()));
                            }
                        }
                        const isLastAssistant = msg.role === 'assistant' && i === messages.length - 1;

                        return (
                        <div key={i}>
                        <div style={{
                            display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                            marginBottom: quickReplies.length > 0 && isLastAssistant ? 6 : 10, alignItems: 'flex-end', gap: 6,
                        }}>

                            <div style={{ maxWidth: msg.role === 'user' ? '75%' : '100%' }}>
                                {/* 이미지 첨부 */}
                                {msg.imageUrl && (
                                    <div style={{ marginBottom: 6, borderRadius: 14, overflow: 'hidden', maxWidth: 200 }}>
                                        <img src={msg.imageUrl} alt="첨부" style={{ width: '100%', display: 'block' }} />
                                    </div>
                                )}
                                {/* 말풍선 */}
                                <div style={{
                                    padding: msg.role === 'user' ? '10px 14px' : '6px 2px',
                                    borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '0',
                                    background: msg.role === 'user' ? NAVY : 'transparent',
                                    color: msg.role === 'user' ? '#fff' : '#1a1a1a',
                                    fontSize: 15, lineHeight: 1.55, letterSpacing: '-0.2px',
                                    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                                }}>
                                    {renderContent(displayContent)}
                                </div>
                                {/* 시설 비교 카드 */}
                                {msg.facilityCards && msg.facilityCards.length > 0 && (
                                    <div
                                        onMouseDown={e => {
                                            const el = e.currentTarget;
                                            el.dataset.dragging = 'true';
                                            el.dataset.startX = String(e.pageX - el.offsetLeft);
                                            el.dataset.scrollLeft = String(el.scrollLeft);
                                            el.style.cursor = 'grabbing';
                                        }}
                                        onMouseMove={e => {
                                            const el = e.currentTarget;
                                            if (el.dataset.dragging !== 'true') return;
                                            e.preventDefault();
                                            const x = e.pageX - el.offsetLeft;
                                            const walk = (x - Number(el.dataset.startX)) * 1.5;
                                            el.scrollLeft = Number(el.dataset.scrollLeft) - walk;
                                        }}
                                        onMouseUp={e => { e.currentTarget.dataset.dragging = 'false'; e.currentTarget.style.cursor = 'grab'; }}
                                        onMouseLeave={e => { e.currentTarget.dataset.dragging = 'false'; e.currentTarget.style.cursor = 'grab'; }}
                                        style={{
                                            display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6, marginTop: 10,
                                            scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch',
                                            msOverflowStyle: 'none', scrollbarWidth: 'none', cursor: 'grab',
                                        }}>
                                        {msg.facilityCards.map((card, ci) => (
                                            <div key={ci} style={{
                                                minWidth: 190, maxWidth: 200, background: '#fff', borderRadius: 14,
                                                border: '1px solid #e8e8e8', padding: '14px 14px 10px',
                                                scrollSnapAlign: 'start', flexShrink: 0,
                                                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                                            }}>
                                                {/* 뱃지 */}
                                                <div style={{ display: 'flex', gap: 5, marginBottom: 8, flexWrap: 'wrap' }}>
                                                    <span style={{
                                                        fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10,
                                                        background: '#EEEDFA', color: NAVY,
                                                    }}>{card.category}</span>
                                                    {card.isPublic !== null && (
                                                        <span style={{
                                                            fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10,
                                                            background: card.isPublic ? '#E8F4FD' : '#FFF3E0',
                                                            color: card.isPublic ? '#1565C0' : '#E65100',
                                                        }}>{card.isPublic ? '공립' : '민간'}</span>
                                                    )}
                                                </div>
                                                {/* 시설명 */}
                                                <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 4, lineHeight: 1.3 }}>
                                                    {card.name}
                                                </div>
                                                {/* 주소 + 거리 */}
                                                <div style={{ fontSize: 12, color: '#888', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                                        <MapPin size={12} color="#888" style={{ flexShrink: 0 }} />
                                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{card.address}</span>
                                                    </span>
                                                    {card.distanceKm !== undefined && (
                                                        <span style={{
                                                            fontSize: 11, fontWeight: 600, padding: '1px 6px', borderRadius: 8,
                                                            background: NAVY, color: '#fff', whiteSpace: 'nowrap',
                                                        }}>{card.distanceKm}km</span>
                                                    )}
                                                </div>
                                                {/* 가격 */}
                                                <div style={{ fontSize: 13, fontWeight: 600, color: NAVY, marginBottom: 10 }}>
                                                    {card.matchedPrice ? (
                                                        <><span style={{ fontSize: 11, color: '#888', fontWeight: 400 }}>매칭 </span>{card.matchedPrice}만원</>
                                                    ) : card.minPrice ? (
                                                        <>{card.minPrice}만원~</>
                                                    ) : (
                                                        <span style={{ color: '#aaa', fontWeight: 400 }}>가격 문의</span>
                                                    )}
                                                </div>
                                                {/* 자세히 보기 */}
                                                <button
                                                    onClick={() => { router.push(`/facility/${card.id}`); onClose(); }}
                                                    style={{
                                                        width: '100%', padding: '8px 0', borderRadius: 8,
                                                        border: `1px solid ${NAVY}`, background: 'transparent',
                                                        color: NAVY, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                                        transition: 'all 0.15s',
                                                    }}
                                                    onMouseEnter={e => { e.currentTarget.style.background = NAVY; e.currentTarget.style.color = '#fff'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = NAVY; }}
                                                >
                                                    자세히 보기
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {/* 가격표 인라인 테이블 */}
                                {msg.pricingTable && (
                                    <div style={{
                                        marginTop: 10, borderRadius: 14, overflow: 'hidden',
                                        border: '1px solid #e0e0e0', background: '#fff',
                                    }}>
                                        {/* 헤더 */}
                                        <div style={{
                                            background: NAVY, color: '#fff', padding: '10px 14px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        }}>
                                            <div style={{ fontSize: 14, fontWeight: 700 }}>
                                                💰 {msg.pricingTable.facilityName}
                                            </div>
                                            {msg.pricingTable.isPublic !== null && (
                                                <span style={{
                                                    fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 8,
                                                    background: 'rgba(255,255,255,0.2)', color: '#fff',
                                                }}>{msg.pricingTable.isPublic ? '공립' : '민간'}</span>
                                            )}
                                        </div>
                                        {/* 섹션 */}
                                        {msg.pricingTable.sections.map((sec, si) => (
                                            <div key={si}>
                                                <div style={{
                                                    background: '#f8f8fa', padding: '7px 14px',
                                                    fontSize: 12, fontWeight: 700, color: '#555',
                                                    borderBottom: '1px solid #eee',
                                                }}>{sec.title}</div>
                                                {sec.rows.map((row, ri) => (
                                                    <div key={ri} style={{
                                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                        padding: '7px 14px', borderBottom: '1px solid #f2f2f2',
                                                        fontSize: 13,
                                                    }}>
                                                        <div style={{ color: '#333', flex: 1 }}>
                                                            {row.name}
                                                            {row.grade && (
                                                                <span style={{
                                                                    fontSize: 10, color: '#999', marginLeft: 5,
                                                                    background: '#f5f5f5', padding: '1px 5px', borderRadius: 4,
                                                                }}>{row.grade}</span>
                                                            )}
                                                        </div>
                                                        <div style={{ fontWeight: 600, color: NAVY, whiteSpace: 'nowrap' }}>
                                                            {row.price}
                                                        </div>
                                                    </div>
                                                ))}
                                                {sec.maintenance && (
                                                    <div style={{
                                                        padding: '6px 14px', fontSize: 11, color: '#888',
                                                        background: '#fafafa', borderBottom: '1px solid #eee',
                                                    }}>🔄 {sec.maintenance}</div>
                                                )}
                                            </div>
                                        ))}
                                        {/* 자세히 보기 */}
                                        <button
                                            onClick={() => { router.push(`/facility/${msg.pricingTable!.facilityId}`); onClose(); }}
                                            style={{
                                                width: '100%', padding: '10px 0', border: 'none',
                                                background: '#f8f8fa', color: NAVY, fontSize: 13, fontWeight: 600,
                                                cursor: 'pointer', transition: 'background 0.15s',
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.background = '#EEEDFA'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = '#f8f8fa'; }}
                                        >
                                            시설 상세 보기 →
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        {/* 빠른 응답 버튼 (마지막 AI 메시지에서만, 상담 신청 전) */}
                        {isLastAssistant && quickReplies.length > 0 && !isLoading && !contactSubmitted && (
                            <div style={{
                                display: 'flex', flexWrap: 'wrap', gap: 8,
                                justifyContent: 'flex-end',
                                marginBottom: 12, paddingRight: 4,
                            }}>
                                {quickReplies.map((qr, qi) => (
                                    <button key={qi}
                                        onClick={() => {
                                            if (isLoading || streamingText !== null) return;
                                            if (!user && messageCount >= MAX_TURNS) {
                                                setShowLoginModal(true);
                                                return;
                                            }
                                            // "연락처 남기기" 선택 시 바로 폼 표시 (API 호출 불필요)
                                            if (qr.includes('연락처')) {
                                                setMessages(prev => [...prev, { role: 'user', content: qr, timestamp: new Date().toISOString() }]);
                                                setTimeout(() => setShowContactForm(true), 300);
                                                return;
                                            }
                                            sendMessage(qr);
                                        }}
                                        style={{
                                            background: '#fff',
                                            border: '1px solid #e0e0e0',
                                            borderRadius: 20,
                                            padding: '8px 16px',
                                            fontSize: 14, fontWeight: 500,
                                            color: '#333',
                                            cursor: 'pointer',
                                            transition: 'all 0.15s',
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.borderColor = NAVY; e.currentTarget.style.color = NAVY; }}
                                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#e0e0e0'; e.currentTarget.style.color = '#333'; }}
                                    >
                                        {qr}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* ── 5턴 이상 또는 시설 2개 이상 추천 시 전문가 1:1 상담 매칭 카드 (따라다니지 않게 늦게 노출 + 닫기 지원) ── */}
                        {isLastAssistant && !consultCardDismissed && (messages.filter(m => m.role === 'user').length >= 5 || (msg.facilityCards && msg.facilityCards.length >= 2)) && !contactSubmitted && !showContactForm && (
                            <div style={{
                                marginTop: 12,
                                marginBottom: 14,
                                background: 'linear-gradient(135deg, #f8f9ff 0%, #eef2ff 100%)',
                                border: '1.5px solid #bac8ff',
                                borderRadius: 16,
                                padding: '14px 16px',
                                boxShadow: '0 4px 14px rgba(48,46,146,0.08)',
                                position: 'relative',
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span style={{
                                            background: '#1D0098', color: '#fff', fontSize: 10,
                                            fontWeight: 700, padding: '2px 7px', borderRadius: 6,
                                            display: 'flex', alignItems: 'center', gap: 3
                                        }}>
                                            <Sparkles size={10} />
                                            <span>대대손손 직영</span>
                                        </span>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: '#1a1b4b' }}>
                                            수석 장지 상담사(대표) 1:1 무료 상담
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => setConsultCardDismissed(true)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#999' }}
                                        aria-label="안내 닫기"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                                <div style={{ fontSize: 12, color: '#495057', lineHeight: 1.5, marginBottom: 12 }}>
                                    조건에 맞는 시설의 실시간 잔여 자리와 비공개 프로모션 할인을 맞춤 안내해 드립니다.
                                </div>
                                <button
                                    onClick={() => setShowContactForm(true)}
                                    style={{
                                        width: '100%',
                                        background: '#1D0098',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: 10,
                                        padding: '11px 0',
                                        fontSize: 13,
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 6,
                                        boxShadow: '0 2px 6px rgba(29,0,152,0.25)',
                                    }}
                                >
                                    <Calendar size={14} />
                                    <span>상담 예약하기</span>
                                </button>
                            </div>
                        )}
                        </div>
                    );
                    })}

                    {/* 타이핑 스트리밍 */}
                    {streamingText !== null && (
                        <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 10, alignItems: 'flex-end', gap: 6 }}>
                            <div style={{
                                maxWidth: '75%', padding: '12px 16px', borderRadius: '18px 18px 18px 4px',
                                background: '#ffffff', fontSize: 14, lineHeight: 1.6, color: '#1a1a1a',
                                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                            }}>
                                {renderContent(streamingText)}
                                <span style={{ display: 'inline-block', width: 2, height: 14, background: '#302E92', marginLeft: 2, animation: 'cursorBlink 0.8s step-end infinite', verticalAlign: 'text-bottom' }} />
                            </div>
                        </div>
                    )}

                    {/* 로딩 (사고 중) */}
                    {isLoading && (
                        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', marginBottom: 10 }}>
                            <div style={{
                                padding: '12px 18px', borderRadius: 18, background: '#ffffff',
                                display: 'flex', gap: 5, alignItems: 'center',
                            }}>
                                <span style={{ fontSize: 13, color: '#888', marginRight: 4 }}>생각 중</span>
                                {[0, 1, 2].map(n => (
                                    <div key={n} style={{
                                        width: 7, height: 7, borderRadius: '50%', background: '#bbb',
                                        animation: `dotPulse 1.2s ease infinite ${n * 0.15}s`,
                                    }} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── 프리미엄 상담 신청 폼 ── */}
                    {showContactForm && !contactSubmitted && (
                        <div style={{
                            background: '#ffffff',
                            borderRadius: 16,
                            padding: '18px',
                            marginTop: 10,
                            marginBottom: 10,
                            border: '1.5px solid #1D0098',
                            boxShadow: '0 8px 24px rgba(29,0,152,0.12)',
                            animation: 'contactFormSlide 0.35s ease-out',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                <div>
                                    <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <FileText size={16} color="#1D0098" />
                                        <span>수석 상담사(대표) 1:1 맞춤 견적 신청</span>
                                    </div>
                                    <div style={{ fontSize: 12, color: '#4b5563', marginTop: 4, lineHeight: 1.4 }}>
                                        모르는 번호로 불쑥 전화드리지 않습니다. 원하시는 시간대에 맞춰 맞춤 자료를 먼저 보내드립니다.
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowContactForm(false)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#999' }}
                                    aria-label="닫기"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* 연락 방식 선택 */}
                            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                                <button
                                    type="button"
                                    onClick={() => setContactMethod('kakao')}
                                    style={{
                                        flex: 1,
                                        padding: '8px 0',
                                        borderRadius: 8,
                                        fontSize: 12,
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        border: contactMethod === 'kakao' ? '1.5px solid #FEE500' : '1px solid #dee2e6',
                                        background: contactMethod === 'kakao' ? '#FEF9C3' : '#f8f9fa',
                                        color: contactMethod === 'kakao' ? '#854D0E' : '#666',
                                        transition: 'all 0.15s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 5,
                                    }}
                                >
                                    <MessageSquare size={13} />
                                    <span>카카오톡/문자 우선</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setContactMethod('call')}
                                    style={{
                                        flex: 1,
                                        padding: '8px 0',
                                        borderRadius: 8,
                                        fontSize: 12,
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        border: contactMethod === 'call' ? '1.5px solid #1D0098' : '1px solid #dee2e6',
                                        background: contactMethod === 'call' ? '#eef2ff' : '#f8f9fa',
                                        color: contactMethod === 'call' ? '#1D0098' : '#666',
                                        transition: 'all 0.15s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 5,
                                    }}
                                >
                                    <Phone size={13} />
                                    <span>전화 통화 희망</span>
                                </button>
                            </div>

                            {/* 희망 연락 시간대 선택 (우리 정식 시스템 연계) */}
                            <div style={{ marginBottom: 10 }}>
                                <div style={{ fontSize: 11, fontWeight: 600, color: '#666', marginBottom: 4 }}>
                                    희망 연락 시간대
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                    {[
                                        '카톡/문자로 먼저 받기',
                                        '낮 시간(09~18시)',
                                        '퇴근 후(18~21시)',
                                        '주말 희망',
                                        '시간 무관',
                                    ].map(time => (
                                        <button
                                            key={time}
                                            type="button"
                                            onClick={() => setContactPreferredTime(time)}
                                            style={{
                                                padding: '5px 9px',
                                                borderRadius: 6,
                                                fontSize: 11,
                                                fontWeight: 500,
                                                cursor: 'pointer',
                                                border: contactPreferredTime === time ? '1.5px solid #1D0098' : '1px solid #e5e7eb',
                                                background: contactPreferredTime === time ? '#1D0098' : '#fff',
                                                color: contactPreferredTime === time ? '#fff' : '#4b5563',
                                                transition: 'all 0.15s ease',
                                            }}
                                        >
                                            {time}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 이름 입력 */}
                            <div style={{ marginBottom: 8 }}>
                                <input
                                    value={contactName}
                                    onChange={e => setContactName(e.target.value)}
                                    placeholder="성함 (예: 홍길동)"
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        borderRadius: 8,
                                        border: '1px solid #dee2e6',
                                        fontSize: 14,
                                        outline: 'none',
                                        boxSizing: 'border-box',
                                        backgroundColor: '#fafafa',
                                    }}
                                />
                            </div>

                            {/* 연락처 입력 */}
                            <div style={{ marginBottom: 12 }}>
                                <input
                                    value={contactPhone}
                                    onChange={e => setContactPhone(formatPhoneNumber(e.target.value))}
                                    placeholder="휴대전화번호 (010-0000-0000)"
                                    type="tel"
                                    maxLength={13}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        borderRadius: 8,
                                        border: '1px solid #dee2e6',
                                        fontSize: 14,
                                        outline: 'none',
                                        boxSizing: 'border-box',
                                        backgroundColor: '#fafafa',
                                    }}
                                />
                            </div>

                            {/* 제출 버튼 */}
                            <button
                                onClick={submitContact}
                                disabled={!contactName.trim() || contactPhone.replace(/\D/g, '').length < 10 || isSubmittingContact}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: 10,
                                    background: (!contactName.trim() || contactPhone.replace(/\D/g, '').length < 10 || isSubmittingContact) ? '#ced4da' : '#1D0098',
                                    color: '#ffffff',
                                    border: 'none',
                                    fontSize: 14,
                                    fontWeight: 700,
                                    cursor: (!contactName.trim() || contactPhone.replace(/\D/g, '').length < 10 || isSubmittingContact) ? 'not-allowed' : 'pointer',
                                    boxShadow: '0 2px 8px rgba(29,0,152,0.25)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 6,
                                }}
                            >
                                <Calendar size={15} />
                                <span>{isSubmittingContact ? '예약 접수 중...' : '상담 예약하기'}</span>
                            </button>

                            <div style={{ fontSize: 11, color: '#6b7280', textAlign: 'center', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                                <Shield size={12} color="#6b7280" />
                                <span>고객님의 소중한 정보는 상담 목적으로만 안전하게 사용되며 스팸은 없습니다.</span>
                            </div>
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
                            <button key={q} onClick={() => sendMessage(q)} style={{
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
                <div style={{ background: '#ffffff', flexShrink: 0 }}>
                    {/* 상담 신청 완료 상태 */}
                    {contactSubmitted ? (
                        <div style={{
                            padding: '20px 16px', textAlign: 'center',
                            background: '#f0f8f0', borderTop: '1px solid #e0e8e0',
                        }}>
                            <div style={{ fontSize: 15, fontWeight: 700, color: '#2e7d32', marginBottom: 6 }}>
                                ✅ 상담 신청이 완료되었습니다
                            </div>
                            <div style={{ fontSize: 13, color: '#666', marginBottom: 14 }}>
                                전문 상담사가 빠르게 연락드릴게요.
                            </div>
                            <button onClick={() => {
                                setContactSubmitted(false);
                                setMessageCount(0);
                                setMessages([]);
                                setSessionId(null);
                                setContactName('');
                                setContactPhone('');
                                sessionStorage.removeItem('chat_session_id');
                                sessionStorage.setItem('chat_msg_count', '0');
                                sessionStorage.removeItem('chat_messages');
                            }} style={{
                                padding: '10px 24px', borderRadius: 10,
                                background: '#fff', color: NAVY, border: `1px solid ${NAVY}`,
                                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                            }}>
                                🔄 새 대화 시작
                            </button>
                        </div>
                    ) : !user && messageCount >= MAX_TURNS ? (
                        <div style={{
                            padding: '16px', textAlign: 'center',
                            background: '#f8f8fc', borderTop: '1px solid #f0f0f0',
                        }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#333', marginBottom: 6 }}>
                                무료 상담 {MAX_TURNS}회를 모두 사용했어요
                            </div>
                            <div style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>
                                더 자세한 상담은 아래 방법을 이용해 주세요.
                            </div>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                                {onOpenConsultForm && (
                                    <button onClick={() => { onClose(); onOpenConsultForm(); }} style={{
                                        padding: '10px 20px', borderRadius: 10,
                                        background: NAVY, color: '#fff', border: 'none',
                                        fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                        display: 'inline-flex', alignItems: 'center', gap: 6,
                                    }}>
                                        <Calendar size={13} />
                                        <span>직접 상담 신청</span>
                                    </button>
                                )}
                                <button onClick={() => {
                                    if (user) {
                                        setMessageCount(0);
                                        setMessages([]);
                                        setSessionId(null);
                                        sessionStorage.removeItem('chat_session_id');
                                        sessionStorage.setItem('chat_msg_count', '0');
                                        sessionStorage.removeItem('chat_messages');
                                    } else {
                                        setShowLoginModal(true);
                                    }
                                }} style={{
                                    padding: '10px 20px', borderRadius: 10,
                                    background: '#fff', color: NAVY, border: `1px solid ${NAVY}`,
                                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                }}>
                                    {user ? '🔄 새 상담 시작' : '🔑 로그인 후 계속하기'}
                                </button>
                            </div>
                        </div>
                    ) : (
                    <>
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
                    </>)}

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
                @keyframes contactFormSlide {
                    from { opacity: 0; transform: translateY(10px); max-height: 0; }
                    to { opacity: 1; transform: translateY(0); max-height: 300px; }
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

            {/* 로그인 모달 */}
            <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
        </>
    );
}
