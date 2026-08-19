import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

const supabase = getSupabaseServer();

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { facilityId, rows } = body;



        // 1. pricing 객체 생성
        const newPricing: any = {};
        rows.forEach((row: any) => {
            if (!newPricing[row.category]) {
                newPricing[row.category] = { rows: [] };
            }
            newPricing[row.category].rows.push({
                name: row.name,
                description: row.desc,
                price: row.price,
                isRepresentative: row.isRepresentative || false
            });
        });

        // 2. Supabase에 pricing 업데이트
        const { error: updateError } = await supabase
            .from('Facility')
            .update({
                pricing: JSON.stringify({ priceTable: newPricing }),
                updatedAt: new Date().toISOString()
            })
            .eq('id', facilityId);

        if (updateError) {
            console.error('[Save Pricing] DB Error:', updateError);
            return NextResponse.json({ error: 'Database update failed', details: updateError.message }, { status: 500 });
        }

        // 3. 🚀 PriceItem 일괄 업데이트 (50회 순차 루프 제거 -> 단 1회 병렬 일괄 쿼리)
        const repIds = rows.filter((r: any) => r.id && r.isRepresentative).map((r: any) => r.id);
        const nonRepIds = rows.filter((r: any) => r.id && !r.isRepresentative).map((r: any) => r.id);

        if (repIds.length > 0) {
            await supabase.from('PriceItem').update({ isRepresentative: true }).in('id', repIds);
        }
        if (nonRepIds.length > 0) {
            await supabase.from('PriceItem').update({ isRepresentative: false }).in('id', nonRepIds);
        }


        return NextResponse.json({ success: true, source: 'supabase' });

    } catch (error) {
        console.error('[Save Pricing] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: String(error) }, { status: 500 });
    }
}
