import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jbydmhfuqnpukfutvrgs.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false }
});

// PUT: 1:1 문의 답변/상태 업데이트
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { admin_reply, status } = body;

        const updateData: any = { updated_at: new Date().toISOString() };
        if (admin_reply !== undefined) {
            updateData.admin_reply = admin_reply;
            updateData.replied_at = new Date().toISOString();
        }
        if (status) updateData.status = status;

        const { data, error } = await supabase
            .from('contact_inquiries')
            .update(updateData)
            .eq('id', parseInt(id))
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('1:1 문의 수정 오류:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE: 1:1 문의 삭제
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const { error } = await supabase
            .from('contact_inquiries')
            .delete()
            .eq('id', parseInt(id));

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('1:1 문의 삭제 오류:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
