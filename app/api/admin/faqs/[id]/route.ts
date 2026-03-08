import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

const supabase = getSupabaseServer();

// PUT: FAQ 수정
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { question, answer, category, is_active, sort_order } = body;

        const { data, error } = await supabase
            .from('faqs')
            .update({ question, answer, category, is_active, sort_order, updated_at: new Date().toISOString() })
            .eq('id', parseInt(id))
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('FAQ 수정 오류:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE: FAQ 삭제
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const { error } = await supabase
            .from('faqs')
            .delete()
            .eq('id', parseInt(id));

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('FAQ 삭제 오류:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
