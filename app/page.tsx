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
      const { data, error } = await supabase
        .from('Facility')
        .select('id, name, address, lat, lng, category, operatorType, hasParking, hasRestaurant, hasStore, hasAccessibility, isPublic, isActive, images, reviewCount, rating, phone, fax, capacity, lastUpdated, websiteUrl, pricing, description, minPrice, maxPrice')
        .order('id', { ascending: true })
        .range(from, from + PAGE_SIZE - 1);

      if (error) {
        console.error('Supabase error:', error);
        break;
      }

      if (!data || data.length === 0) break;
      allFacilities = allFacilities.concat(data);

      if (data.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }

    // 가격 단위 정규화
    const normalizePrice = (p: number): number => {
      if (!p || p <= 0) return 0;
      return p < 10000 ? p * 10000 : p;
    };

    // 장례식장, 화장시설 제외 + isActive=false 제외 + 0원 제외 + 경량화
    return allFacilities
      .filter((f: any) => f.category !== 'FUNERAL_HOME' && f.category !== 'CREMATORIUM' && f.isActive !== false && f.minPrice > 0)
      .map((f: any) => {
        // 이미지 파싱
        let parsedImages: string[] = [];
        if (f.images) {
          try {
            parsedImages = typeof f.images === 'string' ? JSON.parse(f.images) : f.images;
          } catch { parsedImages = []; }
        }

        // pricing 파싱
        let parsedPricing = null;
        if (f.pricing) {
          try {
            parsedPricing = typeof f.pricing === 'string' ? JSON.parse(f.pricing) : f.pricing;
          } catch { parsedPricing = null; }
        }

        return {
          id: f.id,
          name: f.name,
          address: f.address,
          coordinates: { lat: f.lat || 0, lng: f.lng || 0 },
          category: f.category,
          priceRange: { min: normalizePrice(f.minPrice), max: normalizePrice(f.maxPrice) },
          operatorType: f.operatorType,
          hasParking: f.hasParking,
          hasRestaurant: f.hasRestaurant,
          hasStore: f.hasStore,
          hasAccessibility: f.hasAccessibility,
          isPublic: f.isPublic,
          images: parsedImages,
          imageGallery: parsedImages,
          reviewCount: f.reviewCount,
          rating: f.rating,
          phone: f.phone,
          fax: f.fax,
          capacity: f.capacity,
          lastUpdated: f.lastUpdated,
          website: f.websiteUrl,
          pricing: parsedPricing,
          priceInfo: parsedPricing ? { priceTable: parsedPricing.priceTable } : null,
          description: f.description || '',
        };
      });
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
