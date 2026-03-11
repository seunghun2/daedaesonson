import { notFound } from 'next/navigation';
import { getSupabaseServer } from '@/lib/supabaseServer';
import BlogDetailClient from './BlogDetailClient';

// ISR: 1시간 캐싱 → 한번 렌더된 페이지는 CDN에서 즉시 제공
export const revalidate = 3600;

interface PageProps {
    params: Promise<{ slug: string }>;
}

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
