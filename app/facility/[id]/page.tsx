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
    const isPublic = data.isPublic ? '공설' : '사설';

    // 주소에서 시/도, 시/군/구 추출
    const addrTokens = (data.address || '').split(' ');
    const region = addrTokens[0] || ''; // 경기도, 서울특별시 등
    const city = addrTokens[1] || '';   // 용인시, 강남구 등
    const shortRegion = region.replace(/특별자치(시|도)|특별시|광역시|도$/g, '') || region;
    const locationText = city ? `${shortRegion} ${city}` : shortRegion;

    // 가격 텍스트 생성
    const minPrice = data.minPrice || data.priceRange?.min || 0;
    const maxPrice = data.maxPrice || data.priceRange?.max || 0;
    let priceText = '';
    if (minPrice > 0) {
        const minStr = minPrice >= 10000 ? Math.floor(minPrice / 10000) + '만' : minPrice.toLocaleString();
        if (maxPrice > minPrice) {
            const maxStr = maxPrice >= 10000 ? Math.floor(maxPrice / 10000) + '만' : maxPrice.toLocaleString();
            priceText = `${minStr}원~${maxStr}원`;
        } else {
            priceText = `${minStr}원~`;
        }
    }

    // 서비스 유형 키워드 (매장, 봉안, 수목장 등)
    const serviceTypes: string[] = [];
    const stdPrices = data.standardizedPrices || data.priceInfo?.standardizedPrices;
    if (stdPrices?.length) {
        const types = new Set(stdPrices.map((p: any) => p.serviceType));
        if (types.has('BURIAL') || types.has('FAMILY_GRAVE')) serviceTypes.push('매장');
        if (types.has('BONGSAN') || types.has('CHARNEL')) serviceTypes.push('봉안');
        if (types.has('NATURAL_BURIAL')) serviceTypes.push('수목장');
        if (types.has('CREMATION')) serviceTypes.push('화장');
    }
    const serviceText = serviceTypes.length > 0 ? serviceTypes.join('·') : categoryLabel;

    // 🔥 SEO 최적화 타이틀 (예: "서울공원묘원 | 공원묘지 가격 50만원~ | 경기 용인시 | 대대손손")
    const titleParts = [data.name];
    if (categoryLabel) titleParts.push(categoryLabel);
    if (priceText) titleParts.push(`가격 ${priceText}`);
    if (locationText) titleParts.push(locationText);
    titleParts.push('대대손손');
    const title = titleParts.join(' | ');

    // 🔥 SEO 최적화 설명 (풍부한 정보 포함)
    const descParts: string[] = [];
    descParts.push(`${data.name} ${categoryLabel} 위치, 가격, 정보 상세보기.`);
    descParts.push(`${isPublic}.`);
    if (serviceText) descParts.push(`${serviceText} 가격표 제공.`);
    if (priceText) descParts.push(`${priceText}.`);
    if (data.address) descParts.push(`${data.address}.`);
    if (data.phone) descParts.push(`☎ ${data.phone}.`);
    descParts.push('대대손손에서 전국 장묘시설 가격을 비교하세요.');
    const description = descParts.join(' ');

    const thumbnail = data.thumbnail || (data.images?.[0]) || '';

    // 키워드 강화
    const keywords = [
        data.name, categoryLabel, isPublic, '가격', '비용', '가격표',
        serviceText, region, city, locationText,
        '장묘', '묘지', '추모', '대대손손',
    ].filter(Boolean);

    return {
        title,
        description,
        keywords,
        alternates: {
            canonical: `/facility/${id}`,
        },
        openGraph: {
            title: `${data.name} ${categoryLabel} 가격정보 | 대대손손`,
            description,
            url: `https://daedaesonson.com/facility/${id}`,
            images: thumbnail ? [{ url: thumbnail, width: 1200, height: 630, alt: `${data.name} ${categoryLabel}` }] : [],
            type: 'website',
            siteName: '대대손손',
            locale: 'ko_KR',
        },
        twitter: {
            card: 'summary_large_image',
            title: `${data.name} ${categoryLabel} 가격정보 | 대대손손`,
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
    // JSON-LD 구조화 데이터 (검색 엔진 리치 스니펫)
    const categoryLabel = FACILITY_CATEGORY_LABELS[data.category as FacilityCategory] || '';
    const coords = data.coordinates || { lat: data.lat || 0, lng: data.lng || 0 };
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: data.name,
        description: data.description || `${data.name} ${categoryLabel} 시설 정보`,
        address: {
            '@type': 'PostalAddress',
            streetAddress: data.address || '',
            addressCountry: 'KR',
        },
        ...(coords.lat && coords.lng ? {
            geo: {
                '@type': 'GeoCoordinates',
                latitude: coords.lat,
                longitude: coords.lng,
            }
        } : {}),
        ...(data.phone ? { telephone: data.phone } : {}),
        ...(data.thumbnail || data.images?.[0] ? { image: data.thumbnail || data.images[0] } : {}),
        url: `https://daedaesonson.com/facility/${id}`,
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <FacilityPageClient facilityBasic={facilityBasic} />
        </>
    );
}
