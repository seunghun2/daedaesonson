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

        if (!serviceKey || !supabaseUrl || !anonKey) {
            console.error('[verify-otp] Missing env vars:', { serviceKey: !!serviceKey, supabaseUrl: !!supabaseUrl, anonKey: !!anonKey });
            return NextResponse.json({ error: '서버 설정 오류입니다' }, { status: 500 });
        }

        const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        });

        // OTP 확인
        const { data: otpData, error: otpError } = await supabaseAdmin
            .from('otp_codes')
            .select('*')
            .eq('phone', cleanPhone)
            .single();

        if (otpError || !otpData) {
            console.error('[verify-otp] OTP lookup error:', otpError?.message);
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

        // admin API로 유저 검색 (per_page 충분히 크게)
        let userId: string = '';

        try {
            // 기존 유저 확인 - Supabase JS admin client 사용
            const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
                perPage: 1000,
            });

            if (listError) {
                console.error('[verify-otp] listUsers error:', listError.message);
            }

            const existingUser = listData?.users?.find((u: any) => u.email === email);

            if (existingUser) {
                userId = existingUser.id;
                // 비밀번호 업데이트
                const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
                    password,
                });
                if (updateError) {
                    console.error('[verify-otp] updateUser error:', updateError.message);
                }
            } else {
                // 신규 유저 생성
                const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
                    email,
                    password,
                    email_confirm: true,
                    user_metadata: { phone: cleanPhone, provider: 'phone' },
                });

                if (createError) {
                    console.error('[verify-otp] createUser error:', createError.message);
                    return NextResponse.json({ error: '계정 생성에 실패했습니다' }, { status: 500 });
                }

                userId = createData?.user?.id || '';

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
        } catch (adminError: any) {
            console.error('[verify-otp] Admin API error:', adminError?.message || adminError);
            return NextResponse.json({ error: '사용자 처리에 실패했습니다' }, { status: 500 });
        }

        // anon key로 로그인하여 세션 토큰 발급
        if (userId) {
            const loginClient = createClient(supabaseUrl, anonKey, {
                auth: { autoRefreshToken: false, persistSession: false }
            });
            const { data: signInData, error: signInError } = await loginClient.auth.signInWithPassword({
                email,
                password,
            });

            if (signInError) {
                console.error('[verify-otp] signIn error:', signInError.message);
                return NextResponse.json({ error: '로그인 처리에 실패했습니다' }, { status: 500 });
            }

            if (signInData?.session) {
                return NextResponse.json({
                    success: true,
                    session: {
                        access_token: signInData.session.access_token,
                        refresh_token: signInData.session.refresh_token,
                    },
                });
            }
        }

        return NextResponse.json({ error: '로그인 처리에 실패했습니다' }, { status: 500 });
    } catch (error: any) {
        console.error('[verify-otp] FATAL error:', error?.message || error);
        return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
    }
}
