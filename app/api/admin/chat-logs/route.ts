import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

const supabase = getSupabaseServer();

// GET: 챗봇 세션 목록 조회
export async function GET() {
    const { data, error } = await supabase
        .from('ChatSession')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ sessions: data });
}

// PATCH: 세션 상태/메모/태그 업데이트
export async function PATCH(request: NextRequest) {
    try {
        const { sessionId, status, memo, tags } = await request.json();

        if (!sessionId) {
            return NextResponse.json({ error: 'sessionId가 필요합니다.' }, { status: 400 });
        }

        // 업데이트할 필드 동적 구성
        const updateFields: Record<string, any> = {
            updated_at: new Date().toISOString(),
        };

        if (status !== undefined) {
            if (!['new', 'reviewed', 'contacted'].includes(status)) {
                return NextResponse.json({ error: '올바른 상태값이 아닙니다.' }, { status: 400 });
            }
            updateFields.status = status;
        }

        if (memo !== undefined) {
            updateFields.admin_memo = memo;
        }

        if (tags !== undefined) {
            updateFields.tags = tags;
        }

        const { error } = await supabase
            .from('ChatSession')
            .update(updateFields)
            .eq('id', sessionId);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: '요청 처리 중 오류가 발생했습니다.' }, { status: 500 });
    }
}
