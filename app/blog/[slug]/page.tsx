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

    // 관련 글 가져오기 (같은 카테고리 우선 + 부족 시 최신 글 보충하여 항상 3개 확보)
    const { data: sameCategoryData } = await supabase
        .from('blog_posts')
        .select('id, title, slug, category, excerpt, thumbnail_url, author, tags, view_count, created_at')
        .eq('is_published', true)
        .eq('category', post.category)
        .neq('slug', slug)
        .order('created_at', { ascending: false })
        .limit(3);

    let relatedPosts = sameCategoryData || [];
    if (relatedPosts.length < 3) {
        const excludeSlugs = [slug, ...relatedPosts.map((p: any) => p.slug)];
        const { data: fallbackData } = await supabase
            .from('blog_posts')
            .select('id, title, slug, category, excerpt, thumbnail_url, author, tags, view_count, created_at')
            .eq('is_published', true)
            .not('slug', 'in', `(${excludeSlugs.map(s => `"${s}"`).join(',')})`)
            .order('created_at', { ascending: false })
            .limit(3 - relatedPosts.length);
        if (fallbackData) {
            relatedPosts = [...relatedPosts, ...fallbackData];
        }
    }

    // 본문 텍스트 길이 및 Q&A 추출 (Google FAQPage 리치 스니펫 & AI Overview 최적화)
    const plainText = (post.content || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const wordCount = plainText.split(' ').filter(Boolean).length;

    const extractedFaqs: { question: string; answer: string }[] = [];
    const qaRegex = /<p>\s*<strong>\s*Q\.\s*([\s\S]*?)<\/strong>\s*(?:<br\s*\/?>)?\s*(?:A\.\s*)?([\s\S]*?)<\/p>/gi;
    let match: RegExpExecArray | null;
    while ((match = qaRegex.exec(post.content || '')) !== null) {
        const q = match[1].replace(/<[^>]+>/g, '').trim();
        const a = match[2].replace(/<[^>]+>/g, '').trim();
        if (q && a) {
            extractedFaqs.push({ question: q, answer: a });
        }
    }

    // 본문에 명시적 Q&A가 없는 기존 글도 Google FAQ 스니펫 혜택을 받도록 기본 핵심 FAQ 구성
    if (extractedFaqs.length === 0) {
        extractedFaqs.push(
            {
                question: `${post.title.replace(/\s*—.*$/, '')} 핵심 기준은 무엇인가요?`,
                answer: post.excerpt || `${post.title}에 대한 공설·사설 비교와 실제 비용, 절차를 대대손손 가이드에서 확인하실 수 있습니다.`,
            },
            {
                question: '전국 봉안당·수목장·공원묘지 실제 가격은 어디서 비교할 수 있나요?',
                answer: '대대손손(daedaesonson.com) 지도에서 전국 1,495곳 장지 시설의 공설·사설 여부, 안치단 층별 분양가, 연간 관리비를 전화 없이 한눈에 비교하실 수 있습니다.',
            }
        );
    }

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
        ...(fullImageUrl ? { image: [fullImageUrl] } : {}),
        datePublished: post.created_at,
        dateModified: post.updated_at || post.created_at,
        inLanguage: 'ko-KR',
        articleSection: post.category,
        wordCount,
        author: {
            '@type': 'Organization',
            name: '대대손손 장지연구소',
            url: baseUrl,
        },
        publisher: {
            '@type': 'Organization',
            name: '대대손손',
            url: baseUrl,
            logo: {
                '@type': 'ImageObject',
                url: `${baseUrl}/logo-horizontal.svg`,
            },
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
                name: '장지 가이드 블로그',
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

    const faqJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: extractedFaqs.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: item.answer,
            },
        })),
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingJsonLd).replace(/</g, '\\u003c') }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, '\\u003c') }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, '\\u003c') }}
            />
            <BlogDetailClient
                post={post}
                relatedPosts={relatedPosts}
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
        .select('title, excerpt, thumbnail_url, tags, category, created_at, updated_at')
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
        title: `${post.title} | 대대손손 장지 가이드`,
        description: post.excerpt || post.title,
        keywords: post.tags || [],
        authors: [{ name: '대대손손 장지연구소', url: baseUrl }],
        robots: {
            index: true,
            follow: true,
            googleBot: {
                index: true,
                follow: true,
                'max-video-preview': -1,
                'max-image-preview': 'large' as const,
                'max-snippet': -1,
            },
        },
        openGraph: {
            title: post.title,
            description: post.excerpt || post.title,
            url: `${baseUrl}/blog/${slug}`,
            siteName: '대대손손',
            locale: 'ko_KR',
            type: 'article',
            publishedTime: post.created_at,
            modifiedTime: post.updated_at || post.created_at,
            section: post.category,
            tags: post.tags || [],
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
