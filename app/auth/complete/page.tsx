'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCompletePage() {
    const searchParams = useSearchParams();

    useEffect(() => {
        const accessToken = searchParams.get('at');
        const refreshToken = searchParams.get('rt');

        if (accessToken && refreshToken) {
            supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
            }).then(() => {
                window.location.href = '/';
            }).catch(() => {
                window.location.href = '/';
            });
        } else {
            window.location.href = '/';
        }
    }, [searchParams]);

    return (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            minHeight: '100vh', backgroundColor: '#f8f9fa',
        }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{
                    width: 40, height: 40, border: '3px solid #5c3fbf',
                    borderTopColor: 'transparent', borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                    margin: '0 auto 16px',
                }} />
                <p style={{ color: '#495057', fontSize: 15 }}>로그인 처리 중...</p>
            </div>
            <style jsx global>{`
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
