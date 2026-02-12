import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { randomUUID } from 'crypto';

const supabase = getSupabaseServer();

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { facilityId, pricing } = body;

        if (!facilityId || !pricing) {
            return NextResponse.json(
                { error: 'facilityId and pricing are required' },
                { status: 400 }
            );
        }



        // 1. 기존 가격 카테고리 삭제 (Cascade로 PriceItem도 자동 삭제)
        const { error: deleteError } = await supabase
            .from('PriceCategory')
            .delete()
            .eq('facilityId', facilityId);

        if (deleteError) {

        }

        const results = [];



        for (const [key, categoryData] of Object.entries(pricing) as [string, any][]) {


            // 2-1. PriceCategory 삽입
            const categoryId = randomUUID();
            const { data: category, error: catError } = await supabase
                .from('PriceCategory')
                .insert({
                    id: categoryId,
                    facilityId: facilityId,
                    name: categoryData.categoryName || key,
                    normalizedName: categoryData.category || key,
                    orderNo: 0
                })
                .select()
                .single();

            if (catError) {
                console.error('[API] Category error:', catError);
                results.push({ category: key, error: catError.message });
                continue;
            }



            // 2-2. PriceItem 삽입
            const items = categoryData.rows.map((row: any, index: number) => {
                // 가격 처리: 범위(~) 형식이면 첫 번째 값만, 콤마 제거
                let priceStr = String(row.price || '0').replace(/,/g, '');
                if (priceStr.includes('~')) {
                    priceStr = priceStr.split('~')[0];
                }
                // 숫자가 아닌 문자 제거
                priceStr = priceStr.replace(/[^0-9]/g, '') || '0';

                return {
                    id: randomUUID(),
                    categoryId: category.id,
                    facilityId: facilityId,
                    itemName: row.itemName || row.name,
                    price: priceStr,
                    description: row.description || row.grade || '',
                    groupType: row.groupType || null,
                    unit: '1기',
                    isRepresentative: row.isRepresentative || false
                };
            });



            const { data: insertedItems, error: itemError } = await supabase
                .from('PriceItem')
                .insert(items)
                .select();

            if (itemError) {
                console.error('[API] Item error:', itemError);
                results.push({ category: key, error: itemError.message });
                continue;
            }

            results.push({
                category: categoryData.categoryName,
                itemCount: insertedItems?.length || 0
            });
        }



        return NextResponse.json({
            success: true,
            facilityId,
            results
        });

    } catch (error) {
        console.error('[API] Error:', error);
        return NextResponse.json(
            { error: String(error) },
            { status: 500 }
        );
    }
}
