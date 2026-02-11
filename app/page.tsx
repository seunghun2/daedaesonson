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

// 🚀 직접 Supabase 쿼리 (자기 API 호출 제거 → 네트워크 왕복 0!)
async function getFacilities(): Promise<Facility[]> {
  try {
    // 🔥 필요한 컬럼만 select (이미지 배열, description, pricing JSON 등 제외!)
    const LITE_COLUMNS = 'id,name,address,lat,lng,category,minPrice,maxPrice,isPublic,isActive,operatorType,images,pricing,rating,reviewCount,phone';

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
        // 대표 이미지 1장만 추출
        let thumbnail = '';
        if (f.images) {
          try {
            const imgs = typeof f.images === 'string' ? JSON.parse(f.images) : f.images;
            if (Array.isArray(imgs) && imgs.length > 0) thumbnail = imgs[0];
          } catch { }
        }

        // 가격 단위 통일
        const normalizePrice = (p: number): number => {
          if (!p || p <= 0) return 0;
          return p < 10000 ? p * 10000 : p;
        };

        // 🚀 서버에서 대표가격 미리 계산 (pricing JSON을 클라이언트에 보내지 않음)
        let computedRepPrice = 0;
        if (f.pricing) {
          try {
            const pInfo = typeof f.pricing === 'string' ? JSON.parse(f.pricing) : f.pricing;
            const priceTable = pInfo?.priceTable || pInfo;
            if (priceTable && typeof priceTable === 'object') {
              // 카테고리별 선호 키워드
              const kwMap: Record<string, string[]> = {
                'FAMILY_GRAVE': ['매장', '묘지', '분양'],
                'CHARNEL_HOUSE': ['봉안', '납골', '안치'],
                'NATURAL_BURIAL': ['수목', '자연', '잔디', '화초'],
              };
              const preferred = kwMap[f.category] || [];
              let bestPrice = 0;
              let fallbackPrice = 0;

              Object.entries(priceTable).forEach(([key, cat]: [string, any]) => {
                if (/옵션|관리비|기타|공통|제외|석물|비고|안내|별도/.test(key)) return;
                if (cat?.rows) {
                  const rep = cat.rows.find((r: any) => r.isRepresentative);
                  if (rep) {
                    let pv = Number(rep.price);
                    if (!isNaN(pv) && pv > 0) {
                      pv = pv < 10000 ? pv * 10000 : pv;
                      if (!bestPrice && preferred.some(k => key.includes(k))) bestPrice = pv;
                      if (!fallbackPrice) fallbackPrice = pv;
                    }
                  }
                }
              });
              computedRepPrice = bestPrice || fallbackPrice;
            }
          } catch { }
        }

        const minP = normalizePrice(f.minPrice);
        const maxP = normalizePrice(f.maxPrice);

        return {
          id: f.id,
          name: f.name,
          address: f.address || '',
          coordinates: { lat: f.lat || 0, lng: f.lng || 0 },
          category: f.category,
          priceRange: {
            min: computedRepPrice || minP,
            max: maxP
          },
          operatorType: f.operatorType,
          isPublic: f.isPublic ?? false,
          thumbnail,
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
