import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function check() {
    const id = process.argv[2] || 'park-0001';
    const { data } = await supabase.from('Facility').select('id, name, pricing').eq('id', id).single();
    if (!data) { console.log('시설 없음'); return; }

    const pricing = typeof data.pricing === 'string' ? JSON.parse(data.pricing) : data.pricing;

    console.log(`\n=== [${data.id}] ${data.name} ===\n`);

    console.log('--- V1 priceTable ---');
    const pt = pricing.priceTable || {};
    for (const [k, v] of Object.entries(pt) as any) {
        if (v.rows && v.rows.length > 0) {
            console.log(`\n  [${k}]`);
            v.rows.forEach((r: any) => {
                console.log(`    name="${r.name}" | grade="${r.grade || ''}" | price=${r.price}`);
            });
        }
    }

    console.log('\n\n--- V2 standardizedPrices ---');
    const sp = pricing.standardizedPrices || [];
    sp.forEach((g: any) => {
        console.log(`\n  [${g.serviceType}/${g.subType}]`);
        g.rows.forEach((r: any) => {
            console.log(`    name="${r.name}" | grade="${r.grade || ''}" | price=${r.price}`);
        });
    });

    // grade 비교
    console.log('\n\n--- grade 일치 비교 ---');
    let match = 0, mismatch = 0;
    for (const [k, v] of Object.entries(pt) as any) {
        if (!v.rows || v.rows.length === 0) continue;
        const v2Group = sp.find((g: any) => g.subType === k);
        if (!v2Group) continue;

        v.rows.forEach((r: any, i: number) => {
            const v2Row = v2Group.rows[i];
            if (!v2Row) return;
            const v1Grade = r.grade || '';
            const v2Grade = v2Row.grade || '';
            if (v1Grade === v2Grade) { match++; }
            else {
                mismatch++;
                console.log(`  ❌ ${k}[${i}]: V1="${v1Grade}" vs V2="${v2Grade}"`);
            }
        });
    }
    console.log(`  ✅ 일치: ${match}개, ❌ 불일치: ${mismatch}개`);
}

check().catch(console.error);
