import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
    try {
        const { phone, code } = await request.json();

        if (!phone || !code) {
            return NextResponse.json({ error: '전화번호와 인증번호를 입력해주세요' }, { status: 400 });
        }

        const cleanPhone = phone.replace(/-/g, '');

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_KEY!
        );

        // OTP 확인
        const { data: otpData } = await supabaseAdmin
            .from('otp_codes')
            .select('*')
            .eq('phone', cleanPhone)
            .single();

        if (!otpData) {
            return NextResponse.json({ error: '인증번호를 먼저 발송해주세요' }, { status: 400 });
        }

        if (otpData.code !== code) {
            return NextResponse.json({ error: '인증번호가 일치하지 않습니다' }, { status: 400 });
        }

        if (new Date(otpData.expires_at) < new Date()) {
            return NextResponse.json({ error: '인증번호가 만료되었습니다. 다시 요청해주세요' }, { status: 400 });
        }

        // OTP 사용 완료 처리
        await supabaseAdmin
            .from('otp_codes')
            .update({ verified: true })
            .eq('phone', cleanPhone);

        // Supabase 유저 생성/찾기
        const email = `phone_${cleanPhone}@phone.local`;
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
                    phone: cleanPhone,
                    provider: 'phone',
                },
            });
            userId = newUser?.user?.id || '';

            // 프로필 생성
            if (userId) {
                await supabaseAdmin.from('profiles').upsert({
                    id: userId,
                    nickname: `사용자_${cleanPhone.slice(-4)}`,
                    provider: 'phone',
                    phone: cleanPhone,
                    favorite_facilities: [],
                    updated_at: new Date().toISOString(),
                });
            }
        }

        // 매직 링크로 자동 로그인
        if (userId) {
            const { data } = await supabaseAdmin.auth.admin.generateLink({
                type: 'magiclink',
                email,
            });
            if (data?.properties?.hashed_token) {
                return NextResponse.json({
                    success: true,
                    token: data.properties.hashed_token,
                    email,
                });
            }
        }

        return NextResponse.json({ error: '로그인 처리에 실패했습니다' }, { status: 500 });
    } catch (error) {
        console.error('Verify OTP error:', error);
        return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
    }
}
