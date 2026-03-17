import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const origin = requestUrl.origin;

    if (code) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const serviceKey = process.env.SUPABASE_SERVICE_KEY!;
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

        if (!serviceKey || !supabaseUrl || !anonKey) {
            console.error('[kakao] Missing env vars:', { serviceKey: !!serviceKey, supabaseUrl: !!supabaseUrl, anonKey: !!anonKey });
            return NextResponse.redirect(new URL('/?login_error=env', origin));
        }

        try {
            // 1. 카카오에서 access_token 교환
            const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    grant_type: 'authorization_code',
                    client_id: '7ab050573fb230302ee849167cc26762',
                    client_secret: process.env.KAKAO_CLIENT_SECRET || '',
                    redirect_uri: `${origin}/auth/callback`,
                    code,
                }),
            });

            const tokenData = await tokenRes.json();
            console.log('[kakao] Token exchange status:', tokenRes.status, 'has access_token:', !!tokenData.access_token);

            if (!tokenData.access_token) {
                console.error('[kakao] No access_token:', JSON.stringify(tokenData));
                return NextResponse.redirect(new URL('/?login_error=kakao_token', origin));
            }

            // 2. 카카오 사용자 정보 가져오기
            const userRes = await fetch('https://kapi.kakao.com/v2/user/me', {
                headers: { Authorization: `Bearer ${tokenData.access_token}` },
            });
            const userData = await userRes.json();
            console.log('[kakao] User info - id:', userData.id, 'nickname:', userData.kakao_account?.profile?.nickname);

            const kakaoId = userData.id;
            const nickname = userData.kakao_account?.profile?.nickname || '사용자';
            const avatarUrl = userData.kakao_account?.profile?.profile_image_url || '';

            const email = `kakao_${kakaoId}@kakao.local`;
            const password = `kakao_${kakaoId}_${serviceKey.slice(0, 12)}`;

            const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
                auth: { autoRefreshToken: false, persistSession: false }
            });

            // 3. 기존 유저 찾기 (Supabase JS admin)
            let userId: string = '';

            try {
                const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
                    perPage: 1000,
                });

                if (listError) {
                    console.error('[kakao] listUsers error:', listError.message);
                }

                const existingUser = listData?.users?.find((u: any) => u.email === email);
                console.log('[kakao] Existing user found:', !!existingUser, 'email:', email);

                if (existingUser) {
                    userId = existingUser.id;
                    // 비밀번호 업데이트
                    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
                        password,
                    });
                    if (updateError) {
                        console.error('[kakao] updateUser error:', updateError.message);
                    } else {
                        console.log('[kakao] Password updated for user:', userId);
                    }
                } else {
                    // 신규 유저 생성
                    const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
                        email,
                        password,
                        email_confirm: true,
                        user_metadata: {
                            full_name: nickname,
                            avatar_url: avatarUrl,
                            provider: 'kakao',
                            kakao_id: kakaoId,
                        },
                    });

                    if (createError) {
                        console.error('[kakao] createUser error:', createError.message);
                    }

                    userId = createData?.user?.id || '';
                    console.log('[kakao] Created user:', userId);

                    // 프로필 생성
                    if (userId) {
                        await supabaseAdmin.from('profiles').upsert({
                            id: userId,
                            nickname,
                            avatar_url: avatarUrl,
                            provider: 'kakao',
                            favorite_facilities: [],
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                        });
                    }
                }
            } catch (adminError: any) {
                console.error('[kakao] Admin API error:', adminError?.message || adminError);
            }

            // 4. signInWithPassword로 세션 토큰 발급
            if (userId) {
                const loginClient = createClient(supabaseUrl, anonKey, {
                    auth: { autoRefreshToken: false, persistSession: false }
                });
                const { data: signInData, error: signInError } = await loginClient.auth.signInWithPassword({
                    email,
                    password,
                });

                console.log('[kakao] SignIn result - session:', !!signInData?.session, 'error:', signInError?.message);

                if (signInData?.session) {
                    console.log('[kakao] Redirecting with session tokens');
                    // 세션 토큰을 직접 전달 — 클라이언트에서 setSession으로 바로 적용
                    const tokenPayload = JSON.stringify({
                        access_token: signInData.session.access_token,
                        refresh_token: signInData.session.refresh_token,
                    });
                    const encoded = Buffer.from(tokenPayload).toString('base64');
                    return NextResponse.redirect(new URL(`/?kakao_session=${encoded}`, origin));
                } else {
                    console.error('[kakao] SignIn failed:', signInError?.message);
                }
            } else {
                console.error('[kakao] No userId!');
            }
        } catch (error: any) {
            console.error('[kakao] FATAL error:', error?.message || error);
        }
    }

    console.log('[kakao] Falling back to /');
    return NextResponse.redirect(new URL('/', origin));
}
