import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { createClient } from '@supabase/supabase-js';
import { RepresentativePricing } from '@/types';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jbydmhfuqnpukfutvrgs.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false }
});

export const revalidate = 0;
export const dynamic = 'force-dynamic';

const DATA_DIR = path.join(process.cwd(), 'data');

// Helper: Load pricing CSVs (이건 CSV라서 유지)
async function loadPricingData(): Promise<Map<string, RepresentativePricing>> {
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
    return map;
}

// GET: Single Facility Detail (🔥 Supabase Only!)
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        console.log(`[Detail API] Fetching ${id} from Supabase...`);

        // 1. Supabase에서 시설 정보 가져오기
        const { data: dbData, error } = await supabase
            .from('Facility')
            .select('*')
            .eq('id', id)
            .single();

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

        // 4. 대표 가격 로드 (CSV)
        const pricingMap = await loadPricingData();

        // 5. 리뷰 로드
        const { data: reviews } = await supabase
            .from('Review')
            .select('*, replies:Reply(*)')
            .eq('facilityId', id)
            .order('createdAt', { ascending: false });

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
            representativePricing: pricingMap.get(id),
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
        };

        console.log(`✅ [Detail API] ${id} from Supabase`);
        return NextResponse.json(facility);

    } catch (e) {
        console.error('Detail API Error:', e);
        return NextResponse.json({ error: 'Failed to load details' }, { status: 500 });
    }
}
