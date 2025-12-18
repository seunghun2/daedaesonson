import { Suspense } from 'react';
import fs from 'fs/promises';
import path from 'path';
import HomeClient from './HomeClient';
import { Facility } from '@/types';

// 서버에서 시설 데이터 미리 로드
async function getFacilities(): Promise<Facility[]> {
  try {
    const dataPath = path.join(process.cwd(), 'data', 'facilities.json');
    const fileContent = await fs.readFile(dataPath, 'utf-8');
    const facilities = JSON.parse(fileContent);

    // 장례식장 제외 + isActive=false 제외 + 필요한 필드만 추출 (경량화)
    return facilities
      .filter((f: any) => f.category !== 'FUNERAL_HOME' && f.isActive !== false)
      .map((f: any) => ({
        id: f.id,
        name: f.name,
        address: f.address,
        coordinates: f.coordinates,
        category: f.category,
        priceRange: f.priceRange,
        operatorType: f.operatorType,
        hasParking: f.hasParking,
        hasRestaurant: f.hasRestaurant,
        hasStore: f.hasStore,
        hasAccessibility: f.hasAccessibility,
        isPublic: f.isPublic,
        images: f.images || [],
        imageGallery: f.imageGallery || [],
        reviewCount: f.reviewCount,
        rating: f.rating,
        phone: f.phone,
        fax: f.fax,
        capacity: f.capacity,
        lastUpdated: f.lastUpdated,
        website: f.website || f.websiteUrl,
        pricing: f.pricing,
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
