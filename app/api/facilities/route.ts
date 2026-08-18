import { NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { RepresentativePricing } from '@/types';
import { randomUUID } from 'crypto';

const supabase = getSupabaseServer();

export const revalidate = 0;
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Vercel 타임아웃 60초

const DATA_DIR = path.join(process.cwd(), 'data');

// 🚀 CSV 가격 데이터 메모리 캐싱 (5분)
let _pricingCache: { data: Map<string, RepresentativePricing>; timestamp: number } | null = null;
const PRICING_CACHE_TTL = 5 * 60 * 1000; // 5분

// Helper: Load and parse pricing CSVs
async function loadPricingData(): Promise<Map<string, RepresentativePricing>> {
    // 🚀 캐시가 유효하면 바로 반환
    if (_pricingCache && (Date.now() - _pricingCache.timestamp) < PRICING_CACHE_TTL) {
        return _pricingCache.data;
    }

    const map = new Map<string, RepresentativePricing>();
    const analyzedDir = path.join(DATA_DIR, 'analyzed');

    try {
        const cremPath = path.join(analyzedDir, 'analyzed_pricing_cremation.csv');
        if (existsSync(cremPath)) {
            const content = readFileSync(cremPath, 'utf-8');
            const rows = parse(content, { columns: true, skip_empty_lines: true });
            rows.forEach((r: any) => {
                const id = r.ParkID;
                if (!map.has(id)) map.set(id, {} as any);
                const entry = map.get(id)! as any;
                entry.cremation = {
                    minAdult15kg: parseInt(r.MinAdult15kg) || 0,
                    minChild: parseInt(r.MinChild) || 0,
                };
            });
        }

        const charnelPath = path.join(analyzedDir, 'analyzed_pricing_charnel.csv');
        if (existsSync(charnelPath)) {
            const content = readFileSync(charnelPath, 'utf-8');
            const rows = parse(content, { columns: true, skip_empty_lines: true });
            rows.forEach((r: any) => {
                const id = r.ParkID;
                if (!map.has(id)) map.set(id, {} as any);
                const entry = map.get(id)! as any;
                entry.charnel = {
                    minSingle: parseInt(r.MinSingle) || 0,
                    minCouple: parseInt(r.MinCouple) || 0,
                    minFamily: parseInt(r.MinFamily) || 0
                };
            });
        }
    } catch (e) {
        console.error('Error loading pricing CSVs:', e);
    }

    // 🚀 캐시 저장
    _pricingCache = { data: map, timestamp: Date.now() };
    return map;
}

// ==========================================
// GET: 시설 목록 조회 (🔥 Supabase Only!)
// ==========================================
export async function GET() {
    try {
        // 🚀 필요 컬럼만 선택 (pricing, images 등 무거운 JSONB 제외)
        const FACILITY_COLUMNS = 'id,name,address,lat,lng,category,minPrice,maxPrice,representativePrice,operatorType,hasParking,hasRestaurant,hasStore,hasAccessibility,isPublic,isActive,isFull,reviewCount,rating,phone,fax,capacity,lastUpdated,websiteUrl,viewCount,favoriteCount,description,originalName,updatedAt,thumbnail';

        let facilitiesFromDb: any[] = [];
        let from = 0;
        const PAGE_SIZE = 1000;

        while (true) {
            const { data, error } = await supabase
                .from('Facility')
                .select(FACILITY_COLUMNS)
                .order('id', { ascending: true })
                .range(from, from + PAGE_SIZE - 1);

            if (error) {
                console.error('Supabase Fetch Error:', error);
                throw new Error(`Supabase Fetch Error: ${error.message || JSON.stringify(error)}`);
            }

            if (data) facilitiesFromDb.push(...data);
            if (!data || data.length < PAGE_SIZE) break;
            from += PAGE_SIZE;
        }

        // 2. 가격 카테고리 개수 (hasDetailedPrices 용)
        const { data: categories } = await supabase
            .from('PriceCategory')
            .select('facilityId');

        const categoryCountMap = new Map();
        if (categories) {
            categories.forEach((c: any) => {
                categoryCountMap.set(c.facilityId, (categoryCountMap.get(c.facilityId) || 0) + 1);
            });
        }

        // 3. 대표 가격 로드 (CSV)
        const pricingMap = await loadPricingData();

        // 4. 데이터 변환 (DB 필드 → 프론트엔드 형식)
        // 🚀 가격 정규화 함수 (루프 바깥에서 1회 정의)
        const normalizePrice = (p: number): number => {
            if (!p || p <= 0) return 0;
            return p < 10000 ? p * 10000 : p;
        };

        const liteData = facilitiesFromDb.map(f => {
            // 🔥 대표가격 우선: representativePrice > minPrice
            const repPrice = normalizePrice(f.representativePrice || 0);
            const minP = normalizePrice(f.minPrice || 0);
            const maxP = normalizePrice(f.maxPrice || 0);
            const effectiveMin = repPrice > 0 ? repPrice : minP;

            return {
                id: f.id,
                name: f.name,
                address: f.address || '',
                coordinates: { lat: f.lat || 0, lng: f.lng || 0 },
                category: f.category || 'OTHER',
                priceRange: { min: effectiveMin, max: maxP },
                representativePrice: repPrice, // 🔥 마커에서 사용할 대표가격
                operatorType: f.operatorType,
                hasParking: f.hasParking ?? false,
                hasRestaurant: f.hasRestaurant ?? false,
                hasStore: f.hasStore ?? false,
                hasAccessibility: f.hasAccessibility ?? false,
                isPublic: f.isPublic ?? false,
                isActive: f.isActive ?? true,
                isFull: f.isFull ?? false,
                hasDetailedPrices: (categoryCountMap.get(f.id) || 0) > 0,
                representativePricing: pricingMap.get(f.id),
                reviewCount: f.reviewCount || 0,
                rating: f.rating || 0,
                phone: f.phone || '',
                fax: f.fax || '',
                capacity: f.capacity,
                lastUpdated: f.lastUpdated,
                websiteUrl: f.websiteUrl || '',
                viewCount: f.viewCount || 0,
                favoriteCount: f.favoriteCount || 0,
                description: f.description || '',
                originalName: f.originalName,
                updatedAt: f.updatedAt,
                thumbnail: f.thumbnail || '',
            };
        });

        return NextResponse.json(liteData);

    } catch (e) {
        console.error('API Error:', e);
        return NextResponse.json({ error: 'Failed to load data', details: String(e) }, { status: 500 });
    }
}

// ==========================================
// POST: 시설 저장 (🔥 Supabase Only!)
// ==========================================
export async function POST(req: Request) {
    try {
        const payloadRaw = await req.json();
        const isBulk = Array.isArray(payloadRaw);



        if (!isBulk) {
            const f = payloadRaw;

            if (!f.id) {
                return NextResponse.json({ error: 'Missing facility ID' }, { status: 400 });
            }

            // 이미지 처리 (필드가 있을 때만 업데이트)
            let imageStr: string | undefined = undefined;
            if (f.imageGallery !== undefined || f.images !== undefined) {
                const imgSource = f.imageGallery || f.images || [];
                imageStr = JSON.stringify(Array.isArray(imgSource) ? imgSource : []);
            }

            // 🔥 priceTable에서 대표가격 계산
            // 가격 단위 통일: 10000 미만이면 만원 단위로 가정 → 원 단위로 변환
            const normalizePriceForSave = (p: number): number => {
                if (!p || p <= 0) return 0;
                return p < 10000 ? p * 10000 : p;
            };

            let minPrice = normalizePriceForSave(f.priceRange?.min || 0);
            let maxPrice = normalizePriceForSave(f.priceRange?.max || 0);

            const hasPriceTable = f.priceInfo?.priceTable && Object.keys(f.priceInfo.priceTable).length > 0;
            const hasStandardized = f.priceInfo?.standardizedPrices && f.priceInfo.standardizedPrices.length > 0;

            if (hasPriceTable) {
                // 시설 카테고리에 맞는 키워드
                const categoryKeywords: Record<string, string[]> = {
                    'FAMILY_GRAVE': ['묘지', '공원묘지', '매장', '분묘'],
                    'CHARNEL_HOUSE': ['봉안', '납골', '안치'],
                    'NATURAL_BURIAL': ['수목', '자연', '잔디', '화초'],
                };
                const preferredKeywords = categoryKeywords[f.category] || [];

                let representativePrice = 0;
                let max = 0;

                // 1. 시설 카테고리와 매칭되는 가격 카테고리에서 우선 검색
                Object.entries(f.priceInfo.priceTable).forEach(([catKey, cat]: [string, any]) => {
                    const isMatchingCategory = preferredKeywords.some(kw => catKey.includes(kw));

                    cat?.rows?.forEach((row: any) => {
                        const price = typeof row.price === 'string'
                            ? parseInt(row.price.replace(/,/g, ''))
                            : row.price;

                        // 매칭되는 카테고리의 대표가격 우선 (첫 번째만!)
                        if (row.isRepresentative && price > 0 && isMatchingCategory && representativePrice === 0) {
                            representativePrice = price;
                        }
                        if (price > max) max = price;
                    });
                });

                // 2. 매칭되는 카테고리에서 못 찾으면, 전체에서 첫 번째 대표가격
                if (representativePrice === 0) {
                    Object.values(f.priceInfo.priceTable).forEach((cat: any) => {
                        cat?.rows?.forEach((row: any) => {
                            const price = typeof row.price === 'string'
                                ? parseInt(row.price.replace(/,/g, ''))
                                : row.price;
                            if (row.isRepresentative && price > 0 && representativePrice === 0) {
                                representativePrice = price;
                            }
                        });
                    });
                }

                if (representativePrice > 0) minPrice = normalizePriceForSave(representativePrice);
                if (max > 0) maxPrice = normalizePriceForSave(max);
            } else if (hasStandardized && !hasPriceTable) {
                // V2만 있을 때 대표가격 계산
                for (const group of f.priceInfo.standardizedPrices) {
                    for (const row of group.rows || []) {
                        const p = typeof row.price === 'string' ? parseInt(row.price.replace(/,/g, '')) : row.price;
                        if (row.isRepresentative && p > 0 && minPrice === 0) minPrice = normalizePriceForSave(p);
                        if (p > maxPrice) maxPrice = normalizePriceForSave(p);
                    }
                }
            }

            // 🚀 대표가격 precomputed 값 저장 (메인 페이지 SSR에서 pricing JSON 파싱 불필요!)
            const computedRepPrice = normalizePriceForSave(
                hasPriceTable ? (() => {
                    let rp = 0;
                    Object.values(f.priceInfo.priceTable).forEach((cat: any) => {
                        cat?.rows?.forEach((row: any) => {
                            const p = typeof row.price === 'string' ? parseInt(row.price.replace(/,/g, '')) : row.price;
                            if (row.isRepresentative && p > 0 && rp === 0) rp = p;
                        });
                    });
                    return rp;
                })() : hasStandardized ? (() => {
                    let rp = 0;
                    for (const group of f.priceInfo.standardizedPrices) {
                        for (const row of group.rows || []) {
                            const p = typeof row.price === 'string' ? parseInt(row.price.replace(/,/g, '')) : row.price;
                            if (row.isRepresentative && p > 0 && rp === 0) rp = p;
                        }
                    }
                    return rp;
                })() : 0
            ) || minPrice;

            // 🚀 대표 이미지 (썸네일) 추출
            const imgArr = f.imageGallery || f.images || [];
            // imageGallery가 명시적으로 보내졌으면 (빈 배열 포함) thumbnail도 반드시 업데이트
            const hasImageField = f.imageGallery !== undefined || f.images !== undefined;
            const computedThumbnail = Array.isArray(imgArr) && imgArr.length > 0 ? imgArr[0] : '';

            // DB Record 준비
            const dbRecord: any = {
                id: f.id,
                name: f.name,
                address: f.address,
                category: f.category || 'OTHER',
                description: f.description,
                images: imageStr,
                updatedAt: new Date().toISOString(),  // 항상 갱신 (우리가 수정한 시간)
                rating: f.rating || 0,
                reviewCount: f.reviewCount || 0,
                isPublic: f.isPublic ?? false,
                hasParking: f.hasParking ?? false,
                hasRestaurant: f.hasRestaurant ?? false,
                hasStore: f.hasStore ?? false,
                hasAccessibility: f.hasAccessibility ?? false,
                lat: f.coordinates?.lat || undefined,
                lng: f.coordinates?.lng || undefined,
                minPrice: minPrice,
                maxPrice: maxPrice,
                representativePrice: computedRepPrice,
                thumbnail: hasImageField ? (computedThumbnail || '') : undefined,
                pricing: (hasPriceTable || hasStandardized) ? JSON.stringify(f.priceInfo) : undefined,
                phone: f.phone,
                fax: f.fax,
                capacity: f.capacity ?? undefined,
                websiteUrl: f.websiteUrl !== undefined ? f.websiteUrl : (f.website || ''),
                isActive: f.isActive ?? true,
                isFull: f.isFull ?? false,
                operatorType: f.operatorType,
                originalName: f.originalName,
                lastUpdated: f.lastUpdated || new Date().toISOString(),
            };

            // undefined 필드 제거 (기존 DB값 유지)
            Object.keys(dbRecord).forEach(key => {
                if (dbRecord[key] === undefined) {
                    delete dbRecord[key];
                }
            });



            const { error } = await supabase
                .from('Facility')
                .upsert(dbRecord, { onConflict: 'id' });

            if (error) {
                console.error('[API POST] DB Error:', error);
                return NextResponse.json({ error: 'Database save failed', details: error.message }, { status: 500 });
            }

            // Pricing 동기화 (PriceCategory/PriceItem) - 🚀 Bulk Insert로 최적화
            if (hasPriceTable) {
                try {
                    // 1. 기존 데이터 삭제 (병렬)
                    await Promise.all([
                        supabase.from('PriceItem').delete().eq('facilityId', f.id),
                        supabase.from('PriceCategory').delete().eq('facilityId', f.id),
                    ]);

                    // 2. 카테고리 + 아이템 배열 한번에 구성
                    const allCategories: any[] = [];
                    const allItems: any[] = [];

                    for (const [key, categoryData] of Object.entries(f.priceInfo.priceTable) as [string, any][]) {
                        const categoryId = randomUUID();
                        allCategories.push({
                            id: categoryId,
                            facilityId: f.id,
                            name: key,
                            normalizedName: categoryData.category || key,
                            orderNo: 0
                        });

                        if (categoryData.rows && categoryData.rows.length > 0) {
                            for (const row of categoryData.rows) {
                                allItems.push({
                                    id: randomUUID(),
                                    categoryId: categoryId,
                                    facilityId: f.id,
                                    itemName: row.name,
                                    price: String(row.price).replace(/,/g, ''),
                                    description: row.description || row.grade || '',
                                    groupType: row.groupType || null,
                                    unit: categoryData.unit || '1기',
                                    isRepresentative: row.isRepresentative || false
                                });
                            }
                        }
                    }

                    // 3. Bulk Insert (각 1회씩만!)
                    if (allCategories.length > 0) {
                        await supabase.from('PriceCategory').insert(allCategories);
                    }
                    if (allItems.length > 0) {
                        await supabase.from('PriceItem').insert(allItems);
                    }
                } catch (e) {
                    console.error('Pricing sync error:', e);
                }
            }


            return NextResponse.json({ success: true, mode: 'single', id: f.id, source: 'supabase' });

        } else {
            // Bulk Update


            const dbRecords = payloadRaw.map((f: any) => {
                const imgSource = f.imageGallery || f.images || [];
                const imageStr = JSON.stringify(Array.isArray(imgSource) ? imgSource : []);

                return {
                    id: f.id,
                    name: f.name,
                    address: f.address || '',
                    category: f.category || 'OTHER',
                    description: f.description || '',
                    images: imageStr,
                    updatedAt: new Date().toISOString(),
                    rating: f.rating || 0,
                    reviewCount: f.reviewCount || 0,
                    isPublic: f.isPublic ?? false,
                    hasParking: f.hasParking ?? false,
                    hasRestaurant: f.hasRestaurant ?? false,
                    hasStore: f.hasStore ?? false,
                    hasAccessibility: f.hasAccessibility ?? false,
                    lat: f.coordinates?.lat || 0,
                    lng: f.coordinates?.lng || 0,
                    minPrice: f.priceRange?.min || 0,
                    maxPrice: f.priceRange?.max || 0,
                    pricing: (f.priceInfo?.priceTable || f.priceInfo?.standardizedPrices) ? JSON.stringify(f.priceInfo) : null,
                    phone: f.phone || '',
                    fax: f.fax || '',
                    capacity: f.capacity ?? null,
                    websiteUrl: f.websiteUrl || f.website || '',
                    isActive: f.isActive ?? true,
                    isFull: f.isFull ?? false,
                };
            });

            const { error } = await supabase
                .from('Facility')
                .upsert(dbRecords, { onConflict: 'id' });

            if (error) {
                console.error('[API POST] Bulk DB Error:', error);
                return NextResponse.json({ error: 'Bulk save failed', details: error.message }, { status: 500 });
            }


            return NextResponse.json({ success: true, mode: 'bulk', count: dbRecords.length, source: 'supabase' });
        }

    } catch (e) {
        console.error('[API POST] Error:', e);
        return NextResponse.json({ error: 'Internal error', details: String(e) }, { status: 500 });
    }
}

// ==========================================
// DELETE: 시설 삭제
// ==========================================
export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Missing facility id' }, { status: 400 });
        }



        // 관련 데이터 먼저 삭제
        await supabase.from('PriceCategory').delete().eq('facilityId', id);
        await supabase.from('PriceItem').delete().eq('facilityId', id);

        // 시설 삭제
        const { error } = await supabase.from('Facility').delete().eq('id', id);

        if (error) {
            console.error('[API DELETE] Supabase error:', error);
            return NextResponse.json({ error: 'Delete failed', details: error.message }, { status: 500 });
        }


        return NextResponse.json({ success: true, deletedId: id });

    } catch (e) {
        console.error('[API DELETE] Error:', e);
        return NextResponse.json({ error: 'Internal error', details: String(e) }, { status: 500 });
    }
}
