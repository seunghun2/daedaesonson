import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

const supabase = getSupabaseServer();

// GET: 공개 정책 조회 (인증 불필요)
export async function GET(
    request: Request,
    { params }: { params: Promise<{ type: string }> }
) {
    try {
        const { type } = await params;

        // type 유효성 검증
        if (!['terms', 'privacy'].includes(type)) {
            return NextResponse.json({ error: 'Invalid policy type' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('site_policies')
            .select('title, content, version, updated_at')
            .eq('type', type)
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        return NextResponse.json(data || null, {
            headers: {
                'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
            },
        });
    } catch (error: any) {
        console.error('공개 정책 조회 오류:', error);
        return NextResponse.json(null, { status: 500 });
    }
}
