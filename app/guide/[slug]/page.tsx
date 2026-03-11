import { notFound } from 'next/navigation';
import { getSupabaseServer } from '@/lib/supabaseServer';
import BlogDetailClient from './BlogDetailClient';

interface PageProps {
    params: Promise<{ slug: string }>;
}

// 서버에서 데이터를 미리 가져와서 클라이언트 컴포넌트에 전달
export default async function GuideDetailPage({ params }: PageProps) {
    const { slug } = await params;
    const supabase = getSupabaseServer();

    // 메인 포스트 가져오기
    const { data: post, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();

    if (error || !post) {
        notFound();
    }

    // 조회수 증가 (비동기, 에러 무시)
    supabase
        .from('blog_posts')
        .update({ view_count: (post.view_count || 0) + 1 })
        .eq('id', post.id)
        .then(() => {});

    // 관련 글 가져오기
    const { data: relatedData } = await supabase
        .from('blog_posts')
        .select('id, title, slug, category, excerpt, thumbnail_url, author, tags, view_count, created_at')
        .eq('is_published', true)
        .eq('category', post.category)
        .neq('slug', slug)
        .order('created_at', { ascending: false })
        .limit(3);

    return (
        <BlogDetailClient
            post={post}
            relatedPosts={relatedData || []}
        />
    );
}

// SEO용 메타데이터 생성
export async function generateMetadata({ params }: PageProps) {
    const { slug } = await params;
    const supabase = getSupabaseServer();

    const { data: post } = await supabase
        .from('blog_posts')
        .select('title, excerpt, thumbnail_url')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();

    if (!post) return { title: '글을 찾을 수 없습니다' };

    return {
        title: `${post.title} | 대대손손 가이드`,
        description: post.excerpt || post.title,
        openGraph: {
            title: post.title,
            description: post.excerpt || post.title,
            images: post.thumbnail_url ? [post.thumbnail_url] : [],
            type: 'article',
        },
    };
}
