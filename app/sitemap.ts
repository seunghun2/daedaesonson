import { MetadataRoute } from 'next';
import fs from 'fs';
import path from 'path';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://daedaesonson.com';

    // 정적 페이지
    const staticPages = [
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

    // 시설 상세 페이지
    let facilityPages: MetadataRoute.Sitemap = [];

    try {
        const dataPath = path.join(process.cwd(), 'data', 'facilities.json');
        const fileContent = fs.readFileSync(dataPath, 'utf-8');
        const facilities = JSON.parse(fileContent);

        facilityPages = facilities
            .filter((f: any) => f.category !== 'FUNERAL_HOME' && f.category !== 'CREMATORIUM' && f.priceRange?.min > 0)
            .map((f: any) => {
                let lastMod = new Date();
                if (f.lastUpdated) {
                    const parsed = new Date(f.lastUpdated);
                    if (!isNaN(parsed.getTime())) {
                        lastMod = parsed;
                    }
                }
                return {
                    url: `${baseUrl}/facilities/${f.id}`,
                    lastModified: lastMod,
                    changeFrequency: 'weekly' as const,
                    priority: 0.8,
                };
            });
    } catch (e) {
        console.error('Sitemap: Failed to load facilities', e);
    }

    return [...staticPages, ...regionPages, ...facilityPages];
}
