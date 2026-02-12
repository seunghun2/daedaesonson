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

        // 3. PriceItem의 isRepresentative 업데이트 (기존 로직 유지)
        for (const row of rows) {
            if (row.id) {
                await supabase
                    .from('PriceItem')
                    .update({ isRepresentative: row.isRepresentative || false })
                    .eq('id', row.id);
            }
        }


        return NextResponse.json({ success: true, source: 'supabase' });

    } catch (error) {
        console.error('[Save Pricing] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: String(error) }, { status: 500 });
    }
}
