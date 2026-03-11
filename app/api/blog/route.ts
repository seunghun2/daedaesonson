import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

const supabase = getSupabaseServer();

// GET: 발행된 블로그 글 목록
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const tag = searchParams.get('tag');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const offset = (page - 1) * limit;

        let query = supabase
            .from('blog_posts')
            .select('id, title, slug, category, excerpt, thumbnail_url, author, tags, view_count, created_at', { count: 'exact' })
            .eq('is_published', true)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (category && category !== '전체') {
            query = query.eq('category', category);
        }

        if (tag) {
            query = query.contains('tags', [tag]);
        }

        const { data, error, count } = await query;

        if (error) {
            console.error('Blog list error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            posts: data || [],
            total: count || 0,
            page,
            totalPages: Math.ceil((count || 0) / limit),
        });
    } catch (error) {
        console.error('Blog API error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
