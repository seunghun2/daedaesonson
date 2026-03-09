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
                console.error('[kakao] No access_token:', tokenData);
                return NextResponse.redirect(new URL('/', origin));
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

            // 3. 기존 유저 찾기 (REST API)
            const usersRes = await fetch(`${supabaseUrl}/auth/v1/admin/users?per_page=100`, {
                headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey },
            });
            const usersData = await usersRes.json();
            const existingUser = usersData?.users?.find((u: any) => u.email === email);
            console.log('[kakao] Existing user found:', !!existingUser, 'email:', email);

            let userId: string = '';

            if (existingUser) {
                userId = existingUser.id;
                // 비밀번호 업데이트
                const updateRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
                    method: 'PUT',
                    headers: {
                        Authorization: `Bearer ${serviceKey}`,
                        apikey: serviceKey,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ password }),
                });
                console.log('[kakao] Password update status:', updateRes.status);
            } else {
                // 신규 유저 생성 (REST API)
                const createRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${serviceKey}`,
                        apikey: serviceKey,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email,
                        password,
                        email_confirm: true,
                        user_metadata: {
                            full_name: nickname,
                            avatar_url: avatarUrl,
                            provider: 'kakao',
                            kakao_id: kakaoId,
                        },
                    }),
                });
                const newUser = await createRes.json();
                userId = newUser?.id || '';
                console.log('[kakao] Created user:', createRes.status, 'userId:', userId);

                // 프로필 생성
                if (userId) {
                    const supabaseAdmin = createClient(supabaseUrl, serviceKey);
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

            // 4. signInWithPassword로 세션 토큰 발급
            if (userId) {
                const loginClient = createClient(supabaseUrl, anonKey);
                const { data: signInData, error: signInError } = await loginClient.auth.signInWithPassword({
                    email,
                    password,
                });

                console.log('[kakao] SignIn result - session:', !!signInData?.session, 'error:', signInError?.message);

                if (signInData?.session) {
                    console.log('[kakao] Redirecting with auth credentials');
                    // base64로 인코딩하여 쿼리 전달 → AuthProvider에서 signInWithPassword
                    const cred = Buffer.from(`${email}:${password}`).toString('base64');
                    return NextResponse.redirect(new URL(`/?kakao_auth=${cred}`, origin));
                }
            } else {
                console.error('[kakao] No userId!');
            }
        } catch (error) {
            console.error('[kakao] FATAL error:', error);
        }
    }

    console.log('[kakao] Falling back to /');
    return NextResponse.redirect(new URL('/', origin));
}
