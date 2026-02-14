import { Suspense } from 'react';
import HomeClient from './HomeClient';
import { Facility } from '@/types';
import fs from 'fs';
import path from 'path';

// 🚀 ISR: 5분(300초)마다 데이터 갱신
export const revalidate = 300;

// 📁 로컬 JSON에서 시설 데이터 로드 (Supabase 왕복 제거 → 즉시 렌더링)
function getFacilities(): Facility[] {
  try {
    const filePath = path.join(process.cwd(), 'data', 'facilities.json');
    const raw = fs.readFileSync(filePath, 'utf-8');
    const all = JSON.parse(raw);

    // 장례식장, 화장시설 제외 + isActive=false 제외
    return all
      .filter((f: any) => f.category !== 'FUNERAL_HOME' && f.category !== 'CREMATORIUM' && f.isActive !== false)
      .map((f: any) => {
        const normalizePrice = (p: number): number => {
          if (!p || p <= 0) return 0;
          return p < 10000 ? p * 10000 : p;
        };

        const repPrice = normalizePrice(f.representativePrice || 0);
        const minP = normalizePrice(f.minPrice || f.priceRange?.min || 0);
        const maxP = normalizePrice(f.maxPrice || f.priceRange?.max || 0);

        return {
          id: f.id,
          name: f.name,
          address: f.address || '',
          coordinates: f.coordinates || { lat: f.lat || 0, lng: f.lng || 0 },
          category: f.category,
          priceRange: {
            min: repPrice || minP,
            max: maxP
          },
          operatorType: f.operatorType,
          isPublic: f.isPublic ?? false,
          thumbnail: f.thumbnail || (f.images?.[0]) || '',
        };
      });
  } catch (error) {
    console.error('Failed to load facilities:', error);
    return [];
  }
}

export default async function Home() {
  const initialFacilities = getFacilities();

  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>로딩 중...</div>}>
      <HomeClient initialFacilities={initialFacilities} />
    </Suspense>
  );
}
