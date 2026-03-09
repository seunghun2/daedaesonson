import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
    try {
        const { phone, code } = await request.json();

        if (!phone || !code) {
            return NextResponse.json({ error: '전화번호와 인증번호를 입력해주세요' }, { status: 400 });
        }

        const cleanPhone = phone.replace(/-/g, '');
        const serviceKey = process.env.SUPABASE_SERVICE_KEY!;
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

        const supabaseAdmin = createClient(supabaseUrl, serviceKey);

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
        const password = `phone_${cleanPhone}_${serviceKey.slice(0, 12)}`;

        // 기존 유저 확인 (REST API)
        const usersRes = await fetch(`${supabaseUrl}/auth/v1/admin/users?per_page=50`, {
            headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey },
        });
        const usersData = await usersRes.json();
        const existingUser = usersData?.users?.find((u: any) => u.email === email);

        let userId: string;

        if (existingUser) {
            userId = existingUser.id;
            // 비밀번호 업데이트 (REST API)
            await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${serviceKey}`,
                    apikey: serviceKey,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password }),
            });
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
                    user_metadata: { phone: cleanPhone, provider: 'phone' },
                }),
            });
            const newUser = await createRes.json();
            userId = newUser?.id || '';

            // 프로필 생성
            if (userId) {
                await supabaseAdmin.from('profiles').upsert({
                    id: userId,
                    nickname: `사용자_${cleanPhone.slice(-4)}`,
                    provider: 'phone',
                    phone: cleanPhone,
                    favorite_facilities: [],
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                });
            }
        }

        // anon key로 로그인하여 세션 토큰 발급
        if (userId) {
            const loginClient = createClient(supabaseUrl, anonKey);
            const { data: signInData, error: signInError } = await loginClient.auth.signInWithPassword({
                email,
                password,
            });

            if (signInData?.session) {
                return NextResponse.json({
                    success: true,
                    session: {
                        access_token: signInData.session.access_token,
                        refresh_token: signInData.session.refresh_token,
                    },
                });
            }
            console.error('Sign in error:', signInError);
        }

        return NextResponse.json({ error: '로그인 처리에 실패했습니다' }, { status: 500 });
    } catch (error) {
        console.error('Verify OTP error:', error);
        return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
    }
}
