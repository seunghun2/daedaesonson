'use client';

import { useState, useEffect } from 'react';
import { Box, Text, Group, Stack } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Heart, LogOut, Trash2, ChevronRight, MapPin } from 'lucide-react';
import BottomNav from '@/components/common/BottomNav';
import { useAuth } from '@/components/auth/AuthProvider';
import { useMediaQuery } from '@mantine/hooks';

export default function MyInfoPage() {
    const router = useRouter();
    const { user, profile, signOut, favorites, session } = useAuth();
    const isMobile = useMediaQuery('(max-width: 768px)');
    const [showFavorites, setShowFavorites] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [showMyReviews, setShowMyReviews] = useState(false);
    const [myReviews, setMyReviews] = useState<any[]>([]);
    const [deleteReviewId, setDeleteReviewId] = useState<string | null>(null);
    const [deletingReview, setDeletingReview] = useState(false);
    const [facilityDetails, setFacilityDetails] = useState<any[]>([]);
    const [loadingFavorites, setLoadingFavorites] = useState(false);

    useEffect(() => {
        const loadMyReviews = async () => {
            try {
                const supabase = (await import('@/lib/supabase')).getSupabaseClient();
                const { data: { session: s } } = await supabase.auth.getSession();
                if (!s) return;
                const res = await fetch('/api/reviews/my', {
                    headers: { Authorization: `Bearer ${s.access_token}` },
                });
                if (res.ok) setMyReviews(await res.json());
            } catch { /* ignore */ }
        };
        loadMyReviews();
    }, []);

    const handleDeleteReview = async () => {
        if (!deleteReviewId || !user) return;
        const review = myReviews.find(r => r.id === deleteReviewId);
        if (!review) return;
        setDeletingReview(true);
        try {
            const res = await fetch(`/api/facilities/${review.facilityId}/review`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reviewId: review.id, userId: user.id }),
            });
            if (res.ok) {
                setMyReviews(prev => prev.filter(r => r.id !== deleteReviewId));
            }
        } catch { /* ignore */ }
        setDeletingReview(false);
        setDeleteReviewId(null);
    };

    useEffect(() => {
        if (!user) router.push('/menu');
    }, [user, router]);

    if (!user) {
        return null;
    }

    const displayName = profile?.nickname || user?.user_metadata?.full_name || user?.user_metadata?.name || '사용자';
    const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;
    const provider = user?.user_metadata?.provider === 'kakao' ? '카카오' : '휴대전화';
    const phone = profile?.phone || '';
    const createdAt = user.created_at
        ? new Date(user.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
        : '-';

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

    // 관심 시설 상세 정보 로드
    useEffect(() => {
        if (showFavorites && favorites.length > 0) {
            setLoadingFavorites(true);
            // 로컬 facilities.json에서 가져오기
            fetch('/api/facilities')
                .then(r => r.json())
                .then(data => {
                    const facilities = data.facilities || data || [];
                    const matched = favorites
                        .map(fid => facilities.find((f: any) => String(f.id) === String(fid)))
                        .filter(Boolean);
                    setFacilityDetails(matched);
                })
                .catch(() => { })
                .finally(() => setLoadingFavorites(false));
        }
    }, [showFavorites, favorites]);

    const pageContent = (
        <Box style={{
            minHeight: '100dvh',
            backgroundColor: '#f8f9fa',
            paddingBottom: isMobile ? 70 : 0,
            width: isMobile ? '100%' : 400,
            borderRight: isMobile ? 'none' : '1px solid #e9ecef',
            position: isMobile ? 'relative' : 'fixed',
            left: 0,
            top: 0,
            height: isMobile ? 'auto' : '100dvh',
            overflowY: 'auto',
            zIndex: isMobile ? 'auto' : 1000,
        }}>
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
                    <Text size="lg" fw={700}>
                        {showFavorites ? '관심 시설' : '내 정보'}
                    </Text>
                </Group>
            </Box>

            {showFavorites ? (
                /* 관심 시설 리스트 */
                <Box p="md">
                    {loadingFavorites ? (
                        <Box py={40} style={{ textAlign: 'center' }}>
                            <Text c="dimmed">불러오는 중...</Text>
                        </Box>
                    ) : facilityDetails.length === 0 ? (
                        <Box py={40} style={{ textAlign: 'center' }}>
                            <Heart size={40} color="#dee2e6" style={{ margin: '0 auto 12px' }} />
                            <Text c="dimmed" size="sm">관심 시설이 없습니다</Text>
                            <Text c="dimmed" size="xs" mt={4}>시설 상세 페이지에서 ♡를 눌러 추가하세요</Text>
                        </Box>
                    ) : (
                        <Stack gap="sm">
                            {facilityDetails.map((fac: any) => (
                                <Box
                                    key={fac.id}
                                    bg="white"
                                    p="md"
                                    style={{
                                        borderRadius: 12,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        border: '1px solid #f1f3f5',
                                    }}
                                    onClick={() => router.push(`/facility/${fac.id}`)}
                                >
                                    <Group justify="space-between" wrap="nowrap">
                                        <Box style={{ flex: 1, minWidth: 0 }}>
                                            <Text size="sm" fw={600} truncate>{fac.name}</Text>
                                            <Group gap={4} mt={4}>
                                                <MapPin size={12} color="#868e96" />
                                                <Text size="xs" c="dimmed" truncate>{fac.address}</Text>
                                            </Group>
                                            {fac.priceRange?.min > 0 && (
                                                <Text size="xs" c="brand.7" fw={600} mt={4}>
                                                    {Math.round(fac.priceRange.min).toLocaleString()}만원~
                                                </Text>
                                            )}
                                        </Box>
                                        <ChevronRight size={16} color="#adb5bd" />
                                    </Group>
                                </Box>
                            ))}
                        </Stack>
                    )}
                </Box>
            ) : (
                <>
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
                                        width: 72, height: 72, borderRadius: '50%',
                                        backgroundColor: '#1D0098',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        margin: '0 auto 12px',
                                    }}
                                >
                                    <Text c="white" fw={700} size="xl">{displayName.charAt(0)}</Text>
                                </Box>
                            )}
                            <Text size="lg" fw={700} mb={2}>{displayName}</Text>
                            <Text size="sm" c="dimmed">{provider} 로그인</Text>
                        </Box>
                    </Box>

                    {/* 계정 정보 */}
                    <Box px="md" pb="md">
                        <Text size="xs" c="dimmed" mb={8} fw={600} px={4}>계정 정보</Text>
                        <Stack gap={0} bg="white" style={{ borderRadius: 12, overflow: 'hidden' }}>
                            <InfoRow label="닉네임" value={displayName} />
                            {phone && <InfoRow label="전화번호" value={formatPhone(phone)} />}
                            <InfoRow label="로그인 방식" value={provider} />
                            <InfoRow label="가입일" value={createdAt} />
                        </Stack>
                    </Box>

                    {/* 관심 시설 */}
                    <Box px="md" pb="md">
                        <Box
                            bg="white"
                            px="md"
                            py={14}
                            style={{
                                borderRadius: 12,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }}
                            onClick={() => setShowFavorites(true)}
                        >
                            <Group gap={8}>
                                <Heart size={16} color="#ff6b6b" fill="#ff6b6b" />
                                <Text size="sm" fw={500}>관심 시설</Text>
                            </Group>
                            <Group gap={4}>
                                <Text size="sm" fw={700} c="brand.7">{favorites.length}개</Text>
                                <ChevronRight size={16} color="#adb5bd" />
                            </Group>
                        </Box>
                    </Box>

                    {/* 내 이야기 */}
                    <Box px="md" pb="md">
                        <Box
                            bg="white" px="md" py={14}
                            style={{
                                borderRadius: 12, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            }}
                            onClick={() => setShowMyReviews(!showMyReviews)}
                        >
                            <Group gap={8}>
                                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#302E92' }}>chat_bubble</span>
                                <Text size="sm" fw={500}>내 이야기</Text>
                            </Group>
                            <Group gap={4}>
                                <Text size="sm" fw={700} style={{ color: 'var(--mantine-color-brand-7)' }}>{myReviews.length}개</Text>
                                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#adb5bd', transition: 'transform 0.2s', transform: showMyReviews ? 'rotate(90deg)' : 'none' }}>chevron_right</span>
                            </Group>
                        </Box>
                        {showMyReviews && (
                            <Stack gap="xs" mt="xs">
                                {myReviews.length === 0 ? (
                                    <Box py={20} style={{ textAlign: 'center' }}>
                                        <Text size="sm" c="dimmed">아직 작성한 이야기가 없어요</Text>
                                    </Box>
                                ) : (
                                    myReviews.map((review: any) => (
                                        <Box
                                            key={review.id}
                                            bg="white" p="md"
                                            style={{ borderRadius: 12, cursor: 'pointer' }}
                                            onClick={() => router.push(`/?id=${review.facilityId}`)}
                                        >
                                            <Group justify="space-between" mb={4}>
                                                <Group gap={4}>
                                                    {[1, 2, 3, 4, 5].map(s => (
                                                        <span key={s} style={{ color: s <= review.rating ? '#fcc419' : '#dee2e6', fontSize: 14 }}>★</span>
                                                    ))}
                                                </Group>
                                                <Group gap={8}>
                                                    <Text size="xs" c="dimmed">
                                                        {new Date(review.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                                                    </Text>
                                                    <Box
                                                        onClick={(e: any) => { e.stopPropagation(); setDeleteReviewId(review.id); }}
                                                        style={{ cursor: 'pointer', padding: 4 }}
                                                    >
                                                        <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#adb5bd' }}>delete</span>
                                                    </Box>
                                                </Group>
                                            </Group>
                                            <Text size="sm" lineClamp={2}>{review.content}</Text>
                                            <Text size="xs" c="dimmed" mt={4}>{review.facilityId}</Text>
                                        </Box>
                                    ))
                                )}
                            </Stack>
                        )}
                    </Box>

                    {/* 약관 동의 정보 */}
                    <Box px="md" pb="md">
                        <Text size="xs" c="dimmed" mb={8} fw={600} px={4}>약관 동의 현황</Text>
                        <Stack gap={0} bg="white" style={{ borderRadius: 12, overflow: 'hidden' }}>
                            <InfoRow label="이용약관" value={profile?.agreed_terms ? '✅ 동의' : '미동의'} />
                            <InfoRow label="개인정보 수집·이용" value={profile?.agreed_privacy ? '✅ 동의' : '미동의'} />
                            <InfoRow label="마케팅 수신" value={profile?.agreed_marketing ? '✅ 동의' : '미동의'} last />
                        </Stack>
                    </Box>

                    {/* 액션 */}
                    <Box px="md" pb="xl">
                        <Stack gap={8}>
                            <button
                                onClick={() => setShowLogoutConfirm(true)}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                    width: '100%', padding: '14px', borderRadius: 12,
                                    backgroundColor: 'white', border: '1px solid #e9ecef',
                                    fontSize: 14, fontWeight: 600, color: '#495057', cursor: 'pointer',
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
                                    fontSize: 13, color: '#adb5bd', cursor: 'pointer',
                                }}
                            >
                                <Trash2 size={14} />
                                회원 탈퇴
                            </button>
                        </Stack>
                    </Box>
                </>
            )}

            {/* 로그아웃 확인 모달 */}
            {showLogoutConfirm && (
                <Box style={{
                    position: 'fixed', inset: 0, zIndex: 9999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: 'rgba(0,0,0,0.4)',
                }} onClick={() => setShowLogoutConfirm(false)}>
                    <Box
                        bg="white" p="xl"
                        style={{
                            borderRadius: 16, width: 280, textAlign: 'center',
                            animation: 'scaleIn 0.2s ease-out',
                        }}
                        onClick={(e: any) => e.stopPropagation()}
                    >
                        <Text size="md" fw={700} mb={4}>로그아웃</Text>
                        <Text size="sm" c="dimmed" mb={20}>로그아웃 하시겠습니까?</Text>
                        <Group justify="center" gap={8}>
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                style={{
                                    padding: '10px 28px', borderRadius: 10, flex: 1,
                                    backgroundColor: '#f1f3f5', border: 'none',
                                    fontSize: 14, fontWeight: 600, color: '#495057', cursor: 'pointer',
                                }}
                            >
                                아니오
                            </button>
                            <button
                                onClick={() => { setShowLogoutConfirm(false); signOut(); }}
                                style={{
                                    padding: '10px 28px', borderRadius: 10, flex: 1,
                                    backgroundColor: '#302E92', border: 'none',
                                    fontSize: 14, fontWeight: 600, color: 'white', cursor: 'pointer',
                                }}
                            >
                                예
                            </button>
                        </Group>
                    </Box>
                    <style>{`@keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
                </Box>
            )}

            {/* 이야기 삭제 확인 모달 */}
            {deleteReviewId && (
                <Box style={{
                    position: 'fixed', inset: 0, zIndex: 9999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: 'rgba(0,0,0,0.4)',
                }} onClick={() => setDeleteReviewId(null)}>
                    <Box
                        bg="white" p="xl"
                        style={{ borderRadius: 16, width: 280, textAlign: 'center', animation: 'scaleIn 0.2s ease-out' }}
                        onClick={(e: any) => e.stopPropagation()}
                    >
                        <Text size="md" fw={700} mb={4}>이야기 삭제</Text>
                        <Text size="sm" c="dimmed" mb={20}>이 이야기를 삭제하시겠습니까?</Text>
                        <Group justify="center" gap={8}>
                            <button
                                onClick={() => setDeleteReviewId(null)}
                                style={{ padding: '10px 28px', borderRadius: 10, flex: 1, backgroundColor: '#f1f3f5', border: 'none', fontSize: 14, fontWeight: 600, color: '#495057', cursor: 'pointer' }}
                            >아니오</button>
                            <button
                                onClick={handleDeleteReview}
                                disabled={deletingReview}
                                style={{ padding: '10px 28px', borderRadius: 10, flex: 1, backgroundColor: '#e03131', border: 'none', fontSize: 14, fontWeight: 600, color: 'white', cursor: deletingReview ? 'not-allowed' : 'pointer' }}
                            >{deletingReview ? '삭제 중...' : '예'}</button>
                        </Group>
                    </Box>
                    <style>{`@keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
                </Box>
            )}
            {isMobile && <BottomNav />}
        </Box>
    );

    if (!isMobile) {
        // PC: 왼쪽 고정 패널 + 오른쪽 클릭하면 닫기
        return (
            <>
                {/* 배경 오버레이 */}
                <Box
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0,0,0,0.3)',
                        zIndex: 999,
                    }}
                    onClick={() => router.back()}
                />
                {pageContent}
            </>
        );
    }

    return pageContent;
}

function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
    return (
        <Box px="md" py={14} style={{ borderBottom: last ? 'none' : '1px solid #f1f3f5' }}>
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
