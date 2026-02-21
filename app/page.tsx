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

        // 🔥 가격 결정 로직 (어드민 ★ 대표가격 최우선)
        // 1순위: DB representativePrice (어드민 저장 시 precomputed)
        // 2순위: priceTable에서 직접 계산 (★ isRepresentative 항목)
        // 3순위: minPrice (priceTable이 아예 없는 레거시 시설만)
        let repPrice = normalizePrice(f.representativePrice || 0);

        // representativePrice가 없으면 priceTable에서 직접 계산
        const pt = f.priceInfo?.priceTable || f.pricing;
        let hasRepInTable = false; // priceTable에 대표항목이 존재하는지 여부

        if (repPrice === 0 && pt && typeof pt === 'object') {
          for (const catKey of Object.keys(pt)) {
            if (/옵션|관리비|기타|공통|제외|석물|비고|안내|별도/.test(catKey)) continue;
            const cat = pt[catKey];
            if (cat && Array.isArray(cat.rows)) {
              const rep = cat.rows.find((r: any) => r.isRepresentative);
              if (rep) {
                hasRepInTable = true;
                if (rep.price > 0) {
                  repPrice = normalizePrice(rep.price);
                  break;
                }
              }
            }
          }
        }

        // minPrice 폴백: priceTable이 존재하면 사용 안 함 (stale minPrice 방지)
        // priceTable이 아예 없는 레거시 시설만 minPrice 사용
        const hasPriceTable = !!(pt && typeof pt === 'object' && Object.keys(pt).length > 0);
        const minP = (repPrice > 0 || hasRepInTable || hasPriceTable) ? 0 : normalizePrice(f.minPrice || f.priceRange?.min || 0);
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
          representativePrice: repPrice,
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
