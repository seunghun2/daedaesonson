/**
 * Step 1: 기간(duration) 통일
 * grade 필드에서 "15년", "30년", "영구" 등을 추출 → duration / durationType 필드로 이동
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
);

function extractDuration(grade: string): { duration?: number; durationType?: string; cleaned: string } {
    let cleaned = grade;
    let duration: number | undefined;
    let durationType: string | undefined;

    if (/영구안치|영구|영안|무기한/.test(cleaned)) {
        duration = 0;
        durationType = 'PERMANENT';
        cleaned = cleaned.replace(/영구안치|영구|영안|무기한/g, '').trim();
    }

    const durationMatch = cleaned.match(/(?:사용기간\s*[:：]?\s*)?(\d+)\s*년/);
    if (durationMatch && duration === undefined) {
        const y = parseInt(durationMatch[1]);
        if (y < 100) {
            duration = y;
            durationType = 'YEAR';
            cleaned = cleaned.replace(durationMatch[0], '').trim();
        }
    }

    // 앞뒤 구두점/쉼표 정리
    cleaned = cleaned.replace(/^[\s,.:;·\-()]+|[\s,.:;·\-()]+$/g, '').replace(/\s+/g, ' ').trim();

    return { duration, durationType, cleaned };
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
                if (row.duration !== undefined || row.durationType) continue; // 이미 있으면 스킵
                const grade = (row.grade || '').trim();
                if (!grade) continue;

                const { duration, durationType, cleaned } = extractDuration(grade);
                if (duration !== undefined) {
                    row.duration = duration;
                    row.durationType = durationType;
                    row.grade = cleaned;
                    extracted++;
                    changed = true;

                    if (samples.length < 30) {
                        samples.push(`  [${f.name}] "${grade}" → 기간:${duration}${durationType}, grade:"${cleaned}"`);
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
    console.log(`\n✅ 결과: ${updated}개 시설, ${extracted}개 행에서 기간 추출`);
    if (DRY_RUN) console.log('👉 실제 적용: npx tsx scripts/unify-step1-duration.ts --apply');
}

run().catch(console.error);
