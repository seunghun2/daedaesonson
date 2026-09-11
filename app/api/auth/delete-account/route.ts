import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function DELETE(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
        }
        const token = authHeader.split(' ')[1];
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        );
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            return NextResponse.json({ error: '유효하지 않은 인증입니다.' }, { status: 401 });
        }

        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: '사용자 ID가 필요합니다' }, { status: 400 });
        }

        if (user.id !== userId) {
            return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
        }

        const serviceKey = process.env.SUPABASE_SERVICE_KEY!;
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseAdmin = createClient(supabaseUrl, serviceKey);

        // 프로필 삭제
        await supabaseAdmin.from('profiles').delete().eq('id', userId);

        // OTP 코드 삭제 (있으면)
        // auth.users 삭제 (REST API)
        const deleteRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${serviceKey}`,
                apikey: serviceKey,
            },
        });

        if (!deleteRes.ok) {
            return NextResponse.json({ error: '회원 삭제에 실패했습니다' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete user error:', error);
        return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
    }
}
