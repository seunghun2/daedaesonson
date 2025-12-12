import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://daedaesonson.vercel.app'; // Production URL

    // Main Landing Page
    return [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        // TODO: Add dynamic routes for individual facilities when dynamic routing (e.g. /facility/[id]) is implemented
    ];
}
