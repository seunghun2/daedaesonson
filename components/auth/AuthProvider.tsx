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
            // 약관 미동의(기존 가입자 포함) → 1회 동의 모달 표시
            setNeedsTerms(data.agreed_terms !== true);
        }
    };

    // 세션 변경 감지
    useEffect(() => {
        // 1. 인증 상태 변경 리스너 (먼저 등록)
        // ⚠️ 콜백 안에서 supabase 호출을 await 하면 supabase-js 내부 락과 교착(deadlock)되어
        //    프로필/관심시설 로드가 영원히 멈춤 → 콜백은 동기로 두고 실제 작업은 setTimeout으로 미룸
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                // 토큰 갱신 시에는 세션만 교체 (불필요한 재조회 방지)
                setSession(session);
                setUser(session?.user ?? null);
                if (event === 'TOKEN_REFRESHED') return;
                if (session?.user) {
                    const uid = session.user.id;
                    const token = session.access_token;
                    setTimeout(() => {
                        fetchProfile(uid).finally(() => setLoading(false));
                        loadFavorites(token);
                    }, 0);
                } else {
                    // INITIAL_SESSION(null)은 initSession이 처리 — 실제 로그아웃일 때만 비움
                    if (event === 'SIGNED_OUT') {
                        setProfile(null);
                        setFavorites([]);
                    }
                    if (event !== 'INITIAL_SESSION') setLoading(false);
                }
            }
        );

        // 2. 초기 세션 확인
        const initSession = async () => {
            try {
                // 카카오 로그인 콜백 처리
                if (typeof window !== 'undefined') {
                    let kakaoSession: string | null = null;

                    // 1) API를 통해 httpOnly 쿠키에서 세션 읽기
                    try {
                        const res = await fetch('/api/auth/session');
                        if (res.ok) {
                            const data = await res.json();
                            if (data.session && data.session.access_token) {
                                const { data: sessionData, error } = await supabase.auth.setSession({
                                    access_token: data.session.access_token,
                                    refresh_token: data.session.refresh_token,
                                });
                                if (!error && sessionData?.session) {
                                    setSession(sessionData.session);
                                    setUser(sessionData.session.user);
                                    await fetchProfile(sessionData.session.user.id);
                                    loadFavorites(sessionData.session.access_token);
                                    setLoading(false);
                                    return;
                                }
                            }
                        }
                    } catch (e) { console.error('[auth] error reading session:', e); }

                    // 2) URL 파라미터 확인 (하위 호환)
                    if (!kakaoSession) {
                        const params = new URLSearchParams(window.location.search);
                        kakaoSession = params.get('kakao_session');
                        if (kakaoSession) {
                            window.history.replaceState(null, '', window.location.pathname);
                        }
                    }

                    if (kakaoSession) {
                        try {
                            const decoded = atob(kakaoSession);
                            const tokens = JSON.parse(decoded);
                            if (tokens.access_token && tokens.refresh_token) {
                                const { data: sessionData, error } = await supabase.auth.setSession({
                                    access_token: tokens.access_token,
                                    refresh_token: tokens.refresh_token,
                                });
                                if (!error && sessionData?.session) {
                                    setSession(sessionData.session);
                                    setUser(sessionData.session.user);
                                    await fetchProfile(sessionData.session.user.id);
                                    loadFavorites(sessionData.session.access_token);
                                    setLoading(false);
                                    return;
                                }
                            }
                        } catch (e) { console.error('[auth] error:', e); }
                    }
                }

                const { data: { session } } = await supabase.auth.getSession();
                setSession(session);
                setUser(session?.user ?? null);
                if (session?.user) {
                    await fetchProfile(session.user.id);
                    loadFavorites(session.access_token);
                }
            } catch (err) {
                console.error('[auth] initSession error:', err);
            } finally {
                setLoading(false);
            }
        };

        initSession();

        return () => subscription.unsubscribe();
    }, []);

    // 카카오 로그인 — 카카오 직접 호출 (account_email 제외)
    const signInWithKakao = async () => {
        const state = crypto.randomUUID();
        document.cookie = `oauth_state=${state}; path=/; max-age=300; SameSite=Lax`;
        const kakaoClientId = '7ab050573fb230302ee849167cc26762';
        const redirectUri = `${window.location.origin}/auth/callback`;
        const authUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${kakaoClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=${state}`;
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
        if (typeof window !== 'undefined') {
            // localStorage에서 Supabase 관련 키 전부 수집 후 삭제
            const keysToRemove: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth-token'))) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));

            // Supabase 관련 쿠키도 삭제
            document.cookie.split(';').forEach(cookie => {
                const name = cookie.split('=')[0].trim();
                if (name.startsWith('sb-') || name.includes('supabase')) {
                    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
                }
            });

            // 즉시 리로드 — React 상태 변경 없이 깔끔하게
            window.location.href = '/';
        }
    };

    // 프로필 새로고침
    const refreshProfile = async () => {
        if (user) {
            await fetchProfile(user.id);
        }
    };

    // 관심 시설 토글 (Optimistic Update: 즉시 UI 반영 → 실패 시 롤백)
    const toggleFavorite = async (facilityId: string) => {
        if (!user || !session) return;
        const isCurrentlyFav = favorites.includes(String(facilityId));
        // ★ 즉시 UI 업데이트 (API 응답 전)
        if (isCurrentlyFav) {
            setFavorites(prev => prev.filter(id => id !== String(facilityId)));
        } else {
            setFavorites(prev => Array.from(new Set([...prev, String(facilityId)])));
        }
        try {
            // React state의 토큰은 만료됐을 수 있음(모바일 백그라운드 복귀 등) → 최신 세션 토큰 사용
            const { data: { session: fresh } } = await supabase.auth.getSession();
            const token = fresh?.access_token || session.access_token;
            const res = await fetch('/api/favorites', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ facilityId, action: isCurrentlyFav ? 'remove' : 'add' }),
            });
            if (!res.ok) throw new Error('API error');
        } catch (e) {
            // 실패 시 롤백
            console.error('toggleFavorite error:', e);
            if (isCurrentlyFav) {
                setFavorites(prev => Array.from(new Set([...prev, String(facilityId)])));
            } else {
                setFavorites(prev => prev.filter(id => id !== String(facilityId)));
            }
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
                setFavorites(Array.from(new Set(data.favorites.map((f: any) => String(f.facility_id)))));
            }
        } catch (e) {
            console.error('loadFavorites error:', e);
        }
    };

    // 약관 동의
    const agreeToTerms = async (marketing: boolean) => {
        if (!user) return;
        const now = new Date().toISOString();
        const { error } = await supabase
            .from('profiles')
            .update({
                agreed_terms: true,
                agreed_privacy: true,
                agreed_marketing: marketing,
                agreed_at: now,
                updated_at: now,
            })
            .eq('id', user.id);
        if (error) {
            console.error('agreeToTerms error:', error);
            alert('약관 동의 저장에 실패했습니다. 잠시 후 다시 시도해주세요.');
            return;
        }
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
