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
        .range(0, 9);

    return (
        <GuideListClient
            initialPosts={posts || []}
            initialTotalPages={Math.ceil((count || 0) / 10)}
        />
    );
}
