import { Suspense } from 'react';
import HomeClient from './HomeClient';
import { Facility } from '@/types';

// 서버에서 시설 데이터 미리 로드 (Supabase API 사용)
async function getFacilities(): Promise<Facility[]> {
  try {
    // 내부 API 호출 대신 직접 fetch (SSR에서 절대 URL 필요)
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/facilities`, {
      cache: 'no-store', // 항상 최신 데이터
    });

    if (!res.ok) {
      console.error('Failed to fetch facilities:', res.status);
      return [];
    }

    const facilities = await res.json();

    // 장례식장, 화장시설 제외 + isActive=false 제외 + 0원 제외 + 필요한 필드만 추출 (경량화)
    return facilities
      .filter((f: any) => f.category !== 'FUNERAL_HOME' && f.category !== 'CREMATORIUM' && f.isActive !== false && (f.priceRange?.min > 0))
      .map((f: any) => ({
        id: f.id,
        name: f.name,
        address: f.address,
        coordinates: f.coordinates,
        category: f.category,
        priceRange: f.priceRange,
        operatorType: f.operatorType,
        hasParking: f.hasParking,
        hasRestaurant: f.hasRestaurant,
        hasStore: f.hasStore,
        hasAccessibility: f.hasAccessibility,
        isPublic: f.isPublic,
        images: f.images || [],
        imageGallery: f.imageGallery || [],
        reviewCount: f.reviewCount,
        rating: f.rating,
        phone: f.phone,
        fax: f.fax,
        capacity: f.capacity,
        lastUpdated: f.lastUpdated,
        website: f.website || f.websiteUrl,
        pricing: f.pricing,
        priceInfo: f.priceInfo,
        description: f.description || '',
      }));
  } catch (error) {
    console.error('Failed to load facilities:', error);
    return [];
  }
}

export default async function Home() {
  // 서버에서 데이터 미리 로드 (SSR)
  const initialFacilities = await getFacilities();

  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>로딩 중...</div>}>
      <HomeClient initialFacilities={initialFacilities} />
    </Suspense>
  );
}
