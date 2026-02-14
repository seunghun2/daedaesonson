/**
 * Step 4b: 면적값 있는데 단위 없는 케이스 + "기준명적→기준면적" 오타 수정
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
);

async function run() {
    const DRY_RUN = !process.argv.includes('--apply');

    let allFacilities: any[] = [];
    let from = 0;
    while (true) {
        const { data } = await supabase.from('Facility').select('id, name, pricing').range(from, from + 499);
        if (data) allFacilities.push(...data);
        if (!data || data.length < 500) break;
        from += 500;
    }

    console.log(`📦 ${allFacilities.length}개 시설 로드`);
    if (DRY_RUN) console.log('⚠️ DRY RUN\n');

    let updated = 0, fixedUnit = 0, fixedTypo = 0, samples: string[] = [];

    for (const f of allFacilities) {
        if (!f.pricing) continue;
        let parsed: any;
        try { parsed = typeof f.pricing === 'string' ? JSON.parse(f.pricing) : f.pricing; } catch { continue; }
        const sp = parsed?.standardizedPrices;
        if (!sp || !Array.isArray(sp)) continue;

        let changed = false;
        for (const group of sp) {
            for (const row of group.rows || []) {
                // 1) 면적 있는데 단위 없으면 ㎡로 세팅
                if (row.area && !row.areaUnit) {
                    row.areaUnit = '㎡';
                    fixedUnit++;
                    changed = true;
                    if (samples.length < 30) samples.push(`  [${f.name}] area:${row.area} 단위없음 → ㎡`);
                }

                // 2) grade에 "기준명적" → "기준면적" 오타 수정
                if (row.grade && row.grade.includes('기준명적')) {
                    const old = row.grade;
                    row.grade = row.grade.replace(/기준명적/g, '기준면적');
                    fixedTypo++;
                    changed = true;
                    if (samples.length < 30) samples.push(`  [${f.name}] "${old}" → "${row.grade}"`);
                }
                // name에도
                if (row.name && row.name.includes('기준명적')) {
                    const old = row.name;
                    row.name = row.name.replace(/기준명적/g, '기준면적');
                    fixedTypo++;
                    changed = true;
                    if (samples.length < 30) samples.push(`  [${f.name}] name: "${old}" → "${row.name}"`);
                }
            }
        }

        if (changed) {
            updated++;
            if (!DRY_RUN) {
                parsed.standardizedPrices = sp;
                await supabase.from('Facility').update({ pricing: JSON.stringify(parsed) }).eq('id', f.id);
            }
        }
    }

    console.log(`\n📋 샘플:`);
    samples.forEach(s => console.log(s));
    console.log(`\n✅ 결과: ${updated}개 시설 | 면적단위 추가: ${fixedUnit}개 | 오타수정: ${fixedTypo}개`);
    if (DRY_RUN) console.log('👉 실제 적용: npx tsx scripts/unify-step4b-area.ts --apply');
}

run().catch(console.error);
