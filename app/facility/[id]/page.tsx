import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { FacilityCategory, FACILITY_CATEGORY_LABELS } from '@/types';
import FacilityPageClient from './FacilityPageClient';
import fs from 'fs';
import path from 'path';

// 🚀 ISR: 60초마다 갱신
export const revalidate = 60;

interface PageProps {
    params: Promise<{ id: string }>;
}

// 📁 로컬 facilities.json에서 시설 데이터 로드 (Supabase 왕복 없이 즉시)
function getFacilityById(id: string) {
    try {
        const filePath = path.join(process.cwd(), 'data', 'facilities.json');
        const raw = fs.readFileSync(filePath, 'utf-8');
        const facilities = JSON.parse(raw);
        return facilities.find((f: any) => f.id === id) || null;
    } catch {
        return null;
    }
}

// 🔥 SSR 메타데이터 생성 (SEO + Open Graph)
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params;
    const data = getFacilityById(id);

    if (!data) {
        return { title: '시설을 찾을 수 없습니다 | 대대손손' };
    }

    const categoryLabel = FACILITY_CATEGORY_LABELS[data.category as FacilityCategory] || '';
    const minPrice = data.minPrice || data.priceRange?.min || 0;
    const priceText = minPrice > 0
        ? `${minPrice >= 10000 ? Math.floor(minPrice / 10000) + '만' : minPrice.toLocaleString()}원~`
        : '';
    const title = `${data.name} ${categoryLabel} 가격정보 | 대대손손`;
    const description = data.description
        || `${data.name} ${categoryLabel} 시설 정보${priceText ? ` (${priceText})` : ''}. ${data.address}. 대대손손에서 가격 비교하세요.`;
    const thumbnail = data.thumbnail || (data.images?.[0]) || '';

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            url: `https://daedaesonson.com/facility/${id}`,
            images: thumbnail ? [{ url: thumbnail, width: 600, height: 400 }] : [],
            type: 'website',
            siteName: '대대손손',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: thumbnail ? [thumbnail] : [],
        },
    };
}

// 🚀 서버 컴포넌트: 로컬 JSON에서 즉시 로드 (Supabase 호출 제거)
export default async function FacilityPage({ params }: PageProps) {
    const { id } = await params;
    const data = getFacilityById(id);

    if (!data) {
        notFound();
    }

    const facilityBasic = {
        id: data.id,
        name: data.name,
        address: data.address || '',
        coordinates: data.coordinates || { lat: data.lat || 0, lng: data.lng || 0 },
        category: data.category,
        priceRange: data.priceRange || { min: data.minPrice || 0, max: data.maxPrice || 0 },
        operatorType: data.operatorType,
        isPublic: data.isPublic ?? false,
        thumbnail: data.thumbnail || (data.images?.[0]) || '',
        rating: data.rating || 0,
        reviewCount: data.reviewCount || 0,
        description: data.description || '',
        phone: data.phone || '',
    };

    return <FacilityPageClient facilityBasic={facilityBasic} />;
}
