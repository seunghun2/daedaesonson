/**
 * Step 6: grade 잔여 텍스트 정리 (단위 통일 제외)
 * - 깨진 구두점, 빈 괄호, "/" 만 남은 것 등 정리
 * - 위/구/기 는 각각 다른 맥락이므로 통일하지 않음
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
);

function cleanGrade(grade: string): string {
    let cleaned = grade;

    // 앞뒤 공백 제거
    cleaned = cleaned.trim();
    // 앞쪽 구두점/슬래시 제거 (괄호는 보존)
    cleaned = cleaned.replace(/^[\s,.:;·/\-]+/, '');
    // 뒤쪽 구두점/슬래시 제거 (괄호는 보존)
    cleaned = cleaned.replace(/[\s,.:;·/\-]+$/, '');
    // 빈 괄호 제거: "()", "( )"
    cleaned = cleaned.replace(/\(\s*\)/g, '');
    // "/" 만 남은 경우 제거
    cleaned = cleaned.replace(/^\/\s*$/g, '');
    // 연속 공백
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    return cleaned;
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

    let updated = 0, gradeCleaned = 0, samples: string[] = [];

    for (const f of allFacilities) {
        if (!f.pricing) continue;
        let parsed: any;
        try { parsed = typeof f.pricing === 'string' ? JSON.parse(f.pricing) : f.pricing; } catch { continue; }
        const sp = parsed?.standardizedPrices;
        if (!sp || !Array.isArray(sp)) continue;

        let changed = false;
        for (const group of sp) {
            for (const row of group.rows || []) {
                const oldGrade = row.grade || '';
                if (!oldGrade) continue;

                const newGrade = cleanGrade(oldGrade);
                if (newGrade !== oldGrade) {
                    row.grade = newGrade;
                    gradeCleaned++;
                    changed = true;
                    if (samples.length < 40) {
                        samples.push(`  [${f.name}] "${oldGrade}" → "${newGrade}"`);
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
    console.log(`\n✅ 결과: ${updated}개 시설, ${gradeCleaned}개 행 grade 정리`);
    if (DRY_RUN) console.log('👉 실제 적용: npx tsx scripts/unify-step6-cleanup.ts --apply');
}

run().catch(console.error);
