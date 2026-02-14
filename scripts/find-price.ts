import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

async function find() {
    let all: any[] = [];
    let from = 0;
    while (true) {
        const { data } = await supabase.from('Facility').select('id, name, pricing').not('pricing', 'is', null).range(from, from + 499);
        if (data) all.push(...data);
        if (!data || data.length < 500) break;
        from += 500;
    }

    for (const f of all) {
        let parsed: any;
        try { parsed = typeof f.pricing === 'string' ? JSON.parse(f.pricing) : f.pricing; } catch { continue; }
        const sp = parsed?.standardizedPrices;
        if (!sp) continue;
        for (const g of sp) {
            for (const r of g.rows || []) {
                if (r.price === 4750000) {
                    console.log('\n=== 시설:', f.name, '(ID:', f.id, ') ===');
                    console.log('서비스:', g.serviceType, '/', g.subType);
                    console.log('\nV2 rows:');
                    g.rows.forEach((row: any, i: number) => console.log(`  [${i}]`, JSON.stringify(row)));

                    // 원본 priceTable도 확인
                    const pt = parsed?.priceTable;
                    if (pt) {
                        console.log('\n원본 V1 priceTable:');
                        for (const [k, v] of Object.entries(pt)) {
                            const tabData = v as any;
                            if (tabData?.rows) {
                                tabData.rows.forEach((r2: any) => {
                                    console.log(`  [${k}]`, JSON.stringify(r2));
                                });
                            }
                        }
                    }
                }
            }
        }
    }
}
find();
