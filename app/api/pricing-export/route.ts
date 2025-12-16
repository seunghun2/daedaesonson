import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY || 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3'
);

export async function GET() {
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

        // 시설 가져오기
        const { data: facilities } = await supabase
            .from('Facility')
            .select('id, name');
        const nameMap: Record<string, string> = {};
        (facilities || []).forEach((f: any) => nameMap[f.id] = f.name);

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
