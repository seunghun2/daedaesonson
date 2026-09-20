import DOMPurify from 'isomorphic-dompurify';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { requireAdmin } from '@/lib/adminAuth';

const supabase = getSupabaseServer();

// GET: 모든 블로그 글 (어드민용, 미발행 포함)
export async function GET(request: NextRequest) {
    const authError = await requireAdmin();
    if (authError) return authError;


    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;

        const { data, error, count } = await supabase
            .from('blog_posts')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            return NextResponse.json({ error: '요청을 처리할 수 없습니다.' }, { status: 500 });
        }

        return NextResponse.json({
            posts: data || [],
            total: count || 0,
            page,
            totalPages: Math.ceil((count || 0) / limit),
        });
    } catch (error) {
        console.error('Admin blog list error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

// POST: 블로그 글 생성
export async function POST(request: NextRequest) {
    const authError = await requireAdmin();
    if (authError) return authError;


    try {
        const body = await request.json();
        const { title, slug, category, excerpt, content, thumbnail_url, author, tags, is_published } = body;

        if (!title || !slug || !content) {
            return NextResponse.json({ error: '제목, 슬러그, 본문은 필수입니다.' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('blog_posts')
            .insert({
                title,
                slug,
                category: category || '가이드',
                excerpt: excerpt || '',
                content: DOMPurify.sanitize(content),
                thumbnail_url: thumbnail_url || '',
                author: author || '대대손손',
                tags: tags || [],
                is_published: is_published ?? false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) {
            console.error('Blog insert error:', error);
            return NextResponse.json({ error: '요청을 처리할 수 없습니다.' }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Blog create error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
