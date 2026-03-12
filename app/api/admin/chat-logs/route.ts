import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

const supabase = getSupabaseServer();

// GET: 챗봇 세션 목록 조회
export async function GET() {
    const { data, error } = await supabase
        .from('ChatSession')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ sessions: data });
}

// PATCH: 세션 상태 업데이트
export async function PATCH(request: NextRequest) {
    try {
        const { sessionId, status } = await request.json();

        if (!sessionId || !status) {
            return NextResponse.json({ error: 'sessionId와 status가 필요합니다.' }, { status: 400 });
        }

        if (!['new', 'reviewed', 'contacted'].includes(status)) {
            return NextResponse.json({ error: '올바른 상태값이 아닙니다.' }, { status: 400 });
        }

        const { error } = await supabase
            .from('ChatSession')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', sessionId);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: '요청 처리 중 오류가 발생했습니다.' }, { status: 500 });
    }
}
