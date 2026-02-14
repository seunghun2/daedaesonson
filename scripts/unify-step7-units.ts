/**
 * Step 7: 카테고리별 안치 단위 통일
 * 봉안 → 기, 자연장 → 위, 매장 → 구
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
);

// serviceType별 표준 단위
const STANDARD_UNIT: Record<string, string> = {
    'BONGSAN': '기',
    'NATURAL': '위',
    'BURIAL': '구',
};

// 위/구/기 패턴
const UNIT_PATTERN = /([0-9]+)\s*(기|위|구)/g;

function normalizeUnit(text: string, targetUnit: string): string {
    return text.replace(UNIT_PATTERN, (match, num, unit) => {
        if (unit !== targetUnit) return `${num}${targetUnit}`;
        return match;
    });
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

    let updated = 0, fixed = 0, samples: string[] = [];

    for (const f of allFacilities) {
        if (!f.pricing) continue;
        let parsed: any;
        try { parsed = typeof f.pricing === 'string' ? JSON.parse(f.pricing) : f.pricing; } catch { continue; }
        const sp = parsed?.standardizedPrices;
        if (!sp || !Array.isArray(sp)) continue;

        let changed = false;
        for (const group of sp) {
            const st = group.serviceType; // BONGSAN, NATURAL, BURIAL
            const targetUnit = STANDARD_UNIT[st];
            if (!targetUnit) continue;

            // 그룹 unit 필드 통일
            if (group.unit && /기|위|구/.test(group.unit)) {
                const oldUnit = group.unit;
                const newUnit = normalizeUnit(oldUnit, targetUnit);
                if (oldUnit !== newUnit) {
                    group.unit = newUnit;
                    fixed++;
                    changed = true;
                    if (samples.length < 50) samples.push(`  [${f.name}] (${st}) unit: "${oldUnit}" → "${newUnit}"`);
                }
            }

            for (const row of group.rows || []) {
                // grade 안의 단위 통일
                const oldGrade = row.grade || '';
                if (oldGrade && /\d+\s*(기|위|구)/.test(oldGrade)) {
                    const newGrade = normalizeUnit(oldGrade, targetUnit);
                    if (oldGrade !== newGrade) {
                        row.grade = newGrade;
                        fixed++;
                        changed = true;
                        if (samples.length < 50) samples.push(`  [${f.name}] (${st}) grade: "${oldGrade}" → "${newGrade}"`);
                    }
                }

                // name 안의 단위 통일
                const oldName = row.name || '';
                if (oldName && /\d+\s*(기|위|구)/.test(oldName)) {
                    const newName = normalizeUnit(oldName, targetUnit);
                    if (oldName !== newName) {
                        row.name = newName;
                        fixed++;
                        changed = true;
                        if (samples.length < 50) samples.push(`  [${f.name}] (${st}) name: "${oldName}" → "${newName}"`);
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

    console.log(`\n📋 샘플 (처음 50개):`);
    samples.forEach(s => console.log(s));
    console.log(`\n✅ 결과: ${updated}개 시설, ${fixed}개 항목 단위 통일`);
    console.log(`   봉안→기, 자연장→위, 매장→구`);
    if (DRY_RUN) console.log('👉 실제 적용: npx tsx scripts/unify-step7-units.ts --apply');
}

run().catch(console.error);
