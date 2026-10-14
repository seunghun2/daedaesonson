import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const state = requestUrl.searchParams.get('state');
    const origin = requestUrl.origin;

    const oauthStateCookie = request.cookies.get('oauth_state')?.value;
    const rawReturnTo = request.cookies.get('oauth_return_to')?.value;
    let returnToPath = '/';
    if (rawReturnTo) {
        try {
            const decoded = decodeURIComponent(rawReturnTo);
            if (decoded.startsWith('/') && !decoded.startsWith('//')) {
                returnToPath = decoded;
            }
        } catch {
            returnToPath = '/';
        }
    }

    // 쿠키가 존재하는데 state가 다르면 명백한 위조 요청으로 차단하되,
    // 모바일 카카오톡 인앱/외부앱 전환 시 브라우저가 transient 쿠키를 유실한 경우(!oauthStateCookie && code && state)는
    // 1회용 authorization code 검증(kauth.kakao.com/oauth/token)으로 안전하게 이어서 처리
    if (!state || (oauthStateCookie && state !== oauthStateCookie)) {
        console.warn('[kakao] OAuth state mismatch:', { hasState: !!state, hasCookie: !!oauthStateCookie });
        const errorRes = NextResponse.redirect(new URL('/?login_error=csrf', origin));
        errorRes.cookies.delete('oauth_state');
        errorRes.cookies.delete('oauth_return_to');
        return errorRes;
    }

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

            if (!tokenData.access_token) {
                console.error('[kakao] No access_token:', JSON.stringify(tokenData));
                return NextResponse.redirect(new URL('/?login_error=kakao_token', origin));
            }

            // 2. 카카오 사용자 정보 가져오기
            const userRes = await fetch('https://kapi.kakao.com/v2/user/me', {
                headers: { Authorization: `Bearer ${tokenData.access_token}` },
            });
            const userData = await userRes.json();

            const kakaoId = userData.id;
            const nickname = userData.kakao_account?.profile?.nickname || '사용자';
            const avatarUrl = userData.kakao_account?.profile?.profile_image_url || '';
            const rawPhone = userData.kakao_account?.phone_number;
            let cleanPhone: string | null = null;
            if (rawPhone) {
                cleanPhone = rawPhone.replace(/\+82\s?/, '0').replace(/[^0-9]/g, '');
            }

            const email = `kakao_${kakaoId}@kakao.local`;
            const password = crypto.randomUUID() + crypto.randomUUID();

            const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
                auth: { autoRefreshToken: false, persistSession: false }
            });

            // 3. 기존 유저 찾기 (페이지네이션으로 1,000명 초과 시에도 누락 없이 탐색)
            let userId: string = '';

            try {
                let existingUser: any = null;
                let page = 1;
                const perPage = 1000;
                while (true) {
                    const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
                        page,
                        perPage,
                    });
                    if (listError) {
                        console.error('[kakao] listUsers error:', listError.message);
                        break;
                    }
                    const users = listData?.users || [];
                    existingUser = users.find((u: any) => u.email === email);
                    if (existingUser || users.length < perPage) break;
                    page += 1;
                }

                if (existingUser) {
                    userId = existingUser.id;
                    // 비밀번호 업데이트
                    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
                        password,
                    });
                    if (updateError) {
                        console.error('[kakao] updateUser error:', updateError.message);
                    }
                    if (cleanPhone) {
                        await supabaseAdmin.from('profiles').update({ phone: cleanPhone }).eq('id', userId).is('phone', null);
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
                            phone: cleanPhone,
                        },
                    });

                    if (createError) {
                        console.error('[kakao] createUser error:', createError.message);
                    }

                    userId = createData?.user?.id || '';

                    // 프로필 생성
                    if (userId) {
                        const newProfile: Record<string, any> = {
                            id: userId,
                            nickname,
                            avatar_url: avatarUrl,
                            provider: 'kakao',
                            favorite_facilities: [],
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                        };
                        if (cleanPhone) {
                            newProfile.phone = cleanPhone;
                        }
                        await supabaseAdmin.from('profiles').upsert(newProfile);
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

                if (signInData?.session) {
                    // 세션 토큰을 쿠키로 안전하게 전달 (URL 노출 차단)
                    const tokenPayload = JSON.stringify({
                        access_token: signInData.session.access_token,
                        refresh_token: signInData.session.refresh_token,
                    });
                    const encoded = Buffer.from(tokenPayload).toString('base64');
                    const redirectRes = NextResponse.redirect(new URL(returnToPath, origin));
                    // 상태 및 복귀 쿠키 삭제
                    redirectRes.cookies.delete('oauth_state');
                    redirectRes.cookies.delete('oauth_return_to');
                    redirectRes.cookies.set('kakao_session_transient', encoded, {
                        path: '/',
                        maxAge: 60,
                        sameSite: 'lax',
                        secure: process.env.NODE_ENV === 'production',
                        httpOnly: true,
                    });
                    return redirectRes;
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

    return NextResponse.redirect(new URL(returnToPath, origin));
}
