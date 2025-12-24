import { Suspense } from 'react';
import HomeClient from './HomeClient';
import { Facility } from '@/types';
import facilitiesData from '@/data/facilities.json';

// 🔥 정적 데이터 사용 - 빌드 시 포함됨 (매우 빠름)
export const dynamic = 'force-static';

// 서버에서 시설 데이터 미리 로드 (정적 JSON)
function getFacilities(): Facility[] {
  try {
    // 가격 단위 정규화
    const normalizePrice = (p: number): number => {
      if (!p || p <= 0) return 0;
      return p < 10000 ? p * 10000 : p;
    };

    // 장례식장, 화장시설 제외 + isActive=false 제외 + 0원 제외
    return (facilitiesData as any[])
      .filter((f: any) => f.category !== 'FUNERAL_HOME' && f.category !== 'CREMATORIUM' && f.isActive !== false && f.minPrice > 0)
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
          coordinates: { lat: f.lat || f.coordinates?.lat || 0, lng: f.lng || f.coordinates?.lng || 0 },
          category: f.category,
          priceRange: { min: normalizePrice(f.minPrice), max: normalizePrice(f.maxPrice) },
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

export default function Home() {
  // 정적 JSON에서 데이터 로드 (빌드 시 포함됨)
  const initialFacilities = getFacilities();

  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>로딩 중...</div>}>
      <HomeClient initialFacilities={initialFacilities} />
    </Suspense>
  );
}
