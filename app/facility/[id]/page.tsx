import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { FacilityCategory, FACILITY_CATEGORY_LABELS } from '@/types';
import FacilityPageClient from './FacilityPageClient';
import { getCachedFacility, getCachedAllFacilities } from '@/lib/facilityDataLoader';

// ISR: 60초마다 갱신
export const revalidate = 60;

interface PageProps {
    params: Promise<{ id: string }>;
}

const SHORT_PROVINCE_MAP: Record<string, string> = {
    '서울특별시': '서울',
    '부산광역시': '부산',
    '대구광역시': '대구',
    '인천광역시': '인천',
    '광주광역시': '광주',
    '대전광역시': '대전',
    '울산광역시': '울산',
    '세종특별자치시': '세종',
    '경기도': '경기',
    '강원도': '강원',
    '강원특별자치도': '강원',
    '충청북도': '충북',
    '충청남도': '충남',
    '전라북도': '전북',
    '전북특별자치도': '전북',
    '전라남도': '전남',
    '경상북도': '경북',
    '경상남도': '경남',
    '제주특별자치도': '제주',
    '제주도': '제주',
};

function shortenProvince(region: string): string {
    if (!region) return '';
    return SHORT_PROVINCE_MAP[region] || region.replace(/특별자치(시|도)|특별시|광역시|도$/g, '') || region;
}

// SSR 메타데이터 생성 (SEO + Open Graph)
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params;
    const data = getCachedFacility(id);

    if (!data || data.isActive === false) {
        notFound();
    }

    const categoryLabel = FACILITY_CATEGORY_LABELS[data.category as FacilityCategory] || '';
    const isPublic = data.isPublic ? '공설' : '사설';

    // 주소에서 시/도, 시/군/구 추출
    const addrTokens = (data.address || '').split(' ');
    const region = addrTokens[0] || ''; // 경기도, 서울특별시 등
    const city = addrTokens[1] || '';   // 용인시, 강남구 등
    const shortRegion = shortenProvince(region);
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
        if (types.has('BONGSAN') || types.has('CHARNEL') || types.has('CHARNEL_HOUSE')) serviceTypes.push('봉안');
        if (types.has('NATURAL') || types.has('NATURAL_BURIAL')) serviceTypes.push('수목장');
        if (types.has('CREMATION')) serviceTypes.push('화장');
    }
    const serviceText = serviceTypes.length > 0 ? serviceTypes.join('·') : categoryLabel;

    // SEO 최적화 타이틀 (예: "서울공원묘원 | 공원묘지 가격 50만원~ | 경기 용인시 | 대대손손")
    const titleParts = [data.name];
    if (categoryLabel) titleParts.push(categoryLabel);
    if (priceText) titleParts.push(`가격 ${priceText}`);
    if (locationText) titleParts.push(locationText);
    titleParts.push('대대손손');
    const title = titleParts.join(' | ');

    // SEO 최적화 설명 (풍부한 정보 포함)
    const descParts: string[] = [];
    descParts.push(`${data.name} ${categoryLabel} 위치, 가격, 정보 상세보기.`);
    descParts.push(`${isPublic}.`);
    if (serviceText) descParts.push(`${serviceText} 가격표 제공.`);
    if (priceText) descParts.push(`${priceText}.`);
    if (data.address) descParts.push(`${data.address}.`);
    if (data.phone) descParts.push(`전화 ${data.phone}.`);
    descParts.push('대대손손에서 전국 장묘시설 가격을 비교하세요.');
    const description = descParts.join(' ');

    const thumbnail = data.thumbnail || (data.images?.[0]) || '';

    // 키워드 강화
    const keywords = [
        data.name, categoryLabel, isPublic, '가격', '비용', '가격표',
        serviceText, region, city, locationText,
        '장묘', '묘지', '추모', '대대손손',
    ].filter(Boolean);

    const ogImageUrl = thumbnail || 'https://daedaesonson.com/icon.svg';

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
            images: [{ url: ogImageUrl, width: 1200, height: 630, alt: `${data.name} ${categoryLabel}` }],
            type: 'website',
            siteName: '대대손손',
            locale: 'ko_KR',
        },
        twitter: {
            card: 'summary_large_image',
            title: `${data.name} ${categoryLabel} 가격정보 | 대대손손`,
            description,
            images: [ogImageUrl],
        },
    };
}

