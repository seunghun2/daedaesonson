import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

export async function POST(request: NextRequest) {
    try {
        const { code } = await request.json();
        if (!code) return NextResponse.json({ error: 'No code' }, { status: 400 });

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const serviceKey = process.env.SUPABASE_SERVICE_KEY!;
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const supabaseAdmin = createClient(supabaseUrl, serviceKey);

        // 코드로 임시 세션 데이터 가져오기
        const { data: tempAuth } = await supabaseAdmin
            .from('temp_auth')
            .select('*')
            .eq('code', code)
            .single();

        if (!tempAuth) {
            return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
        }

        // 사용한 코드 삭제
        await supabaseAdmin.from('temp_auth').delete().eq('code', code);

        // 만료 확인
        if (new Date(tempAuth.expires_at) < new Date()) {
            return NextResponse.json({ error: 'Expired' }, { status: 400 });
        }

        // 비밀번호로 로그인해서 세션 발급
        const loginClient = createClient(supabaseUrl, anonKey);
        const { data: signInData, error: signInError } = await loginClient.auth.signInWithPassword({
            email: tempAuth.email,
            password: tempAuth.password,
        });

        if (signInData?.session) {
            return NextResponse.json({
                access_token: signInData.session.access_token,
                refresh_token: signInData.session.refresh_token,
            });
        }

        return NextResponse.json({ error: signInError?.message || 'Login failed' }, { status: 500 });
    } catch (error) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
