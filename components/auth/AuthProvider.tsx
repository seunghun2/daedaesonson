'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface Profile {
    id: string;
    nickname: string | null;
    phone: string | null;
    avatar_url: string | null;
    provider: string | null;
    favorite_facilities: number[];
    agreed_terms: boolean;
    agreed_privacy: boolean;
    agreed_marketing: boolean;
    agreed_at: string | null;
    last_login_at: string | null;
    created_at: string | null;
}

interface AuthContextType {
    user: User | null;
    profile: Profile | null;
    session: Session | null;
    loading: boolean;
    signInWithKakao: () => Promise<void>;
    signInWithPhone: (phone: string) => Promise<{ error: string | null }>;
    verifyOtp: (phone: string, token: string) => Promise<{ error: string | null }>;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
    toggleFavorite: (facilityId: string) => Promise<void>;
    favorites: string[];
    isFavorite: (facilityId: string) => boolean;
    needsTerms: boolean;
    agreeToTerms: (marketing: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [needsTerms, setNeedsTerms] = useState(false);
    const [favorites, setFavorites] = useState<string[]>([]);

    // 프로필 가져오기
    const fetchProfile = async (userId: string) => {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        if (data) {
            setProfile(data as Profile);
            // 약관 동의가 필요한지 확인:
            // agreed_terms 필드가 명시적으로 false이고, 최근 가입한 유저만
            if (data.agreed_terms === false && data.created_at) {
                const createdAt = new Date(data.created_at).getTime();
                const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
                // 5분 이내 신규 가입자만 약관 모달 표시
                if (createdAt > fiveMinutesAgo) {
                    setNeedsTerms(true);
                } else {
                    // 기존 유저는 자동 동의 처리
                    setNeedsTerms(false);
                }
            } else {
                setNeedsTerms(false);
            }
        }
    };

    // 세션 변경 감지
    useEffect(() => {
        // 1. 인증 상태 변경 리스너 (먼저 등록)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                console.log('[auth] onAuthStateChange:', _event, 'user:', session?.user?.id);
                setSession(session);
                setUser(session?.user ?? null);
                if (session?.user) {
                    await fetchProfile(session.user.id);
                    loadFavorites(session.access_token);
                } else {
                    setProfile(null);
                    setFavorites([]);
                }
                setLoading(false);
            }
        );

        // 2. 초기 세션 확인
        const initSession = async () => {
            // 카카오 로그인 콜백 처리
            if (typeof window !== 'undefined') {
                const params = new URLSearchParams(window.location.search);
                const kakaoAuth = params.get('kakao_auth');
                if (kakaoAuth) {
                    console.log('[auth] kakao_auth detected');
                    // URL에서 쿼리 제거
                    window.history.replaceState(null, '', window.location.pathname);
                    try {
                        const decoded = atob(kakaoAuth);
                        const parts = decoded.split(':');
                        const email = parts[0];
                        const password = parts.slice(1).join(':');
                        console.log('[auth] email:', email, 'password length:', password?.length);
                        if (email && password) {
                            console.log('[auth] calling signInWithPassword...');
                            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
                            console.log('[auth] signIn result:', !!data?.session, 'error:', error?.message);
                            if (!error && data?.session) {
                                console.log('[auth] SUCCESS! user:', data.session.user?.id);
                                return; // onAuthStateChange에서 처리
                            }
                        }
                    } catch (e) { console.error('[auth] error:', e); }
                }
            }

            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            }
            setLoading(false);
        };

        initSession();

        return () => subscription.unsubscribe();
    }, []);

    // 카카오 로그인 — 카카오 직접 호출 (account_email 제외)
    const signInWithKakao = async () => {
        const kakaoClientId = '7ab050573fb230302ee849167cc26762';
        const redirectUri = `${window.location.origin}/auth/callback`;
        const authUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${kakaoClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=profile_nickname,profile_image`;
        window.location.href = authUrl;
    };

    // 휴대전화 로그인 (솔라피 SMS OTP 발송)
    const signInWithPhone = async (phone: string) => {
        try {
            const res = await fetch('/api/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone }),
            });
            const data = await res.json();
            if (!res.ok) return { error: data.error };
            return { error: null };
        } catch {
            return { error: '인증번호 발송에 실패했습니다' };
        }
    };

    // OTP 인증 (솔라피)
    const verifyOtp = async (phone: string, token: string) => {
        try {
            const res = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, code: token }),
            });
            const data = await res.json();
            if (!res.ok) return { error: data.error };

            // 서버에서 받은 세션 토큰으로 클라이언트 세션 설정
            if (data.session) {
                const { error: sessionError } = await supabase.auth.setSession({
                    access_token: data.session.access_token,
                    refresh_token: data.session.refresh_token,
                });
                if (sessionError) return { error: sessionError.message };
            }
            return { error: null };
        } catch {
            return { error: '인증에 실패했습니다' };
        }
    };

    // 로그아웃
    const signOut = async () => {
        try {
            await supabase.auth.signOut({ scope: 'local' });
        } catch (e) {
            // 에러 무시 - 로컬 정리만 하면 됨
        }
        // Supabase 관련 localStorage 전부 정리
        if (typeof window !== 'undefined') {
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('sb-') || key.includes('supabase')) {
                    localStorage.removeItem(key);
                }
            });
        }
        setUser(null);
        setProfile(null);
        setSession(null);
        setFavorites([]);
        window.location.href = '/';
    };

    // 프로필 새로고침
    const refreshProfile = async () => {
        if (user) {
            await fetchProfile(user.id);
        }
    };

    // 관심 시설 토글
    const toggleFavorite = async (facilityId: string) => {
        if (!user || !session) return;
        try {
            const res = await fetch('/api/favorites', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ facilityId }),
            });
            const data = await res.json();
            if (data.action === 'added') {
                setFavorites(prev => [...prev, String(facilityId)]);
            } else if (data.action === 'removed') {
                setFavorites(prev => prev.filter(id => id !== String(facilityId)));
            }
        } catch (e) {
            console.error('toggleFavorite error:', e);
        }
    };

    const isFavorite = (facilityId: string) => favorites.includes(String(facilityId));

    // 관심 시설 목록 로드
    const loadFavorites = async (accessToken: string) => {
        try {
            const res = await fetch('/api/favorites', {
                headers: { 'Authorization': `Bearer ${accessToken}` },
            });
            const data = await res.json();
            if (data.favorites) {
                setFavorites(data.favorites.map((f: any) => f.facility_id));
            }
        } catch (e) {
            console.error('loadFavorites error:', e);
        }
    };

    // 약관 동의
    const agreeToTerms = async (marketing: boolean) => {
        if (!user) return;
        const now = new Date().toISOString();
        await supabase
            .from('profiles')
            .update({
                agreed_terms: true,
                agreed_privacy: true,
                agreed_marketing: marketing,
                agreed_at: now,
                updated_at: now,
            })
            .eq('id', user.id);
        setNeedsTerms(false);
        if (profile) {
            setProfile({
                ...profile,
                agreed_terms: true,
                agreed_privacy: true,
                agreed_marketing: marketing,
                agreed_at: now,
            });
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                profile,
                session,
                loading,
                signInWithKakao,
                signInWithPhone,
                verifyOtp,
                signOut,
                refreshProfile,
                toggleFavorite,
                favorites,
                isFavorite,
                needsTerms,
                agreeToTerms,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