// 서버 컴포넌트: 로컬 JSON에서 즉시 로드 (Supabase 호출 제거)
export default async function FacilityPage({ params }: PageProps) {
    const { id } = await params;
    const data = getCachedFacility(id);

    if (!data || data.isActive === false) {
        notFound();
    }

    // 이미지 목록 파싱
    let parsedImages: string[] = [];
    if (Array.isArray(data.imageGallery) && data.imageGallery.length > 0) {
        parsedImages = data.imageGallery;
    } else if (Array.isArray(data.images) && data.images.length > 0) {
        parsedImages = data.images;
    } else if (typeof data.images === 'string' && data.images.trim()) {
        try {
            const p = JSON.parse(data.images);
            if (Array.isArray(p)) parsedImages = p;
            else parsedImages = data.images.split(',').map((s: string) => s.trim()).filter(Boolean);
        } catch {
            parsedImages = data.images.split(',').map((s: string) => s.trim()).filter(Boolean);
        }
    } else if (data.thumbnail) {
        parsedImages = [data.thumbnail];
    }

    const coords = data.coordinates || { lat: data.lat || 0, lng: data.lng || 0 };

    const facilityBasic = {
        id: data.id,
        name: data.name,
        address: data.address || '',
        coordinates: coords,
        category: data.category,
        priceRange: data.priceRange || { min: data.minPrice || 0, max: data.maxPrice || 0 },
        representativePrice: data.representativePrice || data.minPrice || 0,
        priceInfo: data.priceInfo || data.pricing || null,
        operatorType: data.operatorType,
        isPublic: data.isPublic ?? false,
        isFull: data.isFull ?? false,
        hasParking: data.hasParking ?? false,
        hasRestaurant: data.hasRestaurant ?? false,
        hasStore: data.hasStore ?? false,
        hasAccessibility: data.hasAccessibility ?? false,
        thumbnail: data.thumbnail || parsedImages[0] || '',
        images: parsedImages,
        imageGallery: parsedImages,
        rating: data.rating || 0,
        reviewCount: data.reviewCount || 0,
        favoriteCount: data.favoriteCount || 0,
        viewCount: data.viewCount || 0,
        description: data.description || '',
        phone: data.phone || '',
        fax: data.fax || '',
        websiteUrl: data.websiteUrl || '',
        capacity: data.capacity,
        lastUpdated: data.lastUpdated,
        updatedAt: data.updatedAt,
    };

    // 서버에서 주변 시설 12개 사전 계산 (클라이언트에서 1.13MB /api/facilities 전체 호출 제거)
    const allFacilities = getCachedAllFacilities();
    const nearbyFacilities = (coords.lat && coords.lng)
        ? allFacilities
            .filter((f: any) => f.id !== data.id && f.isActive !== false && f.category !== 'FUNERAL_HOME')
            .map((f: any) => {
                const fc = f.coordinates || { lat: f.lat || 0, lng: f.lng || 0 };
                const dLat = (fc.lat || 0) - coords.lat;
                const dLng = (fc.lng || 0) - coords.lng;
                return { f, distSq: dLat * dLat + dLng * dLng };
            })
            .sort((a: any, b: any) => a.distSq - b.distSq)
            .slice(0, 12)
            .map(({ f }: any) => ({
                id: f.id,
                name: f.name,
                address: f.address || '',
                coordinates: f.coordinates || { lat: f.lat || 0, lng: f.lng || 0 },
                category: f.category,
                priceRange: f.priceRange || { min: f.minPrice || 0, max: f.maxPrice || 0 },
                representativePrice: f.representativePrice || f.minPrice || 0,
                isPublic: f.isPublic ?? false,
                thumbnail: f.thumbnail || (Array.isArray(f.images) ? f.images[0] : '') || '',
                rating: f.rating || 0,
                reviewCount: f.reviewCount || 0,
            }))
        : [];

    // JSON-LD 구조화 데이터 (검색 엔진 리치 스니펫)
    const categoryLabel = FACILITY_CATEGORY_LABELS[data.category as FacilityCategory] || '';
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
        ...(facilityBasic.thumbnail ? { image: facilityBasic.thumbnail } : {}),
        url: `https://daedaesonson.com/facility/${id}`,
    };

    const minPrice = data.minPrice || data.priceRange?.min || 0;
    const maxPrice = data.maxPrice || data.priceRange?.max || 0;

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
            />
            {/* 검색엔진 크롤러용 SSR 시맨틱 마크업 */}
            <article style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>
                <h1>{data.name} - {categoryLabel} 가격 및 시설 정보</h1>
                <p>구분: {data.isPublic ? '공설' : '사설'} {categoryLabel}</p>
                {data.address && <p>주소: {data.address}</p>}
                {data.phone && <p>전화번호: {data.phone}</p>}
                {minPrice > 0 && <p>예상 이용 가격: {minPrice.toLocaleString()}원 ~ {maxPrice > minPrice ? `${maxPrice.toLocaleString()}원` : ''}</p>}
                {data.description && <p>{data.description}</p>}
            </article>
            <FacilityPageClient facilityBasic={facilityBasic} initialNearbyFacilities={nearbyFacilities} />
        </>
    );
}
