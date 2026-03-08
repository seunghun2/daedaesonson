// 정보 수정 요청 API
import { getSupabaseServer } from '@/lib/supabaseServer';
import { NextRequest, NextResponse } from 'next/server';

const supabase = getSupabaseServer();

// POST: 정보 수정 요청 등록
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { facility_id, facility_name, correction_type, content, contact, name, photos } = body;

        if (!facility_id || !facility_name || !correction_type || !content) {
            return NextResponse.json({ error: '필수 항목을 모두 입력해주세요.' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('facility_corrections')
            .insert({
                facility_id,
                facility_name,
                correction_type,
                content,
                contact: contact || null,
                name: name || null,
                photos: photos || null,
                status: 'pending',
            })
            .select()
            .single();

        if (error) {
            console.error('Correction insert error:', error);
            return NextResponse.json({ error: '등록에 실패했습니다.' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (err) {
        console.error('Correction API error:', err);
        return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
    }
}

// GET: 정보 수정 요청 목록 (어드민)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        let query = supabase
            .from('facility_corrections')
            .select('*')
            .order('created_at', { ascending: false });

        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data });
    } catch (err) {
        return NextResponse.json({ error: '서버 오류' }, { status: 500 });
    }
}

// PATCH: 상태 업데이트 (어드민)
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, status, admin_note } = body;

        const updateData: any = { status };
        if (admin_note !== undefined) updateData.admin_note = admin_note;

        const { error } = await supabase
            .from('facility_corrections')
            .update(updateData)
            .eq('id', id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: '서버 오류' }, { status: 500 });
    }
}
