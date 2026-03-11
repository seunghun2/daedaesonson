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

        // 조회수 증가 (비동기, 에러 무시)
        supabase
            .from('blog_posts')
            .update({ view_count: (data.view_count || 0) + 1 })
            .eq('id', data.id)
            .then(() => {});

        return NextResponse.json(data);
    } catch (error) {
        console.error('Blog detail error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
