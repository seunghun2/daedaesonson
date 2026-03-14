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

    // JSON-LD 구조화 데이터
    const baseUrl = 'https://daedaesonson.com';
    const fullImageUrl = post.thumbnail_url
        ? post.thumbnail_url.startsWith('http')
            ? post.thumbnail_url
            : `${baseUrl}${post.thumbnail_url}`
        : undefined;

    const blogPostingJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.excerpt || post.title,
        ...(fullImageUrl ? { image: fullImageUrl } : {}),
        datePublished: post.created_at,
        dateModified: post.updated_at || post.created_at,
        author: {
            '@type': 'Organization',
            name: '대대손손',
            url: baseUrl,
        },
        publisher: {
            '@type': 'Organization',
            name: '대대손손',
            url: baseUrl,
        },
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `${baseUrl}/blog/${slug}`,
        },
        ...(post.tags && post.tags.length > 0 ? { keywords: post.tags.join(', ') } : {}),
    };

    const breadcrumbJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            {
                '@type': 'ListItem',
                position: 1,
                name: '홈',
                item: baseUrl,
            },
            {
                '@type': 'ListItem',
                position: 2,
                name: '블로그',
                item: `${baseUrl}/blog`,
            },
            {
                '@type': 'ListItem',
                position: 3,
                name: post.category,
                item: `${baseUrl}/blog?category=${encodeURIComponent(post.category)}`,
            },
            {
                '@type': 'ListItem',
                position: 4,
                name: post.title,
                item: `${baseUrl}/blog/${slug}`,
            },
        ],
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingJsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
            />
            <BlogDetailClient
                post={post}
                relatedPosts={relatedData || []}
            />
        </>
    );
}

// SEO용 메타데이터 생성
export async function generateMetadata({ params }: PageProps) {
    const { slug } = await params;
    const supabase = getSupabaseServer();

    const { data: post } = await supabase
        .from('blog_posts')
        .select('title, excerpt, thumbnail_url, tags')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();

    if (!post) return { title: '글을 찾을 수 없습니다' };

    const baseUrl = 'https://daedaesonson.com';
    const ogImage = post.thumbnail_url
        ? post.thumbnail_url.startsWith('http')
            ? post.thumbnail_url
            : `${baseUrl}${post.thumbnail_url}`
        : undefined;

    return {
        title: `${post.title} | 대대손손 가이드`,
        description: post.excerpt || post.title,
        keywords: post.tags || [],
        openGraph: {
            title: post.title,
            description: post.excerpt || post.title,
            url: `${baseUrl}/blog/${slug}`,
            siteName: '대대손손',
            locale: 'ko_KR',
            type: 'article',
            ...(ogImage ? { images: [{ url: ogImage, width: 1024, height: 1024, alt: post.title }] } : {}),
        },
        twitter: {
            card: 'summary_large_image',
            title: post.title,
            description: post.excerpt || post.title,
            ...(ogImage ? { images: [ogImage] } : {}),
        },
        alternates: {
            canonical: `/blog/${slug}`,
        },
    };
}
