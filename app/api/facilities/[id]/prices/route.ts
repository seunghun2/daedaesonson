import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabase = getSupabaseServer();

// 레거시 카테고리 → serviceType 매핑
const SERVICE_TYPE_MAP: Record<string, string> = {
    '매장묘': 'BURIAL', '단장형': 'BURIAL', '합장형': 'BURIAL',
    '쌍분형': 'BURIAL', '복합묘': 'BURIAL', '평장묘': 'BURIAL',
    '봉안당': 'BONGSAN', '봉안담': 'BONGSAN', '봉안묘': 'BONGSAN',
    '수목형': 'NATURAL', '잔디형': 'NATURAL', '화초형': 'NATURAL',
    '암석형': 'NATURAL', '가족형': 'NATURAL', '수목장': 'NATURAL',
};

// 레거시 priceTable → standardizedPrices 변환
function transformToStandardized(priceTable: Record<string, any>) {
    const groups: Array<{
        serviceType: string; subType: string; unit: string;
        rows: any[];
    }> = [];

    for (const [categoryName, categoryData] of Object.entries(priceTable)) {
        const rows = categoryData?.rows;
        if (!rows || rows.length === 0) continue;
        if (categoryName === '제외됨' || categoryName === '기타') continue;

        const serviceType = SERVICE_TYPE_MAP[categoryName] || 'OTHER';
        groups.push({
            serviceType,
            subType: categoryName,
            unit: categoryData.unit || '원',
            rows: rows.map((r: any) => ({
                name: r.name || categoryName,
                price: r.price || 0,
                feeType: r.feeType || 'USAGE',
                grade: r.grade || '',
                note: r.note || '',
                isRepresentative: r.isRepresentative || false,
                area: r.area,
                areaUnit: r.areaUnit,
                duration: r.duration,
                durationType: r.durationType,
                capacity: r.capacity,
                residency: r.residency,
            })),
        });
    }

    return groups;
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: facilityId } = await params;

        // Supabase에서 가격 정보 가져오기
        const { data: facility, error } = await supabase
            .from('Facility')
            .select('id, name, category, address, minPrice, maxPrice, pricing')
            .eq('id', facilityId)
            .single();

        if (error || !facility) {
            console.error(`[Prices API] Facility ${facilityId} not found:`, error);
            return NextResponse.json(
                { error: 'Facility not found' },
                { status: 404 }
            );
        }

        // pricing JSON 파싱
        let finalPriceTable = null;
        let existingStandardized = null;
        if (facility.pricing) {
            try {
                const parsed = typeof facility.pricing === 'string'
                    ? JSON.parse(facility.pricing)
                    : facility.pricing;
                finalPriceTable = parsed?.priceTable || parsed;
                // 이미 standardizedPrices가 저장되어 있으면 그대로 사용
                existingStandardized = parsed?.standardizedPrices;
            } catch (e) {
                console.error('Failed to parse pricing:', e);
            }
        }

        // 항목 수 계산
        let itemCount = 0;
        if (finalPriceTable) {
            Object.values(finalPriceTable).forEach((cat: any) => {
                itemCount += cat.rows?.length || 0;
            });
        }

        // standardizedPrices: 저장된 것이 있으면 사용, 없으면 레거시에서 자동 변환
        const standardizedPrices = existingStandardized
            || (finalPriceTable ? transformToStandardized(finalPriceTable) : []);

        return NextResponse.json({
            facility: {
                id: facility.id,
                name: facility.name,
                category: facility.category,
                address: facility.address,
                priceRange: { min: facility.minPrice || 0, max: facility.maxPrice || 0 }
            },
            priceTable: finalPriceTable || {},
            standardizedPrices,
            _meta: {
                source: 'supabase',
                categoryCount: Object.keys(finalPriceTable || {}).length,
                itemCount: itemCount,
                standardizedCount: standardizedPrices.length,
            }
        });

    } catch (error) {
        console.error('Error fetching prices:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: String(error) },
            { status: 500 }
        );
    }
}
