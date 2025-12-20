import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jbydmhfuqnpukfutvrgs.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false }
});

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { facilityId, rows } = body;

        console.log(`[Save Pricing] Saving ${rows?.length || 0} items for ${facilityId} to Supabase...`);

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

        console.log(`✅ [Save Pricing] Saved to Supabase for ${facilityId}`);
        return NextResponse.json({ success: true, source: 'supabase' });

    } catch (error) {
        console.error('[Save Pricing] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: String(error) }, { status: 500 });
    }
}
