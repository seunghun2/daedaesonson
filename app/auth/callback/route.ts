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

                // 3. Supabase Admin으로 유저 생성/로그인
                const supabaseAdmin = createClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    process.env.SUPABASE_SERVICE_KEY!
                );

                const email = `kakao_${kakaoId}@kakao.local`;

                // 기존 유저 찾기
                const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
                const existingUser = existingUsers?.users?.find((u: any) => u.email === email);

                let userId: string;

                if (existingUser) {
                    userId = existingUser.id;
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
                    userId = newUser?.user?.id || '';

                    // 프로필 생성
                    if (userId) {
                        await supabaseAdmin.from('profiles').upsert({
                            id: userId,
                            nickname,
                            avatar_url: avatarUrl,
                            provider: 'kakao',
                            favorite_facilities: [],
                            updated_at: new Date().toISOString(),
                        });
                    }
                }

                // 4. 매직 링크로 자동 로그인
                if (userId) {
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
        } catch (error) {
            console.error('Kakao auth error:', error);
        }
    }

    return NextResponse.redirect(new URL('/', origin));
}
