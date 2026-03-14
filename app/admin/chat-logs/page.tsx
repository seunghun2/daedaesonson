'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    MessageCircle, Phone, User, Calendar, ArrowLeft,
    Search, Check, CheckCheck, Clock, ExternalLink, ChevronDown,
    Tag, StickyNote, Users, BarChart3, X, Plus, Save, Globe
} from 'lucide-react';

interface ChatSession {
    id: string;
    facility_id: string | null;
    messages: Array<{ role: string; content: string; timestamp?: string }>;
    customer_name: string | null;
    customer_phone: string | null;
    status: string;
    user_agent: string;
    ip_address: string | null;
    admin_memo: string | null;
    tags: string[] | null;
    created_at: string;
    updated_at: string;
}

interface Stats {
    statusCounts: { total: number; new: number; reviewed: number; contacted: number };
    dailyCounts: Record<string, number>;
    topFacilities: Array<{ id: string; count: number }>;
    uniqueCustomers: number;
    tagCounts: Record<string, number>;
    avgMessages: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    new: { label: '새 상담', color: '#e53e3e', bg: '#fff5f5', icon: Clock },
    reviewed: { label: '확인 완료', color: '#dd6b20', bg: '#fffaf0', icon: Check },
    contacted: { label: '연락 완료', color: '#38a169', bg: '#f0fff4', icon: CheckCheck },
};

const PRESET_TAGS = ['급함', 'VIP', '재상담', '가격문의', '봉안당', '수목장', '매장묘', '화장시설'];
const NAVY = '#302E92';

