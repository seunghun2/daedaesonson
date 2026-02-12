import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { RepresentativePricing } from '@/types';

const supabase = getSupabaseServer();

// 🚀 60초 ISR 캐싱 (같은 시설 반복 조회 시 CDN에서 즉시 응답)
export const revalidate = 60;

const DATA_DIR = path.join(process.cwd(), 'data');

// 🔥 CSV 캐싱 (서버 시작 후 한 번만 로드)
let cachedPricingData: Map<string, RepresentativePricing> | null = null;

// Helper: Load pricing CSVs (캐싱 적용)
async function loadPricingData(): Promise<Map<string, RepresentativePricing>> {
    // 🔥 캐시가 있으면 바로 반환
    if (cachedPricingData) return cachedPricingData;

    const map = new Map<string, RepresentativePricing>();
    const analyzedDir = path.join(DATA_DIR, 'analyzed');

    try {
        const files = [
            { path: 'analyzed_pricing_cremation.csv', type: 'cremation' },
            { path: 'analyzed_pricing_enshrinement.csv', type: 'enshrinement' },
            { path: 'analyzed_pricing_natural.csv', type: 'natural' },
            { path: 'analyzed_pricing_cemetery.csv', type: 'cemetery' }
        ];

        for (const file of files) {
            const filePath = path.join(analyzedDir, file.path);
            if (existsSync(filePath)) {
                const content = readFileSync(filePath, 'utf-8');
                const rows = parse(content, { columns: true, skip_empty_lines: true });

                rows.forEach((r: any) => {
                    const id = r.ParkID;
                    if (!map.has(id)) map.set(id, {});
                    const entry: any = map.get(id)!;

                    if (file.type === 'cremation') {
                        entry.cremation = {
                            resident: parseInt(r.ResidentFee) || 0,
                            nonResident: parseInt(r.NonResidentFee) || 0
                        };
                    } else if (file.type === 'enshrinement') {
                        entry.enshrinement = {
                            min: parseInt(r.MinPrice) || 0,
                            max: parseInt(r.MaxPrice) || 0,
                            label: r.Label || ''
                        };
                    } else if (file.type === 'natural') {
                        entry.natural = {
                            joint: r.JointMinPrice ? parseInt(r.JointMinPrice) : undefined,
                            individual: r.IndividualMinPrice ? parseInt(r.IndividualMinPrice) : undefined,
                            couple: r.CoupleMinPrice ? parseInt(r.CoupleMinPrice) : undefined
                        };
                    } else if (file.type === 'cemetery') {
                        entry.cemetery = {
                            minLandFee: parseInt(r.MinLandFee) || 0
                        };
                    }
                });
            }
        }
    } catch (e) {
        console.error('Error loading pricing CSVs:', e);
    }
    // 🔥 캐시에 저장
    cachedPricingData = map;
    return map;
}

// GET: Single Facility Detail (🔥 Supabase Only!)
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;



        // 🔥 Supabase 쿼리 + CSV 로딩을 병렬 실행
        const [facilityResult, reviewsResult, inquiriesResult] = await Promise.all([
            supabase.from('Facility').select('*').eq('id', id).single(),
            supabase.from('Review').select('*, replies:Reply(*)').eq('facilityId', id).order('createdAt', { ascending: false }),
            supabase.from('Inquiry').select('*, replies:InquiryReply(*)').eq('facilityId', id).order('createdAt', { ascending: false }),
        ]);

        const { data: dbData, error } = facilityResult;
        const { data: reviews } = reviewsResult;
        const { data: inquiries } = inquiriesResult;

        if (error || !dbData) {
            console.error(`[Detail API] Facility ${id} not found:`, error);
            return NextResponse.json({ error: 'Facility not found' }, { status: 404 });
        }

        // 2. 이미지 파싱
        let parsedImages: string[] = [];
        if (dbData.images) {
            try {
                parsedImages = typeof dbData.images === 'string'
                    ? JSON.parse(dbData.images)
                    : (Array.isArray(dbData.images) ? dbData.images : []);
            } catch (e) { parsedImages = []; }
        }

        // 3. pricing JSON 파싱
        let parsedPriceInfo = null;
        if (dbData.pricing) {
            try {
                parsedPriceInfo = typeof dbData.pricing === 'string'
                    ? JSON.parse(dbData.pricing)
                    : dbData.pricing;
            } catch (e) {
                console.error('Failed to parse pricing:', e);
            }
        }

        // 6. 응답 데이터 구성
        const facility = {
            id: dbData.id,
            name: dbData.name,
            address: dbData.address || '',
            coordinates: { lat: dbData.lat || 0, lng: dbData.lng || 0 },
            category: dbData.category || 'OTHER',
            priceRange: { min: dbData.minPrice || 0, max: dbData.maxPrice || 0 },
            operatorType: dbData.operatorType,
            hasParking: dbData.hasParking ?? false,
            hasRestaurant: dbData.hasRestaurant ?? false,
            hasStore: dbData.hasStore ?? false,
            hasAccessibility: dbData.hasAccessibility ?? false,
            isPublic: dbData.isPublic ?? false,
            isActive: dbData.isActive ?? true,
            images: parsedImages,
            imageGallery: parsedImages,
            priceInfo: parsedPriceInfo,
            pricing: parsedPriceInfo,
            representativePricing: null,
            reviewCount: dbData.reviewCount || 0,
            rating: dbData.rating || 0,
            phone: dbData.phone || '',
            fax: dbData.fax || '',
            capacity: dbData.capacity,
            lastUpdated: dbData.lastUpdated,
            websiteUrl: dbData.websiteUrl || '',
            website: dbData.websiteUrl || '',
            viewCount: dbData.viewCount || 0,
            description: dbData.description || '',
            originalName: dbData.originalName,
            reviews: reviews || [],
            inquiries: inquiries || [],
        };


        return NextResponse.json(facility, {
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
            }
        });

    } catch (e) {
        console.error('Detail API Error:', e);
        return NextResponse.json({ error: 'Failed to load details' }, { status: 500 });
    }
}
