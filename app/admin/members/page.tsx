'use client';

import { useState, useEffect } from 'react';
import {
    Paper, Text, Table, Badge, Group, TextInput,
    Card, SimpleGrid, LoadingOverlay, Select, ActionIcon, Tooltip, Avatar,
} from '@mantine/core';
import { Search, Users, UserCheck, UserPlus, Shield } from 'lucide-react';

interface Member {
    id: string;
    email: string;
    created_at: string;
    last_sign_in_at: string | null;
    user_metadata: {
        full_name?: string;
        name?: string;
        avatar_url?: string;
        provider?: string;
        phone?: string;
        kakao_id?: number;
    };
    profile?: {
        nickname: string | null;
        phone: string | null;
        avatar_url: string | null;
        provider: string | null;
        agreed_terms: boolean;
        agreed_marketing: boolean;
        agreed_at: string | null;
        favorite_facilities: number[];
        created_at: string | null;
        last_login_at: string | null;
    };
}

export default function AdminMembersPage() {
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [providerFilter, setProviderFilter] = useState<string | null>(null);
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        try {
            const res = await fetch('/api/admin/members');
            if (res.ok) {
                const data = await res.json();
                setMembers(data);
            }
        } catch (e) {
            console.error('Failed to fetch members:', e);
        } finally {
            setLoading(false);
        }
    };

    // 필터링
    const filtered = members.filter((m) => {
        const name = m.profile?.nickname || m.user_metadata?.full_name || m.email;
        const phone = m.profile?.phone || m.user_metadata?.phone || '';
        const provider = m.profile?.provider || '';

        const matchesSearch = !search ||
            name.toLowerCase().includes(search.toLowerCase()) ||
            phone.includes(search) ||
            m.email.includes(search.toLowerCase());

        const matchesProvider = !providerFilter || provider === providerFilter;

        return matchesSearch && matchesProvider;
    });

    // 통계
    const totalMembers = members.length;
    const kakaoMembers = members.filter(m => m.profile?.provider === 'kakao').length;
    const phoneMembers = members.filter(m => m.profile?.provider === 'phone').length;
    const agreedMarketing = members.filter(m => m.profile?.agreed_marketing).length;

    // 날짜 포맷
    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        return `${d.getFullYear()}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getDate().toString().padStart(2, '0')}`;
    };

    const formatDateTime = (dateStr: string | null) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        return `${d.getFullYear()}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    };

    if (loading) return <LoadingOverlay visible />;

    return (
        <div>
            <Text size="xl" fw={800} mb="lg">회원 관리</Text>

            {/* 통계 카드 */}
            <SimpleGrid cols={{ base: 2, md: 4 }} mb="lg">
                <StatCard icon={Users} label="전체 회원" value={totalMembers} color="#5c3fbf" />
                <StatCard icon={UserCheck} label="카카오 가입" value={kakaoMembers} color="#FEE500" textColor="#191919" />
                <StatCard icon={UserPlus} label="휴대전화 가입" value={phoneMembers} color="#339af0" />
                <StatCard icon={Shield} label="마케팅 동의" value={agreedMarketing} color="#51cf66" />
            </SimpleGrid>

            {/* 검색 & 필터 */}
            <Card withBorder radius="md" mb="md" p="sm">
                <Group>
                    <TextInput
                        placeholder="이름, 전화번호, 이메일 검색"
                        leftSection={<Search size={16} />}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ flex: 1 }}
                    />
                    <Select
                        placeholder="로그인 방식"
                        data={[
                            { value: 'kakao', label: '카카오' },
                            { value: 'phone', label: '휴대전화' },
                        ]}
                        value={providerFilter}
                        onChange={setProviderFilter}
                        clearable
                        w={140}
                    />
                </Group>
            </Card>

            {/* 회원 목록 */}
            <Card withBorder radius="md" p={0}>
                <Table striped highlightOnHover>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>회원</Table.Th>
                            <Table.Th>로그인 방식</Table.Th>
                            <Table.Th>전화번호</Table.Th>
                            <Table.Th>약관 동의</Table.Th>
                            <Table.Th>관심 시설</Table.Th>
                            <Table.Th>가입일</Table.Th>
                            <Table.Th>마지막 접속</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {filtered.length === 0 ? (
                            <Table.Tr>
                                <Table.Td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#868e96' }}>
                                    {search ? '검색 결과가 없습니다' : '등록된 회원이 없습니다'}
                                </Table.Td>
                            </Table.Tr>
                        ) : (
                            filtered.map((member) => {
                                const name = member.profile?.nickname || member.user_metadata?.full_name || '사용자';
                                const avatar = member.profile?.avatar_url || member.user_metadata?.avatar_url;
                                const provider = member.profile?.provider;
                                const phone = member.profile?.phone || member.user_metadata?.phone;

                                return (
                                    <Table.Tr
                                        key={member.id}
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => setSelectedMember(member)}
                                    >
                                        <Table.Td>
                                            <Group gap="sm">
                                                <Avatar
                                                    src={avatar}
                                                    size={32}
                                                    radius="xl"
                                                    color="grape"
                                                >
                                                    {name.charAt(0)}
                                                </Avatar>
                                                <div>
                                                    <Text size="sm" fw={600}>{name}</Text>
                                                    <Text size="xs" c="dimmed">{member.email}</Text>
                                                </div>
                                            </Group>
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge
                                                size="sm"
                                                variant="light"
                                                color={provider === 'kakao' ? 'yellow' : 'blue'}
                                            >
                                                {provider === 'kakao' ? '카카오' : '휴대전화'}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm">{phone ? formatPhoneDisplay(phone) : '-'}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Group gap={4}>
                                                <Tooltip label="이용약관">
                                                    <Badge size="xs" color={member.profile?.agreed_terms ? 'green' : 'gray'} variant="dot">
                                                        약관
                                                    </Badge>
                                                </Tooltip>
                                                <Tooltip label="마케팅 동의">
                                                    <Badge size="xs" color={member.profile?.agreed_marketing ? 'green' : 'gray'} variant="dot">
                                                        마케팅
                                                    </Badge>
                                                </Tooltip>
                                            </Group>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm">{member.profile?.favorite_facilities?.length || 0}개</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm">{formatDate(member.created_at)}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm">{formatDate(member.last_sign_in_at)}</Text>
                                        </Table.Td>
                                    </Table.Tr>
                                );
                            })
                        )}
                    </Table.Tbody>
                </Table>
            </Card>

            <Text size="sm" c="dimmed" mt="md" ta="right">
                총 {filtered.length}명 {search && `(전체 ${totalMembers}명 중)`}
            </Text>

            {/* 회원 상세 모달 */}
            {selectedMember && (
                <MemberDetailModal
                    member={selectedMember}
                    onClose={() => setSelectedMember(null)}
                    formatDateTime={formatDateTime}
                    onDelete={async (id) => {
                        await fetchMembers();
                        setSelectedMember(null);
                    }}
                />
            )}
        </div>
    );
}

function StatCard({ icon: Icon, label, value, color, textColor }: {
    icon: any; label: string; value: number; color: string; textColor?: string;
}) {
    return (
        <Paper withBorder p="md" radius="md">
            <Group justify="space-between">
                <Text size="xs" c="dimmed" fw={700} tt="uppercase">{label}</Text>
                <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    backgroundColor: color, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                }}>
                    <Icon size={14} color={textColor || 'white'} />
                </div>
            </Group>
            <Text size="2xl" fw={700} mt="sm">{value}</Text>
        </Paper>
    );
}

function formatPhoneDisplay(phone: string) {
    const clean = phone.replace(/\D/g, '');
    if (clean.length === 11) {
        return `${clean.slice(0, 3)}-${clean.slice(3, 7)}-${clean.slice(7)}`;
    }
    return phone;
}

function MemberDetailModal({ member, onClose, formatDateTime, onDelete }: {
    member: Member;
    onClose: () => void;
    formatDateTime: (d: string | null) => string;
    onDelete: (id: string) => void;
}) {
    const name = member.profile?.nickname || member.user_metadata?.full_name || '사용자';
    const avatar = member.profile?.avatar_url || member.user_metadata?.avatar_url;
    const provider = member.profile?.provider;
    const phone = member.profile?.phone || member.user_metadata?.phone;
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        if (!confirm(`"${name}" 회원을 정말 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;
        setDeleting(true);
        try {
            const res = await fetch('/api/admin/members', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: member.id }),
            });
            if (res.ok) {
                alert('회원이 삭제되었습니다.');
                onDelete(member.id);
            } else {
                const data = await res.json();
                alert(data.error || '삭제 실패');
            }
        } catch {
            alert('네트워크 오류');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <>
            <div onClick={onClose} style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 9998,
            }} />
            <div style={{
                position: 'fixed', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: 'white', borderRadius: 16,
                padding: 24, width: '100%', maxWidth: 480,
                zIndex: 9999, boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}>
                <Group justify="space-between" mb="md">
                    <Text size="lg" fw={700}>회원 상세 정보</Text>
                    <ActionIcon variant="subtle" onClick={onClose} size="sm">✕</ActionIcon>
                </Group>

                <Group mb="md">
                    <Avatar src={avatar} size={48} radius="xl" color="grape">
                        {name.charAt(0)}
                    </Avatar>
                    <div>
                        <Text fw={600}>{name}</Text>
                        <Text size="sm" c="dimmed">{member.email}</Text>
                    </div>
                </Group>

                <SimpleGrid cols={2} spacing="xs">
                    <InfoItem label="로그인 방식" value={provider === 'kakao' ? '카카오' : '휴대전화'} />
                    <InfoItem label="전화번호" value={phone ? formatPhoneDisplay(phone) : '-'} />
                    <InfoItem label="가입일" value={formatDateTime(member.created_at)} />
                    <InfoItem label="마지막 접속" value={formatDateTime(member.last_sign_in_at)} />
                    <InfoItem label="약관 동의" value={member.profile?.agreed_terms ? '✅ 완료' : '❌ 미동의'} />
                    <InfoItem label="마케팅 동의" value={member.profile?.agreed_marketing ? '✅ 동의' : '❌ 미동의'} />
                    <InfoItem label="동의 일시" value={formatDateTime(member.profile?.agreed_at || null)} />
                    <InfoItem label="관심 시설" value={`${member.profile?.favorite_facilities?.length || 0}개`} />
                </SimpleGrid>

                {member.profile?.favorite_facilities && member.profile.favorite_facilities.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                        <Text size="xs" c="dimmed" mb={4}>관심 시설 ID</Text>
                        <Group gap={4}>
                            {member.profile.favorite_facilities.map((id) => (
                                <Badge key={id} size="xs" variant="light">{id}</Badge>
                            ))}
                        </Group>
                    </div>
                )}

                {/* 회원 삭제 버튼 */}
                <div style={{ marginTop: 20, borderTop: '1px solid #f1f3f5', paddingTop: 16 }}>
                    <button
                        onClick={handleDelete}
                        disabled={deleting}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            width: '100%', padding: '12px', borderRadius: 10,
                            backgroundColor: deleting ? '#ffe3e3' : '#fff5f5',
                            border: '1px solid #ffc9c9',
                            fontSize: 14, fontWeight: 600,
                            color: '#e03131', cursor: deleting ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {deleting ? '삭제 중...' : '회원 삭제'}
                    </button>
                </div>
            </div>
        </>
    );
}

function InfoItem({ label, value }: { label: string; value: string }) {
    return (
        <div style={{ padding: '8px 0' }}>
            <Text size="xs" c="dimmed">{label}</Text>
            <Text size="sm" fw={500}>{value}</Text>
        </div>
    );
}
