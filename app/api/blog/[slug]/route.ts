import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

const supabase = getSupabaseServer();

// GET: 블로그 글 상세 (+ 조회수 증가)
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;

        const { data, error } = await supabase
            .from('blog_posts')
            .select('*')
            .eq('slug', slug)
            .eq('is_published', true)
            .single();

        if (error || !data) {
            return NextResponse.json({ error: '글을 찾을 수 없습니다.' }, { status: 404 });
        }

        const nextViewCount = (data.view_count || 0) + 1;

        // 조회수 증가 확실하게 대기 (서버리스 람다 동결 누락 방지)
        await supabase
            .from('blog_posts')
            .update({ view_count: nextViewCount })
            .eq('id', data.id);

        return NextResponse.json({ ...data, view_count: nextViewCount });
    } catch (error) {
        console.error('Blog detail error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
