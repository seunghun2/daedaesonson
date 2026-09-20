import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { requireAdmin } from '@/lib/adminAuth';

const supabase = getSupabaseServer();

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
    const authError = await requireAdmin();
    if (authError) return authError;

    try {
        const body = await request.json();
        const { facilityId, rows } = body;

        if (!facilityId || !Array.isArray(rows)) {
            return NextResponse.json({ error: '유효하지 않은 요청 데이터입니다.' }, { status: 400 });
        }

        // 1. pricing 객체 생성 (Prototype Pollution 방지)
        const newPricing: Record<string, { rows: any[] }> = {};
        for (const row of rows) {
            const cat = String(row.category || '기타');
            if (cat === '__proto__' || cat === 'constructor' || cat === 'prototype') continue;
            if (!newPricing[cat]) {
                newPricing[cat] = { rows: [] };
            }
            newPricing[cat].rows.push({
                name: String(row.name || ''),
                description: String(row.desc || ''),
                price: Number(row.price) || 0,
                isRepresentative: Boolean(row.isRepresentative)
            });
        }

        // 2. 기존 pricing 조회하여 standardizedPrices 등 보존 (DATA-01 버그 수정)
        const { data: currentFac } = await supabase
            .from('Facility')
            .select('pricing')
            .eq('id', facilityId)
            .maybeSingle();

        let mergedPricing: Record<string, any> = { priceTable: newPricing };
        if (currentFac?.pricing) {
            try {
                const parsed = typeof currentFac.pricing === 'string'
                    ? JSON.parse(currentFac.pricing)
                    : currentFac.pricing;
                if (parsed && typeof parsed === 'object') {
                    mergedPricing = {
                        ...parsed,
                        priceTable: newPricing,
                    };
                }
            } catch (e) {
                console.warn('[Save Pricing] Failed to parse existing pricing:', e);
            }
        }

        // 3. Supabase에 pricing 업데이트
        const { error: updateError } = await supabase
            .from('Facility')
            .update({
                pricing: JSON.stringify(mergedPricing),
                updatedAt: new Date().toISOString()
            })
            .eq('id', facilityId);

        if (updateError) {
            console.error('[Save Pricing] DB Error:', updateError);
            return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
        }

        // 4. 🚀 PriceItem 일괄 업데이트 (유효한 UUID인 경우만)
        const isUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        const repIds = rows.filter((r: any) => r.id && isUuid(r.id) && r.isRepresentative).map((r: any) => r.id);
        const nonRepIds = rows.filter((r: any) => r.id && isUuid(r.id) && !r.isRepresentative).map((r: any) => r.id);

        if (repIds.length > 0) {
            await supabase.from('PriceItem').update({ isRepresentative: true }).in('id', repIds);
        }
        if (nonRepIds.length > 0) {
            await supabase.from('PriceItem').update({ isRepresentative: false }).in('id', nonRepIds);
        }

        return NextResponse.json({ success: true, source: 'supabase' });

    } catch (error) {
        console.error('[Save Pricing] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

