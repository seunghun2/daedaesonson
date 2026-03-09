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
    toggleFavorite: (facilityId: number) => Promise<void>;
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

    // 프로필 가져오기
    const fetchProfile = async (userId: string) => {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        if (data) {
            setProfile(data as Profile);
            // 약관 동의 안 했으면 약관 화면 표시
            if (!data.agreed_terms) {
                setNeedsTerms(true);
            } else {
                setNeedsTerms(false);
            }
        }
    };

    // 세션 변경 감지
    useEffect(() => {
        // 초기 세션 확인
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            }
            setLoading(false);
        });

        // 인증 상태 변경 리스너
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                setSession(session);
                setUser(session?.user ?? null);
                if (session?.user) {
                    await fetchProfile(session.user.id);
                } else {
                    setProfile(null);
                }
                setLoading(false);
            }
        );

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

            // 매직 링크 토큰으로 세션 생성
            if (data.token) {
                const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
                const verifyUrl = `${supabaseUrl}/auth/v1/verify?token=${data.token}&type=magiclink&redirect_to=${window.location.origin}`;
                window.location.href = verifyUrl;
            }
            return { error: null };
        } catch {
            return { error: '인증에 실패했습니다' };
        }
    };

    // 로그아웃
    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        setSession(null);
    };

    // 프로필 새로고침
    const refreshProfile = async () => {
        if (user) {
            await fetchProfile(user.id);
        }
    };

    // 관심 시설 토글
    const toggleFavorite = async (facilityId: number) => {
        if (!user || !profile) return;
        const current = profile.favorite_facilities || [];
        const updated = current.includes(facilityId)
            ? current.filter((id) => id !== facilityId)
            : [...current, facilityId];

        await supabase
            .from('profiles')
            .update({ favorite_facilities: updated, updated_at: new Date().toISOString() })
            .eq('id', user.id);

        setProfile({ ...profile, favorite_facilities: updated });
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
