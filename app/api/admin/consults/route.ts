import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

const supabase = getSupabaseServer();

// PATCH: 상태 또는 메모 업데이트
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { consultId, status, adminNote } = body;

        if (!consultId) {
            return NextResponse.json({ error: '상담 ID가 필요합니다.' }, { status: 400 });
        }

        // 업데이트할 필드 구성
        const updateData: Record<string, unknown> = {
            updatedAt: new Date().toISOString()
        };

        if (status !== undefined) {
            updateData.status = status;
        }

        if (adminNote !== undefined) {
            updateData.adminNote = adminNote;
        }

        const { data, error } = await supabase
            .from('Consult')
            .update(updateData)
            .eq('id', consultId)
            .select()
            .single();

        if (error) {
            console.error('Update consult error:', error);
            return NextResponse.json({ error: '업데이트 실패' }, { status: 500 });
        }

        return NextResponse.json({ success: true, consult: data });

    } catch (error) {
        console.error('Consult PATCH error:', error);
        return NextResponse.json({ error: '서버 오류' }, { status: 500 });
    }
}

// DELETE: 상담 신청 삭제
export async function DELETE(request: NextRequest) {
    try {
        const body = await request.json();
        const { consultId } = body;

        if (!consultId) {
            return NextResponse.json({ error: '상담 ID가 필요합니다.' }, { status: 400 });
        }

        const { error } = await supabase
            .from('Consult')
            .delete()
            .eq('id', consultId);

        if (error) {
            console.error('Delete consult error:', error);
            return NextResponse.json({ error: '삭제 실패' }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Consult DELETE error:', error);
        return NextResponse.json({ error: '서버 오류' }, { status: 500 });
    }
}
