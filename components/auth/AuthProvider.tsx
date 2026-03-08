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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    // 프로필 가져오기
    const fetchProfile = async (userId: string) => {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        if (data) {
            setProfile(data as Profile);
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

    // 카카오 로그인
    const signInWithKakao = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'kakao',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
    };

    // 휴대전화 로그인 (OTP 발송)
    const signInWithPhone = async (phone: string) => {
        // 한국 번호 형식 변환: 010-1234-5678 → +821012345678
        const formattedPhone = phone.replace(/-/g, '').replace(/^0/, '+82');
        const { error } = await supabase.auth.signInWithOtp({
            phone: formattedPhone,
        });
        return { error: error?.message ?? null };
    };

    // OTP 인증
    const verifyOtp = async (phone: string, token: string) => {
        const formattedPhone = phone.replace(/-/g, '').replace(/^0/, '+82');
        const { error } = await supabase.auth.verifyOtp({
            phone: formattedPhone,
            token,
            type: 'sms',
        });
        return { error: error?.message ?? null };
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
