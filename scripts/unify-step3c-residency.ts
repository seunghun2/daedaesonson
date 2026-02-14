/**
 * Step 3c: name 필드에서도 거주구분 추출
 * "관내자", "관외자", "관내거주자" 등이 name에 있는 경우
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
);

function detectResidencyFromName(name: string): string | null {
    if (/관외자?|관외\s*거주/.test(name)) return 'NON_RESIDENT';
    if (/관내자?|관내\s*거주/.test(name)) return 'RESIDENT';
    if (/타\s*(시[,·]?\s*도|지역|시군)/.test(name)) return 'NON_RESIDENT';
    if (/[가-힣]+(군민|시민|구민|도민)/.test(name)) return 'RESIDENT';
    return null;
}

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
    if (DRY_RUN) console.log('⚠️ DRY RUN (실행: --apply 추가)\n');

    let updated = 0, extracted = 0, samples: string[] = [];

    for (const f of allFacilities) {
        if (!f.pricing) continue;
        let parsed: any;
        try { parsed = typeof f.pricing === 'string' ? JSON.parse(f.pricing) : f.pricing; } catch { continue; }
        const sp = parsed?.standardizedPrices;
        if (!sp || !Array.isArray(sp)) continue;

        let changed = false;
        for (const group of sp) {
            for (const row of group.rows || []) {
                if (row.residency && row.residency !== 'ALL') continue;

                const residency = detectResidencyFromName(row.name || '');
                if (residency) {
                    row.residency = residency;
                    extracted++;
                    changed = true;
                    if (samples.length < 40) {
                        samples.push(`  [${f.name}] name:"${row.name}" → ${residency}`);
                    }
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

    console.log(`\n📋 샘플 (처음 40개):`);
    samples.forEach(s => console.log(s));
    console.log(`\n✅ 결과: ${updated}개 시설, ${extracted}개 행 추가 거주구분 세팅`);
    if (DRY_RUN) console.log('👉 실제 적용: npx tsx scripts/unify-step3c-residency.ts --apply');
}

run().catch(console.error);
