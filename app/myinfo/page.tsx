'use client';

import { Box, Text, Group, Stack } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Heart, LogOut, Trash2 } from 'lucide-react';
import BottomNav from '@/components/common/BottomNav';
import { useAuth } from '@/components/auth/AuthProvider';

export default function MyInfoPage() {
    const router = useRouter();
    const { user, profile, signOut } = useAuth();

    if (!user) {
        router.push('/menu');
        return null;
    }

    const displayName = profile?.nickname || user?.user_metadata?.name || '사용자';
    const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;
    const provider = profile?.provider === 'kakao' ? '카카오' : '휴대전화';
    const phone = profile?.phone || '';
    const email = user.email || '';
    const createdAt = user.created_at
        ? new Date(user.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
        : '-';
    const favoriteCount = profile?.favorite_facilities?.length || 0;

    const handleDeleteAccount = async () => {
        if (!confirm('정말 탈퇴하시겠습니까?\n모든 데이터가 삭제됩니다.')) return;
        try {
            await fetch('/api/auth/delete-account', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id }),
            });
            await signOut();
            router.push('/');
        } catch { /* ignore */ }
    };

    return (
        <Box style={{ minHeight: '100dvh', backgroundColor: '#f8f9fa', paddingBottom: 70 }}>
            {/* 헤더 */}
            <Box
                px="lg"
                py="md"
                style={{
                    backgroundColor: 'white',
                    borderBottom: '1px solid #e9ecef',
                    position: 'sticky',
                    top: 0,
                    zIndex: 100,
                }}
            >
                <Group gap="md" align="center">
                    <ChevronLeft
                        size={22}
                        color="#212529"
                        style={{ cursor: 'pointer' }}
                        onClick={() => router.back()}
                    />
                    <Text size="lg" fw={700}>내 정보</Text>
                </Group>
            </Box>

            {/* 프로필 카드 */}
            <Box p="md">
                <Box p="xl" bg="white" style={{ borderRadius: 16, textAlign: 'center' }}>
                    {avatarUrl ? (
                        <img
                            src={avatarUrl}
                            alt={displayName}
                            width={72}
                            height={72}
                            style={{ borderRadius: '50%', objectFit: 'cover', margin: '0 auto 12px', display: 'block' }}
                        />
                    ) : (
                        <Box
                            style={{
                                width: 72,
                                height: 72,
                                borderRadius: '50%',
                                backgroundColor: '#1D0098',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 12px',
                            }}
                        >
                            <Text c="white" fw={700} size="xl">
                                {displayName.charAt(0)}
                            </Text>
                        </Box>
                    )}
                    <Text size="lg" fw={700} mb={2}>{displayName}</Text>
                    <Text size="sm" c="dimmed">{provider} 로그인</Text>
                </Box>
            </Box>

            {/* 내 정보 */}
            <Box px="md" pb="md">
                <Text size="xs" c="dimmed" mb={8} fw={600} px={4}>계정 정보</Text>
                <Stack gap={0} bg="white" style={{ borderRadius: 12, overflow: 'hidden' }}>
                    <InfoRow label="닉네임" value={displayName} />
                    {phone && <InfoRow label="전화번호" value={formatPhone(phone)} />}
                    <InfoRow label="로그인 방식" value={provider} />
                    <InfoRow label="가입일" value={createdAt} />
                    <InfoRow label="관심 시설" value={`${favoriteCount}개`} last />
                </Stack>
            </Box>

            {/* 약관 동의 정보 */}
            <Box px="md" pb="md">
                <Text size="xs" c="dimmed" mb={8} fw={600} px={4}>약관 동의 현황</Text>
                <Stack gap={0} bg="white" style={{ borderRadius: 12, overflow: 'hidden' }}>
                    <InfoRow
                        label="이용약관"
                        value={profile?.agreed_terms ? '✅ 동의' : '미동의'}
                    />
                    <InfoRow
                        label="개인정보 수집·이용"
                        value={profile?.agreed_privacy ? '✅ 동의' : '미동의'}
                    />
                    <InfoRow
                        label="마케팅 수신"
                        value={profile?.agreed_marketing ? '✅ 동의' : '미동의'}
                        last
                    />
                </Stack>
            </Box>

            {/* 액션 */}
            <Box px="md" pb="xl">
                <Stack gap={8}>
                    <button
                        onClick={() => { signOut(); router.push('/'); }}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            width: '100%', padding: '14px', borderRadius: 12,
                            backgroundColor: 'white', border: '1px solid #e9ecef',
                            fontSize: 14, fontWeight: 600, color: '#495057',
                            cursor: 'pointer',
                        }}
                    >
                        <LogOut size={16} />
                        로그아웃
                    </button>
                    <button
                        onClick={handleDeleteAccount}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            width: '100%', padding: '14px', borderRadius: 12,
                            backgroundColor: 'transparent', border: 'none',
                            fontSize: 13, color: '#adb5bd',
                            cursor: 'pointer',
                        }}
                    >
                        <Trash2 size={14} />
                        회원 탈퇴
                    </button>
                </Stack>
            </Box>

            <BottomNav />
        </Box>
    );
}

function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
    return (
        <Box
            px="md"
            py={14}
            style={{
                borderBottom: last ? 'none' : '1px solid #f1f3f5',
            }}
        >
            <Group justify="space-between">
                <Text size="sm" c="dimmed">{label}</Text>
                <Text size="sm" fw={500}>{value}</Text>
            </Group>
        </Box>
    );
}

function formatPhone(phone: string) {
    const clean = phone.replace(/\D/g, '');
    if (clean.length === 11) {
        return `${clean.slice(0, 3)}-****-${clean.slice(7)}`;
    }
    return phone;
}
