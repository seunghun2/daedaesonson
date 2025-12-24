import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: FAQ 목록 조회
export async function GET() {
    try {
        const { data, error } = await supabase
            .from('faqs')
            .select('*')
            .eq('is_active', true)
            .order('sort_order', { ascending: true });

        if (error) throw error;
        return NextResponse.json(data || []);
    } catch (error: any) {
        console.error('FAQ 조회 오류:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: FAQ 추가
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { question, answer, category = '일반' } = body;

        if (!question || !answer) {
            return NextResponse.json({ error: '질문과 답변을 입력해주세요' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('faqs')
            .insert({ question, answer, category })
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('FAQ 추가 오류:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
