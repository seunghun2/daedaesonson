import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { requireAdmin } from '@/lib/adminAuth';

const supabase = getSupabaseServer();

export async function GET() {
    const authError = await requireAdmin();
    if (authError) return authError;

    try {
        // 카테고리 가져오기
        let allCats: any[] = [];
        let page = 0;
        while (true) {
            const { data } = await supabase
                .from('PriceCategory')
                .select('id, name')
                .range(page * 1000, (page + 1) * 1000 - 1);
            if (!data || data.length === 0) break;
            allCats = allCats.concat(data);
            if (data.length < 1000) break;
            page++;
        }
        const catMap: Record<string, string> = {};
        allCats.forEach(c => catMap[c.id] = c.name);

        // 시설 가져오기 (1000개 제한 극복을 위한 range 루프)
        let allFacilities: any[] = [];
        let fPage = 0;
        while (true) {
            const { data: facilities } = await supabase
                .from('Facility')
                .select('id, name')
                .range(fPage * 1000, (fPage + 1) * 1000 - 1);
            if (!facilities || facilities.length === 0) break;
            allFacilities = allFacilities.concat(facilities);
            if (facilities.length < 1000) break;
            fPage++;
        }
        const nameMap: Record<string, string> = {};
        allFacilities.forEach((f: any) => nameMap[f.id] = f.name);

        // 가격 항목 가져오기
        let allItems: any[] = [];
        page = 0;
        while (true) {
            const { data } = await supabase
                .from('PriceItem')
                .select('facilityId, categoryId, itemName, description, price, isRepresentative')
                .order('facilityId')
                .range(page * 1000, (page + 1) * 1000 - 1);
            if (!data || data.length === 0) break;
            allItems = allItems.concat(data);
            if (data.length < 1000) break;
            page++;
        }

        // JSON 배열 생성
        const result = allItems.map(item => ([
            item.facilityId,
            nameMap[item.facilityId] || '',
            catMap[item.categoryId] || '미분류',
            item.itemName || '',
            item.description || '',
            item.price || 0,
            item.isRepresentative ? 'Y' : ''
        ]));

        return NextResponse.json({
            headers: ['시설ID', '시설명', '가격카테고리', '상품명', '설명', '가격', '대표가격'],
            data: result
        });
    } catch (error) {
        console.error('Export error:', error);
        return NextResponse.json({ error: 'Export failed' }, { status: 500 });
    }
}
