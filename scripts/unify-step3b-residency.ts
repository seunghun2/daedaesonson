/**
 * Step 3b: 추가 거주구분 추출
 * "강화군민", "정읍시민", "양주시에 거주" 등 → RESIDENT로 세팅
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
);

function detectResidency(grade: string, name: string): string | null {
    const text = `${name} ${grade}`;

    // 이미 관내/관외 키워드가 있으면 이전 스크립트에서 처리됨
    // 여기선 "XX군민", "XX시민", "XX구민", "해당 지역 거주" 같은 패턴 처리

    // "타 시,도" / "타시군" / "타 지역" → 관외
    if (/타\s*(시[,·]?\s*도|시군|지역|시|도)/.test(text)) return 'NON_RESIDENT';

    // "XX군민", "XX시민", "XX구민" → 관내
    if (/[가-힣]+(군민|시민|구민|도민)/.test(text)) return 'RESIDENT';

    // "해당 지역 거주", "관할 지역" → 관내
    if (/해당\s*지역|관할\s*지역/.test(text)) return 'RESIDENT';

    // "거주한 자", "거주한 시민", "거주" + 지역명 → 관내
    if (/에\s*거주한?\s*(자|시민|주민)?/.test(text)) return 'RESIDENT';

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
    const stats: Record<string, number> = {};

    for (const f of allFacilities) {
        if (!f.pricing) continue;
        let parsed: any;
        try { parsed = typeof f.pricing === 'string' ? JSON.parse(f.pricing) : f.pricing; } catch { continue; }
        const sp = parsed?.standardizedPrices;
        if (!sp || !Array.isArray(sp)) continue;

        let changed = false;
        for (const group of sp) {
            for (const row of group.rows || []) {
                // 이미 세팅된 것은 스킵 (ALL이 아닌 값)
                if (row.residency && row.residency !== 'ALL') continue;

                const residency = detectResidency(row.grade || '', row.name || '');
                if (residency) {
                    row.residency = residency;
                    extracted++;
                    changed = true;
                    stats[residency] = (stats[residency] || 0) + 1;

                    if (samples.length < 40) {
                        samples.push(`  [${f.name}] grade:"${row.grade}" name:"${row.name}" → ${residency}`);
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
    console.log(`\n📊 통계:`, stats);
    console.log(`\n✅ 결과: ${updated}개 시설, ${extracted}개 행 거주구분 추가 세팅`);
    if (DRY_RUN) console.log('👉 실제 적용: npx tsx scripts/unify-step3b-residency.ts --apply');
}

run().catch(console.error);
