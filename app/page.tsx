import { Suspense } from 'react';
import HomeClient from './HomeClient';
import { Facility } from '@/types';
import { createClient } from '@supabase/supabase-js';

// 🚀 ISR: 5분(300초)마다 데이터 갱신
export const revalidate = 300;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jbydmhfuqnpukfutvrgs.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || '',
  { auth: { persistSession: false } }
);

// 🚀 직접 Supabase 쿼리 — pricing/images 컬럼 제거로 SSR HTML 90% 감소!
async function getFacilities(): Promise<Facility[]> {
  try {
    // 🔥 초경량 컬럼만! (pricing, images 제외 → DB precomputed 값 사용)
    const LITE_COLUMNS = 'id,name,address,lat,lng,category,minPrice,maxPrice,representativePrice,thumbnail,isPublic,isActive,operatorType,rating,reviewCount';

    let all: any[] = [];
    let from = 0;
    const PAGE_SIZE = 1000;

    while (true) {
      const { data, error } = await supabase
        .from('Facility')
        .select(LITE_COLUMNS)
        .order('id', { ascending: true })
        .range(from, from + PAGE_SIZE - 1);

      if (error) {
        console.error('Supabase fetch error:', error);
        break;
      }
      if (data) all.push(...data);
      if (!data || data.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }

    // 장례식장, 화장시설 제외 + isActive=false 제외
    return all
      .filter((f: any) => f.category !== 'FUNERAL_HOME' && f.category !== 'CREMATORIUM' && f.isActive !== false)
      .map((f: any) => {
        const normalizePrice = (p: number): number => {
          if (!p || p <= 0) return 0;
          return p < 10000 ? p * 10000 : p;
        };

        const repPrice = normalizePrice(f.representativePrice || 0);
        const minP = normalizePrice(f.minPrice);
        const maxP = normalizePrice(f.maxPrice);

        return {
          id: f.id,
          name: f.name,
          address: f.address || '',
          coordinates: { lat: f.lat || 0, lng: f.lng || 0 },
          category: f.category,
          priceRange: {
            min: repPrice || minP,
            max: maxP
          },
          operatorType: f.operatorType,
          isPublic: f.isPublic ?? false,
          thumbnail: f.thumbnail || '',
        };
      });
  } catch (error) {
    console.error('Failed to load facilities:', error);
    return [];
  }
}

export default async function Home() {
  const initialFacilities = await getFacilities();

  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>로딩 중...</div>}>
      <HomeClient initialFacilities={initialFacilities} />
    </Suspense>
  );
}
