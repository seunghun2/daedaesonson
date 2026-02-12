import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabase = getSupabaseServer();

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: facilityId } = await params;

        // 🔥 Supabase에서 가격 정보 가져오기
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
        if (facility.pricing) {
            try {
                const parsed = typeof facility.pricing === 'string'
                    ? JSON.parse(facility.pricing)
                    : facility.pricing;
                finalPriceTable = parsed?.priceTable || parsed;
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



        return NextResponse.json({
            facility: {
                id: facility.id,
                name: facility.name,
                category: facility.category,
                address: facility.address,
                priceRange: { min: facility.minPrice || 0, max: facility.maxPrice || 0 }
            },
            priceTable: finalPriceTable || {},
            _meta: {
                source: 'supabase',
                categoryCount: Object.keys(finalPriceTable || {}).length,
                itemCount: itemCount
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
