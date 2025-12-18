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

    // 시설 상세 페이지
    let facilityPages: MetadataRoute.Sitemap = [];

    try {
        const dataPath = path.join(process.cwd(), 'data', 'facilities.json');
        const fileContent = fs.readFileSync(dataPath, 'utf-8');
        const facilities = JSON.parse(fileContent);

        facilityPages = facilities
            .filter((f: any) => f.category !== 'FUNERAL_HOME' && f.category !== 'CREMATORIUM' && f.priceRange?.min > 0)
            .map((f: any) => ({
                url: `${baseUrl}/facilities/${f.id}`,
                lastModified: f.lastUpdated ? new Date(f.lastUpdated) : new Date(),
                changeFrequency: 'weekly' as const,
                priority: 0.8,
            }));
    } catch (e) {
        console.error('Sitemap: Failed to load facilities', e);
    }

    return [...staticPages, ...facilityPages];
}
