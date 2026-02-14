import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

const DRY_RUN = false; // true면 수정하지 않고 변경사항만 출력

async function fixFacility(id: string) {
    const { data, error } = await sb.from('Facility').select('*').eq('id', id).single();
    if (error || !data) { console.log(`Error: ${error?.message}`); return; }

    const pi = typeof data.pricing === 'string' ? JSON.parse(data.pricing) : data.pricing;
    if (!pi?.standardizedPrices) { console.log('No V2 data'); return; }

    console.log(`\n🔧 수정 시작: ${data.name} (${id})`);
    let changes = 0;
    const sp = pi.standardizedPrices;

    sp.forEach((group: any) => {
        group.rows?.forEach((row: any) => {
            // 1. 관리비인데 feeType이 USAGE인 경우 → MAINTENANCE
            if (row.feeType === 'USAGE' && /관리비|관리료/.test(row.name || '')) {
                console.log(`  ✏️ [${group.subType}] "${row.name}" feeType: USAGE → MAINTENANCE`);
                row.feeType = 'MAINTENANCE';
                changes++;
            }

            // 2. "부부"가 이름에 있는데 capacity 없는 경우
            if (!row.capacity && /부부/.test(row.name || '')) {
                console.log(`  ✏️ [${group.subType}] "${row.name}" capacity: (없음) → 부부`);
                row.capacity = '부부';
                changes++;
            }

            // 3. "가족"이 이름에 있는데 capacity 없는 경우
            if (!row.capacity && /가족/.test(row.name || '') && !/관리비/.test(row.name || '')) {
                console.log(`  ✏️ [${group.subType}] "${row.name}" capacity: (없음) → 가족`);
                row.capacity = '가족';
                changes++;
            }

            // 4. "개인"이 이름에 있는데 capacity 없는 경우
            if (!row.capacity && /개인|1인/.test(row.name || '')) {
                console.log(`  ✏️ [${group.subType}] "${row.name}" capacity: (없음) → 개인`);
                row.capacity = '개인';
                changes++;
            }

            // 5. name 앞뒤 공백 정리
            if (row.name && row.name !== row.name.trim()) {
                console.log(`  ✏️ [${group.subType}] name 공백정리: "${row.name}" → "${row.name.trim()}"`);
                row.name = row.name.trim();
                changes++;
            }

            // 6. grade 앞뒤 공백 정리
            if (row.grade && row.grade !== row.grade.trim()) {
                console.log(`  ✏️ [${group.subType}] grade 공백정리: "${row.grade}" → "${row.grade.trim()}"`);
                row.grade = row.grade.trim();
                changes++;
            }

            // 7. "관내" / "관외" 텍스트가 있는데 residency ALL인 경우
            const allText = `${row.name || ''} ${row.grade || ''}`;
            if ((!row.residency || row.residency === 'ALL') && /관내/.test(allText) && !/관외/.test(allText)) {
                console.log(`  ✏️ [${group.subType}] "${row.name}" residency: ALL → LOCAL`);
                row.residency = 'LOCAL';
                changes++;
            }
            if ((!row.residency || row.residency === 'ALL') && /관외/.test(allText) && !/관내/.test(allText)) {
                console.log(`  ✏️ [${group.subType}] "${row.name}" residency: ALL → NON_LOCAL`);
                row.residency = 'NON_LOCAL';
                changes++;
            }

            // 8. 기간 추출: "15년", "60년" 등
            if (!row.duration && row.grade) {
                const durMatch = row.grade.match(/(\d+)\s*년/);
                if (durMatch && !/(안치|이후|이전|설치)/.test(row.grade)) {
                    const dur = parseInt(durMatch[1]);
                    if (dur > 0 && dur <= 100) {
                        console.log(`  ✏️ [${group.subType}] "${row.name}" duration: ${dur}년`);
                        row.duration = dur;
                        row.durationType = 'YEAR';
                        changes++;
                    }
                }
            }
        });
    });

    // park-0001 specific: 관리비 groupType "1단" → "관리비"
    if (id === 'park-0001') {
        const bongsanGroup = sp.find((g: any) => g.serviceType === 'BONGSAN' && g.subType === '봉안당');
        if (bongsanGroup) {
            bongsanGroup.rows?.forEach((row: any) => {
                if (/관리비/.test(row.name) && row.groupType === '1단') {
                    console.log(`  ✏️ [봉안당] "${row.name}" groupType: "1단" → "관리비"`);
                    row.groupType = '관리비';
                    changes++;
                }
            });
        }

        // 가족형 → BURIAL로 이동 (가족형 매장묘는 자연장이 아님)
        const naturalFamilyIdx = sp.findIndex((g: any) => g.serviceType === 'NATURAL' && g.subType === '가족형');
        if (naturalFamilyIdx >= 0) {
            const familyGroup = sp[naturalFamilyIdx];
            const allBurial = familyGroup.rows.every((r: any) => /매장묘/.test(r.name || ''));
            if (allBurial) {
                console.log(`  ✏️ NATURAL/가족형 → BURIAL/가족형 (전부 매장묘 항목)`);
                familyGroup.serviceType = 'BURIAL';
                changes++;
            }
        }

        // 에덴관/루멘관 0원 항목 → 가격 확인 불가로 note 추가
        if (bongsanGroup) {
            bongsanGroup.rows?.forEach((row: any) => {
                if (row.groupType === '에덴관/루멘관' && row.price === 0 && !row.note) {
                    row.note = '가격 미확인 (원본 데이터 없음)';
                    changes++;
                }
            });
            if (changes > 0) console.log(`  ✏️ [봉안당] 에덴관/루멘관 0원 항목에 "가격 미확인" 노트 추가`);
        }
    }

    if (changes === 0) {
        console.log('  ✅ 수정사항 없음');
        return;
    }

    console.log(`\n  📝 총 ${changes}건 수정`);

    if (!DRY_RUN) {
        pi.standardizedPrices = sp;
        const { error: updateError } = await sb
            .from('Facility')
            .update({ pricing: pi })
            .eq('id', id);

        if (updateError) {
            console.log(`  ❌ 저장 실패: ${updateError.message}`);
        } else {
            console.log(`  ✅ DB 저장 완료`);
        }
    } else {
        console.log(`  ⏭️ DRY_RUN - 저장하지 않음`);
    }
}

fixFacility('park-0001');
