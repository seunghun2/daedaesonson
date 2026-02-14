import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checkAll() {
    // 전체 시설 가져오기
    let all: any[] = [];
    let from = 0;
    while (true) {
        const { data, error } = await supabase
            .from('Facility').select('id, name, pricing').order('id').range(from, from + 499);
        if (error || !data || data.length === 0) break;
        all = all.concat(data);
        if (data.length < 500) break;
        from += 500;
    }

    console.log(`\n📋 전체 ${all.length}개 시설 name/grade 일치 검증\n`);

    let totalMatch = 0, totalMismatch = 0, totalRows = 0;
    let facilities = 0;
    const issues: string[] = [];

    for (const f of all) {
        let pricing: any;
        try { pricing = typeof f.pricing === 'string' ? JSON.parse(f.pricing) : f.pricing; } catch { continue; }
        if (!pricing) continue;

        const pt = pricing.priceTable || {};
        const sp: any[] = pricing.standardizedPrices || [];
        if (sp.length === 0) continue;

        facilities++;
        for (const [k, v] of Object.entries(pt) as any) {
            if (!v?.rows || v.rows.length === 0) continue;
            if (k === '제외됨' || k === '기타') continue;

            const v2Group = sp.find((g: any) => g.subType === k);
            if (!v2Group) continue;

            v.rows.forEach((r: any, i: number) => {
                const v2Row = v2Group.rows[i];
                if (!v2Row) return;
                totalRows++;

                const v1Name = r.name || '';
                const v2Name = v2Row.name || '';
                const v1Grade = r.grade || '';
                const v2Grade = v2Row.grade || '';

                if (v1Name === v2Name && v1Grade === v2Grade) {
                    totalMatch++;
                } else {
                    totalMismatch++;
                    if (v1Name !== v2Name) issues.push(`${f.id} [${k}][${i}] name: V1="${v1Name}" vs V2="${v2Name}"`);
                    if (v1Grade !== v2Grade) issues.push(`${f.id} [${k}][${i}] grade: V1="${v1Grade}" vs V2="${v2Grade}"`);
                }
            });
        }
    }

    console.log('='.repeat(60));
    console.log('📊 전체 결과');
    console.log('='.repeat(60));
    console.log(`  📦 검증 시설: ${facilities}개`);
    console.log(`  📝 검증 행(row): ${totalRows}개`);
    console.log(`  ✅ name+grade 일치: ${totalMatch}개`);
    console.log(`  ❌ 불일치: ${totalMismatch}개`);
    console.log(`  📈 일치율: ${(totalMatch / totalRows * 100).toFixed(2)}%`);

    if (issues.length > 0) {
        console.log(`\n🔍 불일치 목록 (${issues.length}건):`);
        issues.slice(0, 20).forEach(i => console.log(`  - ${i}`));
        if (issues.length > 20) console.log(`  ... 외 ${issues.length - 20}건`);
    } else {
        console.log(`\n🎉 전체 100% 일치!`);
    }
}

checkAll().catch(console.error);
