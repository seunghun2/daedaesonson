import { getSupabaseServer } from '@/lib/supabaseServer';
import GuideListClient from './GuideListClient';

// ISR: 5분 캐싱 → 빌드 후 CDN에서 즉시 제공
export const revalidate = 300;

export default async function GuidePage() {
    const supabase = getSupabaseServer();

    const { data: posts, count } = await supabase
        .from('blog_posts')
        .select('id, title, slug, category, excerpt, thumbnail_url, author, tags, view_count, created_at', { count: 'exact' })
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .range(0, 49);

    const baseUrl = 'https://daedaesonson.com';
    const blogCollectionJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Blog',
        name: '대대손손 장지·봉안당·수목장 가이드 블로그',
        description: '봉안당, 수목장, 공원묘지 비용 비교부터 묘지 이장 절차, 공설·사설 자격 요건, 현장 답사 체크리스트까지 대대손손이 정리한 장례·추모 실전 가이드.',
        url: `${baseUrl}/blog`,
        inLanguage: 'ko-KR',
        publisher: {
            '@type': 'Organization',
            name: '대대손손',
            url: baseUrl,
            logo: {
                '@type': 'ImageObject',
                url: `${baseUrl}/logo-horizontal.svg`,
            },
        },
        blogPost: (posts || []).map((p) => ({
            '@type': 'BlogPosting',
            headline: p.title,
            description: p.excerpt || p.title,
            url: `${baseUrl}/blog/${p.slug}`,
            datePublished: p.created_at,
            author: {
                '@type': 'Organization',
                name: p.author || '대대손손',
            },
            ...(p.thumbnail_url
                ? {
                    image: p.thumbnail_url.startsWith('http')
                        ? p.thumbnail_url
                        : `${baseUrl}${p.thumbnail_url}`,
                }
                : {}),
        })),
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(blogCollectionJsonLd).replace(/</g, '\\u003c'),
                }}
            />
            <GuideListClient
                initialPosts={posts || []}
                initialTotalPages={Math.ceil((count || 0) / 20)}
            />
        </>
    );
}
