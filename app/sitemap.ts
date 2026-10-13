import { MetadataRoute } from 'next';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { loadFacilitiesJson } from '@/lib/facilityDataLoader';

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
        {
            url: `${baseUrl}/inquiries`,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 0.7,
        },
        {
            url: `${baseUrl}/glossary`,
            lastModified: new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.8,
        },
    ];

    // 장묘 용어 사전 상세 페이지 (롱테일 SEO 검색어 타겟팅)
    const GLOSSARY_SLUGS = [
        'jandijang', 'gongwonmyoji', 'ijang', 'bongandang',
        'hapjang', 'jayeonjang', 'biyong', 'bonganham',
        'sumokjang', 'anchi', 'chumogongwon', 'hwajang', 'napgol'
    ];
    const glossaryPages: MetadataRoute.Sitemap = GLOSSARY_SLUGS.map(slug => ({
        url: `${baseUrl}/glossary/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.75,
    }));

    // 지역별 랜딩페이지 (프로그래매틱 SEO)
    const REGIONS = ['서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];
    const CATEGORIES = ['봉안당', '수목장', '공원묘지'];

    const regionPages: MetadataRoute.Sitemap = [];
    for (const region of REGIONS) {
        for (const category of CATEGORIES) {
            regionPages.push({
                url: `${baseUrl}/%EC%A7%80%EC%97%AD/${encodeURIComponent(`${region}-${category}`)}`,
                lastModified: new Date(),
                changeFrequency: 'weekly' as const,
                priority: 0.85,
            });
        }
    }
    // 시/군 단위 랜딩페이지 (세분화 SEO)
    const cityPages: MetadataRoute.Sitemap = [];
    const allFacilities = loadFacilitiesJson();
    const HOMONYMOUS_DISTRICTS = new Set(['중구', '남구', '동구', '서구', '북구', '강서구', '고성군']);
    const SHORT_PROVINCE_MAP: Record<string, string> = {
        '서울특별시': '서울', '부산광역시': '부산', '대구광역시': '대구', '인천광역시': '인천',
        '광주광역시': '광주', '대전광역시': '대전', '울산광역시': '울산', '세종특별자치시': '세종',
        '경기도': '경기', '강원특별자치도': '강원', '강원도': '강원',
        '충청북도': '충북', '충청남도': '충남',
        '전북특별자치도': '전북', '전라북도': '전북', '전라남도': '전남',
        '경상북도': '경북', '경상남도': '경남', '제주특별자치도': '제주',
    };

    try {
        const combos = new Map<string, number>();
        allFacilities.forEach((f: any) => {
            if (!f.address || !f.category) return;
            if (f.category === 'FUNERAL_HOME' || f.isActive === false) return;
            if (!f.priceRange?.min || f.priceRange.min <= 0) return;

            const tokens = f.address.trim().split(/\s+/);
            const prov = tokens[0];
            const rawCity = tokens[1];
            if (!prov || !rawCity) return;
            const city = HOMONYMOUS_DISTRICTS.has(rawCity)
                ? `${SHORT_PROVINCE_MAP[prov] || prov.slice(0, 2)} ${rawCity}`
                : rawCity;

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
                    url: `${baseUrl}/search/${encodeURIComponent(city)}/${encodeURIComponent(category)}`,
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
        facilityPages = allFacilities
            .filter((f: any) => f.category !== 'FUNERAL_HOME' && f.isActive !== false)
            .map((f: any) => {
                let lastMod = new Date();
                const dateStr = f.updatedAt || f.lastUpdated;
                if (dateStr && /^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
                    const parsed = new Date(dateStr);
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
                    url: `${baseUrl}/blog/${encodeURIComponent(post.slug)}`,
                    lastModified: new Date(post.updated_at),
                    changeFrequency: 'weekly' as const,
                    priority: 0.85,
                });
            });
        }
    } catch (e) {
        console.error('Sitemap: Failed to load blog posts', e);
    }

    return [...staticPages, ...glossaryPages, ...regionPages, ...cityPages, ...facilityPages, ...blogPages];
}
