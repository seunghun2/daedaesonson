import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
    try {
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_KEY!
        );

        // auth.users 가져오기
        const { data: authData } = await supabaseAdmin.auth.admin.listUsers();
        const users = authData?.users || [];

        // profiles 가져오기
        const { data: profiles } = await supabaseAdmin
            .from('profiles')
            .select('*');

        // 합치기
        const members = users.map((user) => {
            const profile = profiles?.find((p) => p.id === user.id) || null;
            return {
                id: user.id,
                email: user.email || '',
                created_at: user.created_at,
                last_sign_in_at: user.last_sign_in_at,
                user_metadata: user.user_metadata || {},
                profile,
            };
        });

        // 최신 가입 순 정렬
        members.sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        return NextResponse.json(members);
    } catch (error) {
        console.error('Admin members API error:', error);
        return NextResponse.json(
            { error: '회원 목록을 불러올 수 없습니다' },
            { status: 500 }
        );
    }
}

// 회원 삭제 (DELETE)
export async function DELETE(request: NextRequest) {
    try {
        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: '유저 ID가 필요합니다' }, { status: 400 });
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_KEY!
        );

        // 1. favorites 삭제
        await supabaseAdmin.from('favorites').delete().eq('user_id', userId);

        // 2. profiles 삭제
        await supabaseAdmin.from('profiles').delete().eq('id', userId);

        // 3. Review의 userId를 null로 (ON DELETE SET NULL이지만 명시적으로)
        await supabaseAdmin.from('Review').update({ userId: null }).eq('userId', userId);

        // 4. auth.users 삭제 (최종)
        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (error) {
            console.error('Delete user error:', error);
            return NextResponse.json({ error: '회원 삭제 실패: ' + error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Admin delete member error:', error);
        return NextResponse.json({ error: '회원 삭제 중 오류 발생' }, { status: 500 });
    }
}