export default function AdminChatLogs() {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterTag, setFilterTag] = useState<string>('all');
    const [activeTab, setActiveTab] = useState<'sessions' | 'customers' | 'stats'>('sessions');
    const [memo, setMemo] = useState('');
    const [memoSaving, setMemoSaving] = useState(false);
    const [stats, setStats] = useState<Stats | null>(null);
    const [showTagPicker, setShowTagPicker] = useState(false);
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

    const fetchStats = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/chat-stats');
            const data = await res.json();
            if (data.statusCounts) {
                setStats(data);
            }
        } catch {
            console.error('통계 로딩 실패');
        }
    }, []);

    useEffect(() => { fetchSessions(); }, [fetchSessions]);
    useEffect(() => { if (activeTab === 'stats') fetchStats(); }, [activeTab, fetchStats]);

    // 세션 선택 시 메모 로드
    useEffect(() => {
        if (selectedSession) {
            setMemo(selectedSession.admin_memo || '');
        }
    }, [selectedSession]);

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

    const saveMemo = async () => {
        if (!selectedSession) return;
        setMemoSaving(true);
        try {
            await fetch('/api/admin/chat-logs', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: selectedSession.id, memo }),
            });
            setSessions(prev => prev.map(s => s.id === selectedSession.id ? { ...s, admin_memo: memo } : s));
            setSelectedSession(prev => prev ? { ...prev, admin_memo: memo } : null);
        } catch {
            alert('메모 저장 실패');
        } finally {
            setMemoSaving(false);
        }
    };

    const toggleTag = async (sessionId: string, tag: string) => {
        const session = sessions.find(s => s.id === sessionId);
        if (!session) return;
        const currentTags = session.tags || [];
        const newTags = currentTags.includes(tag)
            ? currentTags.filter(t => t !== tag)
            : [...currentTags, tag];
        try {
            await fetch('/api/admin/chat-logs', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, tags: newTags }),
            });
            setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, tags: newTags } : s));
            if (selectedSession?.id === sessionId) {
                setSelectedSession(prev => prev ? { ...prev, tags: newTags } : null);
            }
        } catch {
            alert('태그 업데이트 실패');
        }
    };

    const filteredSessions = sessions.filter(s => {
        const matchesSearch = searchTerm === '' ||
            s.customer_name?.includes(searchTerm) ||
            s.customer_phone?.includes(searchTerm) ||
            s.admin_memo?.includes(searchTerm) ||
            s.messages?.some(m => m.content.includes(searchTerm));
        const matchesStatus = filterStatus === 'all' || s.status === filterStatus;
        const matchesTag = filterTag === 'all' || (s.tags || []).includes(filterTag);
        return matchesSearch && matchesStatus && matchesTag;
    });

    // 고객 프로필 (전화번호 기준 그룹핑)
    const customerProfiles = (() => {
        const map: Record<string, ChatSession[]> = {};
        sessions.forEach(s => {
            const key = s.customer_phone || '미등록';
            if (!map[key]) map[key] = [];
            map[key].push(s);
        });
        return Object.entries(map)
            .map(([phone, ss]) => ({
                phone,
                name: ss.find(s => s.customer_name)?.customer_name || '익명',
                sessionCount: ss.length,
                lastSession: ss[0].created_at,
                totalMessages: ss.reduce((sum, s) => sum + (s.messages?.length || 0), 0),
                tags: [...new Set(ss.flatMap(s => s.tags || []))],
                sessions: ss,
            }))
            .sort((a, b) => b.sessionCount - a.sessionCount);
    })();

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

    const formatFullDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

    const getLastMessage = (session: ChatSession) => {
        if (!session.messages?.length) return '메시지 없음';
        const last = session.messages[session.messages.length - 1];
        return last.content.slice(0, 60) + (last.content.length > 60 ? '...' : '');
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#888' }}>
                로딩 중...
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 16px' }}>
            {/* 헤더 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <button onClick={() => router.push('/admin')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>
                    <ArrowLeft size={20} />
                </button>
                <div style={{ flex: 1 }}>
                    <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a2e', margin: 0 }}>
                        🤖 AI 상담 관리
                    </h1>
                    <p style={{ fontSize: 13, color: '#888', margin: 0 }}>
                        총 {sessions.length}건 · 새 상담 {sessions.filter(s => s.status === 'new').length}건
                    </p>
                </div>
            </div>

            {/* 탭 */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '2px solid #eee', paddingBottom: 0 }}>
                {([
                    { key: 'sessions', label: '상담 목록', icon: MessageCircle },
                    { key: 'customers', label: '고객 프로필', icon: Users },
                    { key: 'stats', label: '통계', icon: BarChart3 },
                ] as const).map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => { setActiveTab(tab.key); setSelectedSession(null); }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '10px 20px', fontSize: 14, fontWeight: activeTab === tab.key ? 700 : 500,
                            border: 'none', borderBottom: activeTab === tab.key ? `3px solid ${NAVY}` : '3px solid transparent',
                            background: 'none', color: activeTab === tab.key ? NAVY : '#888',
                            cursor: 'pointer', marginBottom: -2, transition: 'all 0.2s',
                        }}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ===== 상담 목록 탭 ===== */}
            {activeTab === 'sessions' && (
                <>
                    {/* 검색 + 필터 */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, border: '1px solid #e0e0e0', background: '#fff' }}>
                            <Search size={16} color="#aaa" />
                            <input
                                type="text" placeholder="이름, 전화번호, 대화 내용 검색..."
                                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14 }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: 4 }}>
                            {['all', 'new', 'reviewed', 'contacted'].map(status => (
                                <button key={status} onClick={() => setFilterStatus(status)} style={{
                                    padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500,
                                    border: filterStatus === status ? `1px solid ${NAVY}` : '1px solid #e0e0e0',
                                    background: filterStatus === status ? `${NAVY}10` : '#fff',
                                    color: filterStatus === status ? NAVY : '#666', cursor: 'pointer',
                                }}>
                                    {status === 'all' ? '전체' : STATUS_CONFIG[status]?.label}
                                </button>
                            ))}
                        </div>
                        {/* 태그 필터 */}
                        <select
                            value={filterTag} onChange={e => setFilterTag(e.target.value)}
                            style={{ padding: '6px 12px', borderRadius: 6, fontSize: 12, border: '1px solid #e0e0e0', cursor: 'pointer', background: '#fff' }}
                        >
                            <option value="all">🏷️ 태그 전체</option>
                            {PRESET_TAGS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>

                    {/* 리스트 + 상세 */}
                    <div style={{ display: 'flex', gap: 16, minHeight: 'calc(100vh - 260px)' }}>
                        {/* 세션 목록 */}
                        <div style={{ width: selectedSession ? '35%' : '100%', transition: 'width 0.3s', overflowY: 'auto', maxHeight: 'calc(100vh - 260px)' }}>
                            {filteredSessions.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>상담 내역이 없습니다.</div>
                            ) : (
                                filteredSessions.map(session => {
                                    const statusCfg = STATUS_CONFIG[session.status] || STATUS_CONFIG.new;
                                    const StatusIcon = statusCfg.icon;
                                    return (
                                        <div key={session.id} onClick={() => setSelectedSession(session)} style={{
                                            padding: '14px 16px', borderRadius: 12,
                                            border: selectedSession?.id === session.id ? `2px solid ${NAVY}` : '1px solid #eee',
                                            background: selectedSession?.id === session.id ? '#f8f8ff' : '#fff',
                                            marginBottom: 8, cursor: 'pointer', transition: 'all 0.2s',
                                        }}>
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
                                                    {session.ip_address && (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                                            <Globe size={11} color="#aaa" />
                                                            <span style={{ fontSize: 11, color: '#999' }}>{session.ip_address}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 10, background: statusCfg.bg, color: statusCfg.color, fontSize: 11, fontWeight: 600 }}>
                                                    <StatusIcon size={11} />
                                                    {statusCfg.label}
                                                </div>
                                            </div>
                                            {/* 태그 표시 */}
                                            {session.tags && session.tags.length > 0 && (
                                                <div style={{ display: 'flex', gap: 4, marginBottom: 6, flexWrap: 'wrap' }}>
                                                    {session.tags.map(t => (
                                                        <span key={t} style={{ fontSize: 10, padding: '1px 6px', borderRadius: 6, background: '#EEEDFA', color: NAVY, fontWeight: 600 }}>{t}</span>
                                                    ))}
                                                </div>
                                            )}
                                            <div style={{ fontSize: 13, color: '#666', marginBottom: 4, lineHeight: 1.4 }}>{getLastMessage(session)}</div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: 11, color: '#aaa' }}>
                                                    <Calendar size={10} style={{ verticalAlign: 'middle' }} /> {formatDate(session.created_at)}
                                                </span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    {session.admin_memo && <StickyNote size={12} color="#dd6b20" />}
                                                    <span style={{ fontSize: 11, color: '#aaa' }}>{session.messages?.length || 0}개 메시지</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* 상세 패널 */}
                        {selectedSession && (
                            <div style={{ width: '65%', borderRadius: 16, border: '1px solid #eee', background: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden', maxHeight: 'calc(100vh - 260px)' }}>
                                {/* 상세 헤더 */}
                                <div style={{ padding: '16px 20px', borderBottom: '1px solid #eee', background: '#fafafe', flexShrink: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e' }}>
                                                {selectedSession.customer_name || '익명 사용자'}
                                            </div>
                                            {selectedSession.customer_phone && (
                                                <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>📞 {selectedSession.customer_phone}</div>
                                            )}
                                            {selectedSession.ip_address && (
                                                <div style={{ fontSize: 12, color: '#999', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <Globe size={12} color="#999" /> {selectedSession.ip_address}
                                                </div>
                                            )}
                                            {selectedSession.facility_id && (
                                                <button onClick={() => router.push(`/facility/${selectedSession.facility_id}`)} style={{ fontSize: 12, color: NAVY, background: 'none', border: 'none', cursor: 'pointer', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <ExternalLink size={12} /> 시설 페이지 보기
                                                </button>
                                            )}
                                            <div style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>
                                                {formatFullDate(selectedSession.created_at)}
                                            </div>
                                        </div>
                                        {/* 상태 변경 버튼 */}
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                                                const Icon = cfg.icon;
                                                return (
                                                    <button key={key} onClick={() => updateStatus(selectedSession.id, key)} style={{
                                                        padding: '6px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                                                        border: selectedSession.status === key ? `2px solid ${cfg.color}` : '1px solid #ddd',
                                                        background: selectedSession.status === key ? cfg.bg : '#fff',
                                                        color: selectedSession.status === key ? cfg.color : '#999', cursor: 'pointer',
                                                        display: 'flex', alignItems: 'center', gap: 4,
                                                    }}>
                                                        <Icon size={12} />{cfg.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* 태그 영역 */}
                                    <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                        <Tag size={14} color="#888" />
                                        {(selectedSession.tags || []).map(t => (
                                            <span key={t} onClick={() => toggleTag(selectedSession.id, t)} style={{
                                                fontSize: 11, padding: '2px 8px', borderRadius: 8, background: NAVY, color: '#fff',
                                                fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3,
                                            }}>
                                                {t} <X size={10} />
                                            </span>
                                        ))}
                                        <button onClick={() => setShowTagPicker(!showTagPicker)} style={{
                                            fontSize: 11, padding: '2px 8px', borderRadius: 8, border: '1px dashed #ccc',
                                            background: 'none', color: '#888', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3,
                                        }}>
                                            <Plus size={10} /> 태그 추가
                                        </button>
                                    </div>
                                    {showTagPicker && (
                                        <div style={{ marginTop: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                            {PRESET_TAGS.filter(t => !(selectedSession.tags || []).includes(t)).map(t => (
                                                <button key={t} onClick={() => { toggleTag(selectedSession.id, t); setShowTagPicker(false); }} style={{
                                                    fontSize: 11, padding: '3px 10px', borderRadius: 8, border: '1px solid #ddd',
                                                    background: '#f8f8f8', color: '#555', cursor: 'pointer',
                                                }}>
                                                    {t}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* 대화 내용 */}
                                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
                                    {selectedSession.messages?.map((msg, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
                                            <div style={{
                                                maxWidth: '70%', padding: '10px 14px',
                                                borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                                background: msg.role === 'user' ? NAVY : '#f5f5f5',
                                                color: msg.role === 'user' ? '#fff' : '#333',
                                                fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap',
                                            }}>
                                                {msg.content}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* 메모 영역 */}
                                <div style={{ padding: '12px 20px', borderTop: '1px solid #eee', background: '#fffcf5', flexShrink: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                                        <StickyNote size={14} color="#dd6b20" />
                                        <span style={{ fontSize: 13, fontWeight: 600, color: '#555' }}>내부 메모</span>
                                    </div>
                                    <textarea
                                        value={memo} onChange={e => setMemo(e.target.value)}
                                        placeholder="이 상담에 대한 내부 메모를 작성하세요..."
                                        style={{
                                            width: '100%', minHeight: 60, padding: '8px 12px', fontSize: 13,
                                            border: '1px solid #e8e0d0', borderRadius: 8, resize: 'vertical',
                                            outline: 'none', fontFamily: 'inherit', lineHeight: 1.5,
                                            background: '#fff',
                                        }}
                                    />
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
                                        <button onClick={saveMemo} disabled={memoSaving || memo === (selectedSession.admin_memo || '')} style={{
                                            display: 'flex', alignItems: 'center', gap: 4,
                                            padding: '6px 16px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                                            border: 'none', background: memo !== (selectedSession.admin_memo || '') ? NAVY : '#ddd',
                                            color: memo !== (selectedSession.admin_memo || '') ? '#fff' : '#999',
                                            cursor: memo !== (selectedSession.admin_memo || '') ? 'pointer' : 'default',
                                        }}>
                                            <Save size={12} />
                                            {memoSaving ? '저장 중...' : '메모 저장'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* ===== 고객 프로필 탭 ===== */}
            {activeTab === 'customers' && (
                <div style={{ display: 'flex', gap: 16, minHeight: 'calc(100vh - 260px)' }}>
                    <div style={{ width: selectedSession ? '35%' : '100%', transition: 'width 0.3s', overflowY: 'auto' }}>
                        {customerProfiles.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>고객 데이터 없음</div>
                        ) : (
                            customerProfiles.map(cp => (
                                <div key={cp.phone} style={{
                                    padding: '14px 16px', borderRadius: 12, border: '1px solid #eee',
                                    background: '#fff', marginBottom: 8, cursor: 'pointer',
                                }} onClick={() => { if (cp.sessions[0]) setSelectedSession(cp.sessions[0]); }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div style={{
                                                width: 36, height: 36, borderRadius: '50%', background: `${NAVY}15`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}>
                                                <User size={18} color={NAVY} />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>{cp.name}</div>
                                                <div style={{ fontSize: 12, color: '#888' }}>
                                                    {cp.phone !== '미등록' ? `📞 ${cp.phone}` : '연락처 미등록'}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{
                                            fontSize: 12, fontWeight: 700, color: NAVY, background: '#EEEDFA',
                                            padding: '4px 10px', borderRadius: 10,
                                        }}>
                                            {cp.sessionCount}회 상담
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#888' }}>
                                        <span>메시지 {cp.totalMessages}개</span>
                                        <span>마지막 {formatDate(cp.lastSession)}</span>
                                    </div>
                                    {cp.tags.length > 0 && (
                                        <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                                            {cp.tags.map(t => (
                                                <span key={t} style={{ fontSize: 10, padding: '1px 6px', borderRadius: 6, background: '#EEEDFA', color: NAVY, fontWeight: 600 }}>{t}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {/* 선택된 고객의 대화 상세 */}
                    {selectedSession && (
                        <div style={{ width: '65%', borderRadius: 16, border: '1px solid #eee', background: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden', maxHeight: 'calc(100vh - 260px)' }}>
                            <div style={{ padding: '16px 20px', borderBottom: '1px solid #eee', background: '#fafafe' }}>
                                <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e' }}>
                                    {selectedSession.customer_name || '익명'} — 대화 상세
                                </div>
                                <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                                    {formatFullDate(selectedSession.created_at)} · {selectedSession.messages?.length || 0}개 메시지
                                </div>
                            </div>
                            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
                                {selectedSession.messages?.map((msg, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
                                        <div style={{
                                            maxWidth: '70%', padding: '10px 14px',
                                            borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                            background: msg.role === 'user' ? NAVY : '#f5f5f5',
                                            color: msg.role === 'user' ? '#fff' : '#333',
                                            fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap',
                                        }}>
                                            {msg.content}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ===== 통계 탭 ===== */}
            {activeTab === 'stats' && stats && (
                <div>
                    {/* 요약 카드 */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
                        {[
                            { label: '총 상담', value: stats.statusCounts.total, color: NAVY, icon: '💬' },
                            { label: '새 상담', value: stats.statusCounts.new, color: '#e53e3e', icon: '🔴' },
                            { label: '연락 완료', value: stats.statusCounts.contacted, color: '#38a169', icon: '✅' },
                            { label: '고유 고객', value: stats.uniqueCustomers, color: '#6366f1', icon: '👤' },
                            { label: '평균 메시지', value: `${stats.avgMessages}개`, color: '#dd6b20', icon: '📝' },
                        ].map(card => (
                            <div key={card.label} style={{
                                padding: '16px 20px', borderRadius: 12, background: '#fff',
                                border: '1px solid #eee', textAlign: 'center',
                            }}>
                                <div style={{ fontSize: 24, marginBottom: 4 }}>{card.icon}</div>
                                <div style={{ fontSize: 24, fontWeight: 800, color: card.color }}>{card.value}</div>
                                <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>{card.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* 일별 상담 차트 */}
                    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #eee', padding: 20, marginBottom: 24 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e', margin: '0 0 16px 0' }}>📊 최근 14일 상담 추이</h3>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 120 }}>
                            {Object.entries(stats.dailyCounts).map(([date, count]) => {
                                const maxCount = Math.max(...Object.values(stats.dailyCounts), 1);
                                const height = (count / maxCount) * 100;
                                return (
                                    <div key={date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                        <span style={{ fontSize: 10, color: '#888', fontWeight: 600 }}>{count || ''}</span>
                                        <div style={{
                                            width: '100%', height: `${Math.max(height, 2)}%`, minHeight: 2,
                                            background: count > 0 ? `linear-gradient(180deg, ${NAVY}, ${NAVY}99)` : '#eee',
                                            borderRadius: '4px 4px 0 0', transition: 'height 0.3s',
                                        }} />
                                        <span style={{ fontSize: 9, color: '#bbb', transform: 'rotate(-45deg)', transformOrigin: 'center', whiteSpace: 'nowrap' }}>
                                            {date.slice(5)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        {/* 인기 시설 */}
                        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #eee', padding: 20 }}>
                            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e', margin: '0 0 12px 0' }}>🏢 인기 시설 TOP 10</h3>
                            {stats.topFacilities.length === 0 ? (
                                <div style={{ color: '#aaa', fontSize: 13, padding: 20, textAlign: 'center' }}>데이터 없음</div>
                            ) : (
                                stats.topFacilities.map((f, i) => (
                                    <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid #f5f5f5' }}>
                                        <span style={{ fontSize: 12, fontWeight: 700, color: i < 3 ? NAVY : '#999', width: 20 }}>{i + 1}</span>
                                        <span style={{ fontSize: 13, color: '#333', flex: 1 }}>{f.id}</span>
                                        <span style={{ fontSize: 12, fontWeight: 600, color: NAVY }}>{f.count}건</span>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* 태그별 통계 */}
                        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #eee', padding: 20 }}>
                            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e', margin: '0 0 12px 0' }}>🏷️ 태그별 분포</h3>
                            {Object.keys(stats.tagCounts).length === 0 ? (
                                <div style={{ color: '#aaa', fontSize: 13, padding: 20, textAlign: 'center' }}>태그 데이터 없음</div>
                            ) : (
                                Object.entries(stats.tagCounts).sort((a, b) => b[1] - a[1]).map(([tag, count]) => {
                                    const maxTag = Math.max(...Object.values(stats.tagCounts));
                                    return (
                                        <div key={tag} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
                                            <span style={{ fontSize: 12, fontWeight: 600, color: NAVY, minWidth: 60 }}>{tag}</span>
                                            <div style={{ flex: 1, height: 8, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
                                                <div style={{ width: `${(count / maxTag) * 100}%`, height: '100%', background: NAVY, borderRadius: 4, transition: 'width 0.3s' }} />
                                            </div>
                                            <span style={{ fontSize: 12, color: '#666', minWidth: 30, textAlign: 'right' }}>{count}</span>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            )}
            {activeTab === 'stats' && !stats && (
                <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>통계 로딩 중...</div>
            )}
        </div>
    );
}
