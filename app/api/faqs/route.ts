import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

const supabase = getSupabaseServer();

// GET: 공개 FAQ 목록 조회 (인증 불필요)
export async function GET() {
    try {
        const { data, error } = await supabase
            .from('faqs')
            .select('id, question, answer, category, sort_order')
            .eq('is_active', true)
            .order('sort_order', { ascending: true });

        if (error) throw error;

        return NextResponse.json(data || [], {
            headers: {
                'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
            },
        });
    } catch (error: any) {
        console.error('공개 FAQ 조회 오류:', error);
        return NextResponse.json([], { status: 500 });
    }
}
