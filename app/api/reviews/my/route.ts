import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            return NextResponse.json({ error: '인증 실패' }, { status: 401 });
        }

        // 내 리뷰 조회 (최신순)
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_KEY!
        );

        const { data: reviews, error } = await supabaseAdmin
            .from('Review')
            .select('id, facilityId, author, content, rating, photos, likes, createdAt')
            .eq('userId', user.id)
            .order('createdAt', { ascending: false });

        if (error) {
            console.error('Fetch my reviews error:', error);
            return NextResponse.json({ error: '리뷰 조회 실패' }, { status: 500 });
        }

        return NextResponse.json(reviews || []);
    } catch (error) {
        console.error('My reviews API error:', error);
        return NextResponse.json({ error: '서버 오류' }, { status: 500 });
    }
}
