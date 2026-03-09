import { NextResponse } from 'next/server';
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
