import { Suspense } from 'react';
import HomeClient from './HomeClient';
import { Facility } from '@/types';

// 🚀 ISR: 5분(300초)마다 데이터 갱신, 그 사이엔 캐싱된 빠른 데이터 사용
export const revalidate = 300;

// 서버에서 시설 데이터 미리 로드 (API 호출 + 캐싱)
async function getFacilities(): Promise<Facility[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/facilities`, {
      next: { revalidate: 300 }  // 5분 캐싱
    });

    if (!res.ok) {
      console.error('API fetch failed:', res.status);
      return [];
    }

    const data = await res.json();

    // 장례식장, 화장시설 제외 + isActive=false 제외
    return data
      .filter((f: any) => f.category !== 'FUNERAL_HOME' && f.category !== 'CREMATORIUM' && f.isActive !== false)
      .map((f: any) => {
        // 대표 이미지 1장 추출
        let thumbnail = '';
        if (f.images) {
          try {
            const imgs = typeof f.images === 'string' ? JSON.parse(f.images) : f.images;
            if (Array.isArray(imgs) && imgs.length > 0) thumbnail = imgs[0];
          } catch { }
        }
        return {
          id: f.id,
          name: f.name,
          address: f.address,
          coordinates: f.coordinates,
          category: f.category,
          priceRange: f.priceRange,
          priceInfo: f.priceInfo,  // 🔥 priceInfo 포함!
          representativePricing: f.representativePricing,  // 🔥 representativePricing 포함!
          operatorType: f.operatorType,
          isPublic: f.isPublic,
          thumbnail,
        };
      });
  } catch (error) {
    console.error('Failed to load facilities:', error);
    return [];
  }
}

export default async function Home() {
  // API에서 데이터 로드 (priceInfo 포함)
  const initialFacilities = await getFacilities();

  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>로딩 중...</div>}>
      <HomeClient initialFacilities={initialFacilities} />
    </Suspense>
  );
}
