import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

const TARGET_ID = process.argv[2] || 'park-0051';

async function reviewAndFix(id: string) {
    const { data, error } = await sb.from('Facility').select('*').eq('id', id).single();
    if (error || !data) { console.log(`❌ ${id}: ${error?.message || 'not found'}`); return; }

    const pi = typeof data.pricing === 'string' ? JSON.parse(data.pricing) : data.pricing;
    if (!pi?.standardizedPrices || pi.standardizedPrices.length === 0) {
        console.log(`⏭️ ${id} (${data.name}): V2 데이터 없음`);
        return;
    }

    const sp = pi.standardizedPrices;
    console.log(`\n${'='.repeat(70)}`);
    console.log(`📍 ${data.name} (${id}) | ${data.category} | ${data.address}`);
    console.log(`${'='.repeat(70)}`);

    const changes: string[] = [];

    // 분석 + 자동수정
    sp.forEach((group: any, gi: number) => {
        // groupType별 분류
        const byGroup: Record<string, any[]> = {};
        (group.rows || []).forEach((r: any, ri: number) => {
            const gt = r.groupType || '기본';
            if (!byGroup[gt]) byGroup[gt] = [];
            byGroup[gt].push({ ...r, _idx: ri });
        });

        const tabNames = Object.keys(byGroup);
        const hasTabs = tabNames.length > 1 || (tabNames.length === 1 && tabNames[0] !== '기본');

        console.log(`\n  📦 ${group.serviceType} / ${group.subType} (${group.rows?.length || 0}개)`);

        tabNames.forEach(gt => {
            if (hasTabs) console.log(`    📁 ${gt} (${byGroup[gt].length}개)`);
            byGroup[gt].forEach(row => {
                const flags: string[] = [];

                // === 자동 수정 ===
                // 1. 공백 정리
                if (row.name && row.name !== row.name.trim()) {
                    changes.push(`[${group.subType}] name 공백: "${row.name}" → "${row.name.trim()}"`);
                    group.rows[row._idx].name = row.name.trim();
                }
                if (row.grade && row.grade !== row.grade.trim()) {
                    changes.push(`[${group.subType}] grade 공백: "${row.grade}" → "${row.grade.trim()}"`);
                    group.rows[row._idx].grade = row.grade.trim();
                }

                // 2. 관리비 → MAINTENANCE
                if (row.feeType === 'USAGE' && /관리비|관리료/.test(row.name || '')) {
                    changes.push(`[${group.subType}] "${row.name}" feeType → MAINTENANCE`);
                    group.rows[row._idx].feeType = 'MAINTENANCE';
                    row.feeType = 'MAINTENANCE';
                }

                // 3. capacity
                const nm = row.name || '';
                if (!row.capacity && !/관리/.test(nm)) {
                    if (/부부|합장/.test(nm)) { group.rows[row._idx].capacity = '부부'; row.capacity = '부부'; changes.push(`[${group.subType}] "${nm}" → 부부`); }
                    else if (/가족/.test(nm)) { group.rows[row._idx].capacity = '가족'; row.capacity = '가족'; changes.push(`[${group.subType}] "${nm}" → 가족`); }
                    else if (/개인|1인|단장/.test(nm)) { group.rows[row._idx].capacity = '개인'; row.capacity = '개인'; changes.push(`[${group.subType}] "${nm}" → 개인`); }
                }

                // 4. residency (name, grade, groupType 모두 검사)
                const txt = `${row.name || ''} ${row.grade || ''} ${row.groupType || ''}`;
                if (!row.residency || row.residency === 'ALL') {
                    // LOCAL 패턴: 관내, 시민, 군민, 구민, 주민등록, 거주자
                    if (/관내|시민|군민|구민|주민등록|거주자/.test(txt) && !/관외|이외/.test(txt)) {
                        group.rows[row._idx].residency = 'LOCAL'; row.residency = 'LOCAL';
                        changes.push(`[${group.subType}] "${nm}" (${row.groupType || '-'}) → LOCAL`);
                        // NON_LOCAL 패턴: 관외, 이외, 타지역, 비거주
                    } else if (/관외|이외|타지역|비거주/.test(txt) && !/관내|주민등록/.test(txt)) {
                        group.rows[row._idx].residency = 'NON_LOCAL'; row.residency = 'NON_LOCAL';
                        changes.push(`[${group.subType}] "${nm}" (${row.groupType || '-'}) → NON_LOCAL`);
                    }
                }

                // 5. 기간 추출
                if (!row.duration && row.grade) {
                    const m = row.grade.match(/(\d+)\s*년/);
                    if (m && !/(안치|위|이후|이전|설치|준공)/.test(row.grade)) {
                        const d = parseInt(m[1]);
                        if (d > 0 && d <= 100) {
                            group.rows[row._idx].duration = d; group.rows[row._idx].durationType = 'YEAR';
                            changes.push(`[${group.subType}] "${nm}" duration → ${d}년`);
                        }
                    }
                    if (/영구/.test(row.grade) && !row.durationType) {
                        group.rows[row._idx].durationType = 'PERMANENT';
                        changes.push(`[${group.subType}] "${nm}" → PERMANENT`);
                    }
                }

                // 6. 관리비 groupType 정리
                if (/관리비|관리료/.test(nm) && row.groupType && !/관리/.test(row.groupType)) {
                    changes.push(`[${group.subType}] "${nm}" groupType: "${row.groupType}" → "관리비"`);
                    group.rows[row._idx].groupType = '관리비';
                }

                // === 이슈 표시 ===
                if (row.price === 0) flags.push('🔴 0원');
                if (!row.feeType) flags.push('🟡 feeType없음');

                const prefix = hasTabs ? '      ' : '    ';
                const priceStr = (row.price ?? 0).toLocaleString();
                const flagStr = flags.length ? ` ${flags.join(' ')}` : '';
                console.log(`${prefix}${nm || '(없음)'} | ${row.grade || '-'} | ${priceStr}원 | ${row.feeType || '-'} | 거주:${row.residency || '-'} | 인원:${row.capacity || '-'}${flagStr}`);
            });
        });
    });

    // 저장
    if (changes.length > 0) {
        console.log(`\n  ✏️ ${changes.length}건 자동 수정:`);
        changes.forEach(c => console.log(`    ${c}`));

        pi.standardizedPrices = sp;
        const { error: ue } = await sb.from('Facility').update({ pricing: pi }).eq('id', id);
        console.log(ue ? `  ❌ 저장 실패: ${ue.message}` : `  ✅ 저장 완료`);
    } else {
        console.log(`\n  ✅ 수정사항 없음`);
    }
}

reviewAndFix(TARGET_ID);
