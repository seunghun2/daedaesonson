import { MetadataRoute } from 'next';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jbydmhfuqnpukfutvrgs.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://daedaesonson.com';

    // 정적 페이지
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 1,
        },
        {
            url: `${baseUrl}/list`,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 0.9,
        },
        {
            url: `${baseUrl}/about`,
            lastModified: new Date(),
            changeFrequency: 'monthly' as const,
            priority: 0.8,
        },
        {
            url: `${baseUrl}/privacy`,
            lastModified: new Date(),
            changeFrequency: 'yearly' as const,
            priority: 0.3,
        },
        {
            url: `${baseUrl}/terms`,
            lastModified: new Date(),
            changeFrequency: 'yearly' as const,
            priority: 0.3,
        },
        {
            url: `${baseUrl}/faq`,
            lastModified: new Date(),
            changeFrequency: 'monthly' as const,
            priority: 0.5,
        },
    ];

    // 지역별 랜딩페이지 (프로그래매틱 SEO)
    const REGIONS = ['서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];
    const CATEGORIES = ['봉안당', '수목장', '공원묘지'];

    const regionPages: MetadataRoute.Sitemap = [];
    for (const region of REGIONS) {
        for (const category of CATEGORIES) {
            regionPages.push({
                url: `${baseUrl}/지역/${region}-${category}`,
                lastModified: new Date(),
                changeFrequency: 'weekly' as const,
                priority: 0.85,
            });
        }
    }
    // 시/군 단위 랜딩페이지 (세분화 SEO)
    const cityPages: MetadataRoute.Sitemap = [];
    try {
        const dataPath = path.join(process.cwd(), 'data', 'facilities.json');
        const fileContent = fs.readFileSync(dataPath, 'utf-8');
        const allFacilities = JSON.parse(fileContent);

        const combos = new Map<string, number>();
        allFacilities.forEach((f: any) => {
            if (!f.address || !f.category) return;
            if (f.category === 'FUNERAL_HOME') return;

            const tokens = f.address.split(' ');
            const city = tokens[1];
            if (!city) return;

            let catSlug = '';
            if (f.category === 'CHARNEL_HOUSE') catSlug = '봉안당';
            else if (f.category === 'NATURAL_BURIAL') catSlug = '수목장';
            else if (f.category === 'FAMILY_GRAVE') catSlug = '공원묘지';
            else return;

            const key = `${city}|${catSlug}`;
            combos.set(key, (combos.get(key) || 0) + 1);
        });

        combos.forEach((count, key) => {
            if (count >= 2) {
                const [city, category] = key.split('|');
                cityPages.push({
                    url: `${baseUrl}/search/${city}/${category}`,
                    lastModified: new Date(),
                    changeFrequency: 'weekly' as const,
                    priority: 0.8,
                });
            }
        });
    } catch (e) {
        console.error('Sitemap: Failed to generate city pages', e);
    }

    // 시설 상세 페이지
    let facilityPages: MetadataRoute.Sitemap = [];

    try {
        const dataPath = path.join(process.cwd(), 'data', 'facilities.json');
        const fileContent = fs.readFileSync(dataPath, 'utf-8');
        const facilities = JSON.parse(fileContent);

        facilityPages = facilities
            .filter((f: any) => f.category !== 'FUNERAL_HOME')
            .map((f: any) => {
                let lastMod = new Date();
                if (f.lastUpdated && /^\d{4}-\d{2}-\d{2}/.test(f.lastUpdated)) {
                    const parsed = new Date(f.lastUpdated);
                    if (!isNaN(parsed.getTime()) && parsed.getFullYear() >= 2020 && parsed.getFullYear() <= 2030) {
                        lastMod = parsed;
                    }
                }
                return {
                    url: `${baseUrl}/facility/${f.id}`,
                    lastModified: lastMod,
                    changeFrequency: 'weekly' as const,
                    priority: 0.8,
                };
            });
    } catch (e) {
        console.error('Sitemap: Failed to load facilities', e);
    }

    // 블로그 페이지
    const blogPages: MetadataRoute.Sitemap = [
        {
            url: `${baseUrl}/blog`,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 0.9,
        },
    ];

    try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data: posts } = await supabase
            .from('blog_posts')
            .select('slug, updated_at')
            .eq('is_published', true)
            .order('created_at', { ascending: false });

        if (posts) {
            posts.forEach(post => {
                blogPages.push({
                    url: `${baseUrl}/blog/${post.slug}`,
                    lastModified: new Date(post.updated_at),
                    changeFrequency: 'weekly' as const,
                    priority: 0.85,
                });
            });
        }
    } catch (e) {
        console.error('Sitemap: Failed to load blog posts', e);
    }

    return [...staticPages, ...regionPages, ...cityPages, ...facilityPages, ...blogPages];
}
