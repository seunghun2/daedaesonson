import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

// GET - 전체 추천 요청 목록
export async function GET() {
    const { data, error } = await getSupabase()
        .from('recommendation_requests')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ requests: data });
}

// PATCH - 상태 변경
export async function PATCH(request: Request) {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
        return NextResponse.json({ error: 'Missing id or status' }, { status: 400 });
    }

    const { error } = await getSupabase()
        .from('recommendation_requests')
        .update({ status })
        .eq('id', id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
}

// DELETE - 삭제
export async function DELETE(request: Request) {
    const body = await request.json();
    const { id } = body;

    if (!id) {
        return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const { error } = await getSupabase()
        .from('recommendation_requests')
        .delete()
        .eq('id', id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
}
