import { Suspense } from 'react';
import { createClient } from '@supabase/supabase-js';
import HomeClient from './HomeClient';
import { Facility } from '@/types';

// 🔥 30초 캐시 (성능 + 업데이트 반영 균형)
export const revalidate = 30;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jbydmhfuqnpukfutvrgs.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3';

// 서버에서 시설 데이터 미리 로드 (Supabase 직접 호출)
async function getFacilities(): Promise<Facility[]> {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false }
    });

    // 페이지네이션으로 전체 데이터 로드
    let allFacilities: any[] = [];
    let from = 0;
    const PAGE_SIZE = 1000;

    while (true) {
      // 🔥 경량화: 지도 마커에 필요한 최소 필드만
      const { data, error } = await supabase
        .from('Facility')
        .select('id, name, address, lat, lng, category, operatorType, isPublic, isActive, minPrice, maxPrice')
        .order('id', { ascending: true })
        .range(from, from + PAGE_SIZE - 1);

      if (error) {
        console.error('Supabase error:', error);
        break;
      }

      if (!data || data.length === 0) break;
      allFacilities = [...allFacilities, ...data];

      if (data.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }

    // 가격 단위 정규화
    const normalizePrice = (p: number): number => {
      if (!p || p <= 0) return 0;
      return p < 10000 ? p * 10000 : p;
    };

    // 장례식장, 화장시설 제외 + isActive=false 제외 + 0원 제외
    return allFacilities
      .filter((f: any) => f.category !== 'FUNERAL_HOME' && f.category !== 'CREMATORIUM' && f.isActive !== false && f.minPrice > 0)
      .map((f: any) => ({
        id: f.id,
        name: f.name,
        address: f.address,
        coordinates: { lat: f.lat || 0, lng: f.lng || 0 },
        category: f.category,
        priceRange: { min: normalizePrice(f.minPrice), max: normalizePrice(f.maxPrice) },
        operatorType: f.operatorType,
        isPublic: f.isPublic,
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
