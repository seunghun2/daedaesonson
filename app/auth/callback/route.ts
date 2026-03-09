import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const origin = requestUrl.origin;

    if (code) {
        try {
            // 1. 카카오에서 access_token 교환
            const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    grant_type: 'authorization_code',
                    client_id: '7ab050573fb230302ee849167cc26762',
                    redirect_uri: `${origin}/auth/callback`,
                    code,
                }),
            });

            const tokenData = await tokenRes.json();

            if (tokenData.access_token) {
                // 2. 카카오 사용자 정보 가져오기
                const userRes = await fetch('https://kapi.kakao.com/v2/user/me', {
                    headers: { Authorization: `Bearer ${tokenData.access_token}` },
                });
                const userData = await userRes.json();

                const kakaoId = userData.id;
                const nickname = userData.kakao_account?.profile?.nickname || '사용자';
                const avatarUrl = userData.kakao_account?.profile?.profile_image_url || '';

                // 3. Supabase에 사용자 생성/로그인 (서비스 키로)
                const supabaseAdmin = createClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    process.env.SUPABASE_SERVICE_KEY!
                );

                // 카카오 ID로 기존 유저 찾기
                const email = `kakao_${kakaoId}@kakao.local`;
                const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
                const user = existingUser?.users?.find((u: any) => u.email === email);

                if (user) {
                    // 기존 유저 — 매직 링크로 자동 로그인
                    const { data } = await supabaseAdmin.auth.admin.generateLink({
                        type: 'magiclink',
                        email,
                    });
                    if (data?.properties?.hashed_token) {
                        // 토큰으로 세션 생성
                        const verifyUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/verify?token=${data.properties.hashed_token}&type=magiclink&redirect_to=${encodeURIComponent(origin)}`;
                        return NextResponse.redirect(verifyUrl);
                    }
                } else {
                    // 신규 유저 생성
                    const { data: newUser } = await supabaseAdmin.auth.admin.createUser({
                        email,
                        email_confirm: true,
                        user_metadata: {
                            full_name: nickname,
                            avatar_url: avatarUrl,
                            provider: 'kakao',
                            kakao_id: kakaoId,
                        },
                    });

                    if (newUser?.user) {
                        // 프로필 생성
                        await supabaseAdmin.from('profiles').upsert({
                            id: newUser.user.id,
                            nickname,
                            avatar_url: avatarUrl,
                            provider: 'kakao',
                            favorite_facilities: [],
                            updated_at: new Date().toISOString(),
                        });

                        // 매직 링크로 자동 로그인
                        const { data } = await supabaseAdmin.auth.admin.generateLink({
                            type: 'magiclink',
                            email,
                        });
                        if (data?.properties?.hashed_token) {
                            const verifyUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/verify?token=${data.properties.hashed_token}&type=magiclink&redirect_to=${encodeURIComponent(origin)}`;
                            return NextResponse.redirect(verifyUrl);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Kakao auth error:', error);
        }
    }

    // 로그인 완료 후 홈으로 리다이렉트
    return NextResponse.redirect(new URL('/', origin));
}
