import { NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { createClient } from '@supabase/supabase-js';
import { RepresentativePricing } from '@/types';
import { randomUUID } from 'crypto';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jbydmhfuqnpukfutvrgs.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false }
});

export const revalidate = 0;
export const dynamic = 'force-dynamic';

const DATA_DIR = path.join(process.cwd(), 'data');

// Helper: Load and parse pricing CSVs
async function loadPricingData(): Promise<Map<string, RepresentativePricing>> {
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

    return map;
}

// ==========================================
// GET: 시설 목록 조회 (🔥 Supabase Only!)
// ==========================================
export async function GET() {
    try {
        console.log('[API] Fetching facilities from Supabase Only...');

        // 1. Supabase에서 모든 시설 가져오기 (페이지네이션)
        let facilitiesFromDb: any[] = [];
        let from = 0;
        const PAGE_SIZE = 1000;

        while (true) {
            const { data, error } = await supabase
                .from('Facility')
                .select('*')
                .order('id', { ascending: true })
                .range(from, from + PAGE_SIZE - 1);

            if (error) {
                console.error('Supabase Fetch Error:', error);
                throw new Error('Database connection failed');
            }

            if (data) facilitiesFromDb.push(...data);
            if (!data || data.length < PAGE_SIZE) break;
            from += PAGE_SIZE;
        }

        console.log(`[API] Loaded ${facilitiesFromDb.length} facilities from Supabase`);

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
        const liteData = facilitiesFromDb.map(f => {
            // 이미지 파싱
            let parsedImages: string[] = [];
            if (f.images) {
                try {
                    parsedImages = typeof f.images === 'string' ? JSON.parse(f.images) : f.images;
                } catch (e) { parsedImages = []; }
            }

            // pricing JSON 파싱
            let parsedPriceInfo = null;
            if (f.pricing) {
                try {
                    parsedPriceInfo = typeof f.pricing === 'string' ? JSON.parse(f.pricing) : f.pricing;
                } catch (e) { parsedPriceInfo = null; }
            }

            // 가격 단위 통일: 10000 미만이면 만원 단위로 가정 → 원 단위로 변환
            const normalizePrice = (p: number): number => {
                if (!p || p <= 0) return 0;
                return p < 10000 ? p * 10000 : p;  // 만원 → 원
            };

            return {
                id: f.id,
                name: f.name,
                address: f.address || '',
                coordinates: { lat: f.lat || 0, lng: f.lng || 0 },
                category: f.category || 'OTHER',
                priceRange: { min: normalizePrice(f.minPrice), max: normalizePrice(f.maxPrice) },
                operatorType: f.operatorType,
                hasParking: f.hasParking ?? false,
                hasRestaurant: f.hasRestaurant ?? false,
                hasStore: f.hasStore ?? false,
                hasAccessibility: f.hasAccessibility ?? false,
                isPublic: f.isPublic ?? false,
                isActive: f.isActive ?? true,
                hasDetailedPrices: (categoryCountMap.get(f.id) || 0) > 0,
                images: parsedImages,
                imageGallery: parsedImages,
                priceInfo: parsedPriceInfo,
                representativePricing: pricingMap.get(f.id),
                reviewCount: f.reviewCount || 0,
                rating: f.rating || 0,
                phone: f.phone || '',
                fax: f.fax || '',
                capacity: f.capacity,
                lastUpdated: f.lastUpdated,
                website: f.websiteUrl || '',
                viewCount: f.viewCount || 0,
                description: f.description || '',
                originalName: f.originalName,
            };
        });

        console.log(`[API] Returned ${liteData.length} facilities (Supabase Only)`);
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

        console.log('[API POST] Received:', isBulk ? `${payloadRaw.length} items (bulk)` : `Single item: ${payloadRaw.id}`);

        if (!isBulk) {
            const f = payloadRaw;

            if (!f.id) {
                return NextResponse.json({ error: 'Missing facility ID' }, { status: 400 });
            }

            // 이미지 처리
            const imgSource = f.imageGallery || f.images || [];
            const imageStr = JSON.stringify(Array.isArray(imgSource) ? imgSource : []);

            // 🔥 priceTable에서 대표가격 계산
            // 가격 단위 통일: 10000 미만이면 만원 단위로 가정 → 원 단위로 변환
            const normalizePriceForSave = (p: number): number => {
                if (!p || p <= 0) return 0;
                return p < 10000 ? p * 10000 : p;
            };

            let minPrice = normalizePriceForSave(f.priceRange?.min || 0);
            let maxPrice = normalizePriceForSave(f.priceRange?.max || 0);

            if (f.priceInfo?.priceTable) {
                let representativePrice = 0;
                let max = 0;
                Object.values(f.priceInfo.priceTable).forEach((cat: any) => {
                    cat?.rows?.forEach((row: any) => {
                        const price = typeof row.price === 'string'
                            ? parseInt(row.price.replace(/,/g, ''))
                            : row.price;
                        if (row.isRepresentative && price > 0) representativePrice = price;
                        if (price > max) max = price;
                    });
                });
                if (representativePrice > 0) minPrice = normalizePriceForSave(representativePrice);
                if (max > 0) maxPrice = normalizePriceForSave(max);
            }

            // DB Record 준비
            const dbRecord: any = {
                id: f.id,
                name: f.name,
                address: f.address,
                category: f.category || 'OTHER',
                description: f.description,
                images: imageStr,
                updatedAt: new Date().toISOString(),
                rating: f.rating || 0,
                reviewCount: f.reviewCount || 0,
                isPublic: f.isPublic ?? false,
                hasParking: f.hasParking ?? false,
                hasRestaurant: f.hasRestaurant ?? false,
                hasStore: f.hasStore ?? false,
                hasAccessibility: f.hasAccessibility ?? false,
                lat: f.coordinates?.lat,
                lng: f.coordinates?.lng,
                minPrice: minPrice,
                maxPrice: maxPrice,
                pricing: f.priceInfo?.priceTable ? JSON.stringify(f.priceInfo) : undefined,
                phone: f.phone,
                fax: f.fax,
                capacity: f.capacity ?? undefined,
                websiteUrl: f.website || f.websiteUrl,
                isActive: f.isActive ?? true,
                operatorType: f.operatorType,
                originalName: f.originalName,
                lastUpdated: f.lastUpdated,
            };

            // undefined 필드 제거 (기존 DB값 유지)
            Object.keys(dbRecord).forEach(key => {
                if (dbRecord[key] === undefined) {
                    delete dbRecord[key];
                }
            });

            console.log('[API POST] Saving to Supabase:', f.id);

            const { error } = await supabase
                .from('Facility')
                .upsert(dbRecord, { onConflict: 'id' });

            if (error) {
                console.error('[API POST] DB Error:', error);
                return NextResponse.json({ error: 'Database save failed', details: error.message }, { status: 500 });
            }

            // Pricing 동기화 (PriceCategory/PriceItem)
            if (f.priceInfo?.priceTable) {
                console.log(`[API POST] Syncing pricing data for ${f.id}...`);

                try {
                    await supabase.from('PriceCategory').delete().eq('facilityId', f.id);

                    for (const [key, categoryData] of Object.entries(f.priceInfo.priceTable) as [string, any][]) {
                        const categoryId = randomUUID();
                        const { data: category, error: catError } = await supabase
                            .from('PriceCategory')
                            .insert({
                                id: categoryId,
                                facilityId: f.id,
                                name: key,
                                normalizedName: categoryData.category || key,
                                orderNo: 0
                            })
                            .select()
                            .single();

                        if (catError || !category) continue;

                        if (categoryData.rows && categoryData.rows.length > 0) {
                            const items = categoryData.rows.map((row: any) => ({
                                id: randomUUID(),
                                categoryId: category.id,
                                facilityId: f.id,
                                itemName: row.name,
                                price: String(row.price).replace(/,/g, ''),
                                description: row.description || row.grade || '',
                                groupType: row.groupType || null,
                                unit: categoryData.unit || '1기',
                                isRepresentative: row.isRepresentative || false
                            }));

                            await supabase.from('PriceItem').insert(items);
                        }
                    }
                } catch (e) {
                    console.error('Pricing sync error:', e);
                }
            }

            console.log(`✅ [API POST] Saved ${f.id} to Supabase`);
            return NextResponse.json({ success: true, mode: 'single', id: f.id, source: 'supabase' });

        } else {
            // Bulk Update
            console.log('[API POST] Bulk update...');

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
                    pricing: f.priceInfo?.priceTable ? JSON.stringify(f.priceInfo) : null,
                    phone: f.phone || '',
                    fax: f.fax || '',
                    capacity: f.capacity ?? null,
                    websiteUrl: f.website || f.websiteUrl || '',
                    isActive: f.isActive ?? true,
                };
            });

            const { error } = await supabase
                .from('Facility')
                .upsert(dbRecords, { onConflict: 'id' });

            if (error) {
                console.error('[API POST] Bulk DB Error:', error);
                return NextResponse.json({ error: 'Bulk save failed', details: error.message }, { status: 500 });
            }

            console.log(`✅ [API POST] Bulk saved ${dbRecords.length} items`);
            return NextResponse.json({ success: true, mode: 'bulk', count: dbRecords.length, source: 'supabase' });
        }

    } catch (e) {
        console.error('[API POST] Error:', e);
        return NextResponse.json({ error: 'Internal error', details: String(e) }, { status: 500 });
    }
}
