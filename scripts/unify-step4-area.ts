/**
 * Step 4: 면적(area) 통일
 * 1) grade 필드에서 "1평", "3.3㎡", "6.6m2" 등을 추출 → area / areaUnit 필드로 이동
 * 2) 기존 area 필드의 단위도 통일 (평→㎡)
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
);

function extractArea(grade: string): { area?: number; areaUnit?: string; cleaned: string } {
    let cleaned = grade;

    // "1평", "3.3㎡", "6.516㎡", "4.95㎡당", "3.3m2", "6.6m2", "10㎡"
    const areaMatch = cleaned.match(/([\d.]+)\s*(평|㎡|m²|m2)\s*(당)?/);
    if (areaMatch) {
        const rawValue = parseFloat(areaMatch[1]);
        const rawUnit = areaMatch[2];
        cleaned = cleaned.replace(areaMatch[0], '').trim();
        cleaned = cleaned.replace(/^[\s,.:;·\-()]+|[\s,.:;·\-()]+$/g, '').replace(/\s+/g, ' ').trim();

        // 평 → ㎡ 변환
        if (rawUnit === '평') {
            return {
                area: Math.round(rawValue * 3.3058 * 100) / 100,
                areaUnit: 'SQM',
                cleaned,
            };
        }
        return { area: rawValue, areaUnit: 'SQM', cleaned };
    }

    return { cleaned };
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

    let updated = 0, extracted = 0, unitFixed = 0, samples: string[] = [];

    for (const f of allFacilities) {
        if (!f.pricing) continue;
        let parsed: any;
        try { parsed = typeof f.pricing === 'string' ? JSON.parse(f.pricing) : f.pricing; } catch { continue; }
        const sp = parsed?.standardizedPrices;
        if (!sp || !Array.isArray(sp)) continue;

        let changed = false;
        for (const group of sp) {
            for (const row of group.rows || []) {
                // A) 기존 area의 단위 통일 (PYEONG → SQM)
                if (row.area && row.areaUnit === 'PYEONG') {
                    const oldArea = row.area;
                    row.area = Math.round(row.area * 3.3058 * 100) / 100;
                    row.areaUnit = 'SQM';
                    unitFixed++;
                    changed = true;
                    if (samples.length < 40) {
                        samples.push(`  [${f.name}] 단위변환: ${oldArea}평 → ${row.area}㎡`);
                    }
                }

                // B) grade에서 면적 추출
                if (!row.area && !row.areaUnit) {
                    const grade = (row.grade || '').trim();
                    if (!grade) continue;

                    const { area, areaUnit, cleaned } = extractArea(grade);
                    if (area) {
                        row.area = area;
                        row.areaUnit = areaUnit;
                        row.grade = cleaned;
                        extracted++;
                        changed = true;

                        if (samples.length < 40) {
                            samples.push(`  [${f.name}] "${grade}" → 면적:${area}${areaUnit}, grade:"${cleaned}"`);
                        }
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
    console.log(`\n✅ 결과: ${updated}개 시설`);
    console.log(`   grade에서 추출: ${extracted}개 행`);
    console.log(`   단위 변환(평→㎡): ${unitFixed}개 행`);
    if (DRY_RUN) console.log('👉 실제 적용: npx tsx scripts/unify-step4-area.ts --apply');
}

run().catch(console.error);
