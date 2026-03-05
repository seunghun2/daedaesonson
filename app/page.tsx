import { Suspense } from 'react';
import HomeClient from './HomeClient';
import { Facility } from '@/types';
import { getSupabaseServer } from '@/lib/supabaseServer';

// 🚀 ISR: 5분(300초)마다 데이터 갱신
export const revalidate = 300;

// 📁 Supabase DB에서 시설 데이터 로드 (isActive, representativePrice 실시간 반영)
async function getFacilities(): Promise<Facility[]> {
  try {
    const supabase = getSupabaseServer();
    const COLUMNS = 'id,name,address,lat,lng,category,minPrice,maxPrice,representativePrice,operatorType,isPublic,isActive,isFull,thumbnail';

    let all: any[] = [];
    let from = 0;
    const PAGE_SIZE = 1000;
    while (true) {
      const { data, error } = await supabase
        .from('Facility')
        .select(COLUMNS)
        .order('id', { ascending: true })
        .range(from, from + PAGE_SIZE - 1);
      if (error) { console.error('SSR Supabase Error:', error); break; }
      if (data) all.push(...data);
      if (!data || data.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }

    const normalizePrice = (p: number): number => {
      if (!p || p <= 0) return 0;
      return p < 10000 ? p * 10000 : p;
    };

    return all
      .filter((f: any) => f.category !== 'FUNERAL_HOME' && f.category !== 'CREMATORIUM' && f.isActive !== false)
      .map((f: any) => {
        const repPrice = normalizePrice(f.representativePrice || 0);
        const minP = normalizePrice(f.minPrice || 0);
        const maxP = normalizePrice(f.maxPrice || 0);

        return {
          id: f.id,
          name: f.name,
          address: f.address || '',
          coordinates: { lat: f.lat || 0, lng: f.lng || 0 },
          category: f.category,
          priceRange: {
            min: repPrice > 0 ? repPrice : minP,
            max: maxP
          },
          representativePrice: repPrice,
          operatorType: f.operatorType,
          isPublic: f.isPublic ?? false,
          isFull: f.isFull ?? false,
          thumbnail: f.thumbnail || '',
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
