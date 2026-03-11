import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { cookies } from 'next/headers';

const supabase = getSupabaseServer();

async function checkAdminAuth(): Promise<boolean> {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;
    return token === process.env.ADMIN_TOKEN;
}

// PUT: 블로그 글 수정
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    if (!(await checkAdminAuth())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;
        const body = await request.json();
        const { title, slug, category, excerpt, content, thumbnail_url, author, tags, is_published } = body;

        const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (title !== undefined) updateData.title = title;
        if (slug !== undefined) updateData.slug = slug;
        if (category !== undefined) updateData.category = category;
        if (excerpt !== undefined) updateData.excerpt = excerpt;
        if (content !== undefined) updateData.content = content;
        if (thumbnail_url !== undefined) updateData.thumbnail_url = thumbnail_url;
        if (author !== undefined) updateData.author = author;
        if (tags !== undefined) updateData.tags = tags;
        if (is_published !== undefined) updateData.is_published = is_published;

        const { data, error } = await supabase
            .from('blog_posts')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Blog update error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Blog update error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

// DELETE: 블로그 글 삭제
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    if (!(await checkAdminAuth())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;

        const { error } = await supabase
            .from('blog_posts')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Blog delete error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Blog delete error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
