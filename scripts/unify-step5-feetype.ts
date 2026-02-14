/**
 * Step 5: 비용유형(feeType) 통일
 * name이나 grade에서 "관리비", "석물비", "연장" 등을 감지 → feeType 필드 업데이트
 * 현재 거의 전부 USAGE로 되어 있는 것을 실제 유형에 맞게 분류
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
);

function detectFeeType(name: string, grade: string): string | null {
    const combined = `${name} ${grade}`;

    // 관리비 (가장 빈번)
    if (/관리비|관리료|연관리|유지비|유지관리/.test(combined)) return 'MAINTENANCE';
    // 석물비
    if (/석물비|석물|비석대|비석|상석|화병대?/.test(name)) return 'STONE';
    // 연장/재사용
    if (/연장|재사용|갱신|재계약/.test(combined)) return 'EXTENSION';
    // 제례/추모제
    if (/제례|추모제|제사|추도/.test(combined)) return 'RITUAL';
    // 매장비/안장비/설치비
    if (/매장비|안장비|설치비|조립비|시공비/.test(combined)) return 'INSTALLATION';

    return null; // 변경 불필요
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

    let updated = 0, changed_count = 0, samples: string[] = [];
    const typeStats: Record<string, number> = {};

    for (const f of allFacilities) {
        if (!f.pricing) continue;
        let parsed: any;
        try { parsed = typeof f.pricing === 'string' ? JSON.parse(f.pricing) : f.pricing; } catch { continue; }
        const sp = parsed?.standardizedPrices;
        if (!sp || !Array.isArray(sp)) continue;

        let changed = false;
        for (const group of sp) {
            for (const row of group.rows || []) {
                // USAGE가 아닌 건 이미 설정된 것이므로 스킵
                if (row.feeType && row.feeType !== 'USAGE') continue;

                const detected = detectFeeType(row.name || '', row.grade || '');
                if (detected && detected !== 'USAGE') {
                    const oldType = row.feeType || 'USAGE';
                    row.feeType = detected;
                    changed_count++;
                    changed = true;

                    typeStats[detected] = (typeStats[detected] || 0) + 1;

                    if (samples.length < 40) {
                        samples.push(`  [${f.name}] name:"${row.name}" → ${oldType}→${detected}`);
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
    console.log(`\n📊 비용유형별 통계:`);
    for (const [type, cnt] of Object.entries(typeStats).sort((a, b) => b[1] - a[1])) {
        console.log(`   ${type}: ${cnt}개`);
    }
    console.log(`\n✅ 결과: ${updated}개 시설, ${changed_count}개 행 비용유형 재분류`);
    if (DRY_RUN) console.log('👉 실제 적용: npx tsx scripts/unify-step5-feetype.ts --apply');
}

run().catch(console.error);
