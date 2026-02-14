/**
 * Step 2: 인원(capacity) 통일
 * grade 필드에서 "개인", "부부", "가족" 등을 추출 → capacity 필드로 이동
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
);

function extractCapacity(grade: string): { capacity?: string; cleaned: string } {
    let cleaned = grade;
    let capacity: string | undefined;

    // "부부" 먼저 (개인보다 먼저 매칭해야 함)
    if (/부부/.test(cleaned)) {
        capacity = '부부';
        cleaned = cleaned.replace(/부부단?/g, '').trim();
    }
    // "가족", "대가족"
    else if (/가족/.test(cleaned)) {
        capacity = '가족';
        cleaned = cleaned.replace(/대?가족형?/g, '').trim();
    }
    // "개인" (단, "개인장"은 자연장 타입이므로 제외)
    else if (/개인(?!장)/.test(cleaned)) {
        capacity = '개인';
        cleaned = cleaned.replace(/개인단?/g, '').trim();
    }

    // 정리
    if (capacity) {
        cleaned = cleaned.replace(/^[\s,.:;·\-()]+|[\s,.:;·\-()]+$/g, '').replace(/\s+/g, ' ').trim();
    }

    return { capacity, cleaned };
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
                if (row.capacity) continue; // 이미 있으면 스킵
                const grade = (row.grade || '').trim();
                if (!grade) continue;

                const { capacity, cleaned } = extractCapacity(grade);
                if (capacity) {
                    row.capacity = capacity;
                    row.grade = cleaned;
                    extracted++;
                    changed = true;

                    if (samples.length < 30) {
                        samples.push(`  [${f.name}] "${grade}" → 인원:${capacity}, grade:"${cleaned}"`);
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
    console.log(`\n✅ 결과: ${updated}개 시설, ${extracted}개 행에서 인원 추출`);
    if (DRY_RUN) console.log('👉 실제 적용: npx tsx scripts/unify-step2-capacity.ts --apply');
}

run().catch(console.error);
