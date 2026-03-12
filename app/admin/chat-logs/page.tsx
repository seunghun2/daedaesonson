'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    MessageCircle, Phone, User, Calendar, ArrowLeft,
    Search, Check, CheckCheck, Clock, ExternalLink, ChevronDown
} from 'lucide-react';

interface ChatSession {
    id: string;
    facility_id: number | null;
    messages: Array<{ role: string; content: string; timestamp?: string }>;
    customer_name: string | null;
    customer_phone: string | null;
    status: string;
    user_agent: string;
    created_at: string;
    updated_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    new: { label: '새 상담', color: '#e53e3e', bg: '#fff5f5', icon: Clock },
    reviewed: { label: '확인 완료', color: '#dd6b20', bg: '#fffaf0', icon: Check },
    contacted: { label: '연락 완료', color: '#38a169', bg: '#f0fff4', icon: CheckCheck },
};

export default function AdminChatLogs() {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const router = useRouter();

    const fetchSessions = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/chat-logs');
            const data = await res.json();
            setSessions(data.sessions || []);
        } catch {
            console.error('세션 로딩 실패');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchSessions(); }, [fetchSessions]);

    const updateStatus = async (sessionId: string, status: string) => {
        try {
            await fetch('/api/admin/chat-logs', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, status }),
            });
            setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, status } : s));
            if (selectedSession?.id === sessionId) {
                setSelectedSession(prev => prev ? { ...prev, status } : null);
            }
        } catch {
            alert('상태 업데이트 실패');
        }
    };

    const filteredSessions = sessions.filter(s => {
        const matchesSearch = searchTerm === '' ||
            s.customer_name?.includes(searchTerm) ||
            s.customer_phone?.includes(searchTerm) ||
            s.messages?.some(m => m.content.includes(searchTerm));
        const matchesStatus = filterStatus === 'all' || s.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

    const getLastMessage = (session: ChatSession) => {
        if (!session.messages?.length) return '메시지 없음';
        const last = session.messages[session.messages.length - 1];
        return last.content.slice(0, 60) + (last.content.length > 60 ? '...' : '');
    };

    const NAVY = '#302E92';

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#888' }}>
                로딩 중...
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
            {/* 헤더 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <button
                    onClick={() => router.push('/admin')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a2e', margin: 0 }}>
                        💬 AI 상담 관리
                    </h1>
                    <p style={{ fontSize: 13, color: '#888', margin: 0 }}>
                        총 {sessions.length}건 · 새 상담 {sessions.filter(s => s.status === 'new').length}건
                    </p>
                </div>
            </div>

            {/* 검색 + 필터 */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <div style={{
                    flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 12px', borderRadius: 8, border: '1px solid #e0e0e0', background: '#fff',
                }}>
                    <Search size={16} color="#aaa" />
                    <input
                        type="text"
                        placeholder="이름, 전화번호, 내용 검색..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14 }}
                    />
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                    {['all', 'new', 'reviewed', 'contacted'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            style={{
                                padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500,
                                border: filterStatus === status ? `1px solid ${NAVY}` : '1px solid #e0e0e0',
                                background: filterStatus === status ? `${NAVY}10` : '#fff',
                                color: filterStatus === status ? NAVY : '#666',
                                cursor: 'pointer',
                            }}
                        >
                            {status === 'all' ? '전체' : STATUS_CONFIG[status]?.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* 레이아웃: 리스트 + 상세 */}
            <div style={{ display: 'flex', gap: 16, minHeight: 'calc(100vh - 200px)' }}>
                {/* 세션 목록 */}
                <div style={{
                    width: selectedSession ? '40%' : '100%',
                    transition: 'width 0.3s',
                    overflowY: 'auto',
                }}>
                    {filteredSessions.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>
                            상담 내역이 없습니다.
                        </div>
                    ) : (
                        filteredSessions.map(session => {
                            const statusCfg = STATUS_CONFIG[session.status] || STATUS_CONFIG.new;
                            const StatusIcon = statusCfg.icon;
                            return (
                                <div
                                    key={session.id}
                                    onClick={() => setSelectedSession(session)}
                                    style={{
                                        padding: '14px 16px',
                                        borderRadius: 12,
                                        border: selectedSession?.id === session.id ? `2px solid ${NAVY}` : '1px solid #eee',
                                        background: selectedSession?.id === session.id ? '#f8f8ff' : '#fff',
                                        marginBottom: 8,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            {session.customer_name ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <User size={14} color={NAVY} />
                                                    <span style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>{session.customer_name}</span>
                                                </div>
                                            ) : (
                                                <span style={{ fontSize: 14, color: '#999' }}>익명 사용자</span>
                                            )}
                                            {session.customer_phone && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                                    <Phone size={11} color="#888" />
                                                    <span style={{ fontSize: 12, color: '#666' }}>{session.customer_phone}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: 4,
                                            padding: '2px 8px', borderRadius: 10,
                                            background: statusCfg.bg, color: statusCfg.color,
                                            fontSize: 11, fontWeight: 600,
                                        }}>
                                            <StatusIcon size={11} />
                                            {statusCfg.label}
                                        </div>
                                    </div>
                                    <div style={{ fontSize: 13, color: '#666', marginBottom: 4, lineHeight: 1.4 }}>
                                        {getLastMessage(session)}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: 11, color: '#aaa' }}>
                                            <Calendar size={10} style={{ verticalAlign: 'middle' }} /> {formatDate(session.created_at)}
                                        </span>
                                        <span style={{ fontSize: 11, color: '#aaa' }}>
                                            {session.messages?.length || 0}개 메시지
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* 상세 패널 */}
                {selectedSession && (
                    <div style={{
                        width: '60%',
                        borderRadius: 16,
                        border: '1px solid #eee',
                        background: '#fff',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                    }}>
                        {/* 상세 헤더 */}
                        <div style={{
                            padding: '16px 20px',
                            borderBottom: '1px solid #eee',
                            background: '#fafafe',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e' }}>
                                        {selectedSession.customer_name || '익명 사용자'}
                                    </div>
                                    {selectedSession.customer_phone && (
                                        <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>
                                            📞 {selectedSession.customer_phone}
                                        </div>
                                    )}
                                    {selectedSession.facility_id && (
                                        <button
                                            onClick={() => router.push(`/facility/${selectedSession.facility_id}`)}
                                            style={{
                                                fontSize: 12, color: NAVY, background: 'none',
                                                border: 'none', cursor: 'pointer', marginTop: 4,
                                                display: 'flex', alignItems: 'center', gap: 4,
                                            }}
                                        >
                                            <ExternalLink size={12} /> 시설 페이지 보기
                                        </button>
                                    )}
                                </div>
                                {/* 상태 변경 버튼 */}
                                <div style={{ display: 'flex', gap: 4 }}>
                                    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                                        const Icon = cfg.icon;
                                        return (
                                            <button
                                                key={key}
                                                onClick={() => updateStatus(selectedSession.id, key)}
                                                style={{
                                                    padding: '6px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                                                    border: selectedSession.status === key ? `2px solid ${cfg.color}` : '1px solid #ddd',
                                                    background: selectedSession.status === key ? cfg.bg : '#fff',
                                                    color: selectedSession.status === key ? cfg.color : '#999',
                                                    cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', gap: 4,
                                                }}
                                            >
                                                <Icon size={12} />
                                                {cfg.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* 대화 내용 */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
                            {selectedSession.messages?.map((msg, i) => (
                                <div
                                    key={i}
                                    style={{
                                        display: 'flex',
                                        justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                        marginBottom: 10,
                                    }}
                                >
                                    <div style={{
                                        maxWidth: '70%',
                                        padding: '10px 14px',
                                        borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                        background: msg.role === 'user' ? NAVY : '#f5f5f5',
                                        color: msg.role === 'user' ? '#fff' : '#333',
                                        fontSize: 13,
                                        lineHeight: 1.5,
                                        whiteSpace: 'pre-wrap',
                                    }}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
