/**
 * Step 3: 거주구분(residency) 통일
 * grade 필드에서 "관내", "관외", "유공자", "수급자" 등을 추출 → residency 필드로 이동
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
);

function extractResidency(grade: string): { residency?: string; cleaned: string } {
    let cleaned = grade;
    let residency: string | undefined;

    if (/기초생활수급|수급자/.test(cleaned)) {
        residency = 'LOW_INCOME';
        cleaned = cleaned.replace(/기초생활수급자?\s*/g, '').trim();
    } else if (/국가보훈|유공자/.test(cleaned)) {
        residency = 'VETERAN';
        cleaned = cleaned.replace(/국가보훈대상자?\s*|유공자\s*/g, '').trim();
    } else if (/관외/.test(cleaned)) {
        residency = 'NON_RESIDENT';
        cleaned = cleaned.replace(/관외\s*(자격)?\s*/g, '').trim();
    } else if (/관내(?!\s*외)/.test(cleaned)) {
        residency = 'RESIDENT';
        cleaned = cleaned.replace(/관내\s*(자격)?\s*/g, '').trim();
    }

    if (residency) {
        cleaned = cleaned.replace(/^[\s,.:;·\-()（）]+|[\s,.:;·\-()（）]+$/g, '').replace(/\s+/g, ' ').trim();
    }

    return { residency, cleaned };
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
                const grade = (row.grade || '').trim();
                if (!grade) continue;

                const { residency, cleaned } = extractResidency(grade);
                if (residency) {
                    row.residency = residency;
                    row.grade = cleaned;
                    extracted++;
                    changed = true;

                    if (samples.length < 30) {
                        samples.push(`  [${f.name}] "${grade}" → 거주:${residency}, grade:"${cleaned}"`);
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

    console.log(`\n📋 샘플 (처음 30개):`);
    samples.forEach(s => console.log(s));
    console.log(`\n✅ 결과: ${updated}개 시설, ${extracted}개 행에서 거주구분 추출`);
    if (DRY_RUN) console.log('👉 실제 적용: npx tsx scripts/unify-step3-residency.ts --apply');
}

run().catch(console.error);
