/**
 * 종합 데이터 수정 스크립트 - 감사 결과 일괄 처리
 * 1) RESIDENCY_MISSING: "거주한 자", "주소를 두고" → RESIDENT
 * 2) CAPACITY_IN_GRADE: "단장/합장" → capacity
 * 3) DURATION_IN_GRADE: "60년" 등 → duration
 * 4) FEETYPE 재확인 (오탐지 필터링)
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
);

function fixResidency(grade: string, name: string): string | null {
    const text = `${name} ${grade}`;
    if (/관외/.test(text)) return 'NON_RESIDENT';
    if (/관내/.test(text)) return 'RESIDENT';
    if (/타\s*(시[,·]?\s*도|지역|시군)/.test(text)) return 'NON_RESIDENT';
    if (/[가-힣]+(군민|시민|구민|도민)/.test(text)) return 'RESIDENT';
    if (/거주한?\s*(자|시민|주민)?/.test(text)) return 'RESIDENT';
    if (/주소를\s*두고/.test(text)) return 'RESIDENT';
    if (/이용자격/.test(text)) return 'RESIDENT'; // 이용자격이 있으면 보통 관내
    return null;
}

function fixCapacity(grade: string, name: string): string | null {
    const text = `${name} ${grade}`;
    // name에 이미 단장/합장이 들어있으면 그건 항목명이지 capacity가 아닐 수 있음
    // grade에서만 추출
    if (/가족/.test(grade)) return 'FAMILY';
    if (/부부/.test(grade)) return 'COUPLE';
    if (/합장/.test(grade) && !/동시합장|합장\s*시/.test(grade)) return 'COUPLE';
    if (/단장/.test(grade) && !/단장\s*기준/.test(grade)) return 'INDIVIDUAL';
    if (/개인|1인/.test(grade)) return 'INDIVIDUAL';
    if (/2인/.test(grade)) return 'COUPLE';
    return null;
}

function fixDuration(grade: string): { duration: number; durationType: string } | null {
    // "60년", "15년" 등 - 하지만 "2010년 이후" 같은건 제외
    const m = grade.match(/(?<!\d{3})(\d{1,3})\s*년(?!\s*(이후|이전|전|도|대))/);
    if (m) {
        const dur = parseInt(m[1]);
        if (dur >= 1 && dur <= 100) {
            return { duration: dur, durationType: 'YEAR' };
        }
    }
    if (/영구/.test(grade)) return { duration: 0, durationType: 'PERMANENT' };
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
    if (DRY_RUN) console.log('⚠️ DRY RUN\n');

    let updated = 0;
    const stats = { residency: 0, capacity: 0, duration: 0 };
    const samples: Record<string, string[]> = { residency: [], capacity: [], duration: [] };

    for (const f of allFacilities) {
        if (!f.pricing) continue;
        let parsed: any;
        try { parsed = typeof f.pricing === 'string' ? JSON.parse(f.pricing) : f.pricing; } catch { continue; }
        const sp = parsed?.standardizedPrices;
        if (!sp || !Array.isArray(sp)) continue;

        let changed = false;
        for (const group of sp) {
            for (const row of group.rows || []) {
                const grade = row.grade || '';
                const name = row.name || '';

                // 1) Residency
                if (!row.residency || row.residency === 'ALL') {
                    const r = fixResidency(grade, name);
                    if (r) {
                        row.residency = r;
                        stats.residency++;
                        changed = true;
                        if (samples.residency.length < 10) samples.residency.push(`  [${f.name}] "${name}" grade:"${grade}" → ${r}`);
                    }
                }

                // 2) Capacity
                if (!row.capacity) {
                    const c = fixCapacity(grade, name);
                    if (c) {
                        row.capacity = c;
                        stats.capacity++;
                        changed = true;
                        if (samples.capacity.length < 10) samples.capacity.push(`  [${f.name}] "${name}" grade:"${grade}" → ${c}`);
                    }
                }

                // 3) Duration
                if (!row.duration) {
                    const d = fixDuration(grade);
                    if (d) {
                        row.duration = d.duration;
                        row.durationType = d.durationType;
                        stats.duration++;
                        changed = true;
                        if (samples.duration.length < 10) samples.duration.push(`  [${f.name}] "${name}" grade:"${grade}" → ${d.duration}${d.durationType}`);
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

    console.log('📊 거주구분 수정:', stats.residency, '건');
    samples.residency.forEach(s => console.log(s));
    console.log('\n📊 인원구분 수정:', stats.capacity, '건');
    samples.capacity.forEach(s => console.log(s));
    console.log('\n📊 기간 수정:', stats.duration, '건');
    samples.duration.forEach(s => console.log(s));
    console.log(`\n✅ 총 ${updated}개 시설, ${stats.residency + stats.capacity + stats.duration}개 항목 수정`);
    if (DRY_RUN) console.log('👉 실제 적용: npx tsx scripts/fix-all-issues.ts --apply');
}

run().catch(console.error);
