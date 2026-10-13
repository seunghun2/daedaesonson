import type { Metadata } from 'next';
import { Suspense } from 'react';
import HomeClient from './HomeClient';
import { Facility } from '@/types';
import { getSupabaseServer } from '@/lib/supabaseServer';

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
  },
};

export const revalidate = 60; // 60초마다 재검증 (ISR)

// 📁 Supabase DB에서 시설 데이터 로드 (isActive, representativePrice 실시간 반영)
async function getFacilities(): Promise<Facility[]> {
  try {
    const supabase = getSupabaseServer();
    const COLUMNS = 'id,name,address,lat,lng,category,minPrice,maxPrice,representativePrice,operatorType,isPublic,isActive,isFull,thumbnail';

    const [page0, page1] = await Promise.all([
      supabase.from('Facility').select(COLUMNS).order('id', { ascending: true }).range(0, 999),
      supabase.from('Facility').select(COLUMNS).order('id', { ascending: true }).range(1000, 1999),
    ]);
    if (page0.error) console.error('SSR Supabase Error (page0):', page0.error);
    if (page1.error) console.error('SSR Supabase Error (page1):', page1.error);
    const all: any[] = [...(page0.data || []), ...(page1.data || [])];

    const normalizePrice = (p: number): number => {
      const num = Number(p);
      if (!Number.isFinite(num) || num <= 0) return 0;
      return num;
    };

    return all
      .filter((f: any) => f.category !== 'FUNERAL_HOME' && f.isActive !== false)
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
  const initialFacilities = await getFacilities();

  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>로딩 중...</div>}>
      <HomeClient initialFacilities={initialFacilities} />
    </Suspense>
  );
}
