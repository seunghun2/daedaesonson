import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

const DRY_RUN = false;
const START_NUM = 2;   // park-0002부터
const END_NUM = 50;    // park-0050까지 (배치)

interface FixResult {
    id: string;
    name: string;
    changeCount: number;
    changes: string[];
    remainingIssues: string[];
}

async function fixFacility(id: string): Promise<FixResult | null> {
    const { data, error } = await sb.from('Facility').select('id, name, pricing, category').eq('id', id).single();
    if (error || !data) return null;

    const pi = typeof data.pricing === 'string' ? JSON.parse(data.pricing) : data.pricing;
    if (!pi?.standardizedPrices) return null;

    const sp = pi.standardizedPrices;
    const changes: string[] = [];
    const remainingIssues: string[] = [];

    sp.forEach((group: any) => {
        group.rows?.forEach((row: any) => {
            // 1. name/grade 공백 정리
            if (row.name && row.name !== row.name.trim()) {
                changes.push(`[${group.subType}] name 공백: "${row.name}" → "${row.name.trim()}"`);
                row.name = row.name.trim();
            }
            if (row.grade && row.grade !== row.grade.trim()) {
                changes.push(`[${group.subType}] grade 공백: "${row.grade}" → "${row.grade.trim()}"`);
                row.grade = row.grade.trim();
            }

            // 2. 관리비/관리료 → MAINTENANCE
            if (row.feeType === 'USAGE' && /관리비|관리료/.test(row.name || '')) {
                changes.push(`[${group.subType}] "${row.name}" feeType → MAINTENANCE`);
                row.feeType = 'MAINTENANCE';
            }

            // 3. capacity 자동 추출
            const nameText = row.name || '';
            if (!row.capacity) {
                if (/부부|합장/.test(nameText) && !/관리/.test(nameText)) {
                    changes.push(`[${group.subType}] "${row.name}" capacity → 부부`);
                    row.capacity = '부부';
                } else if (/가족/.test(nameText) && !/관리/.test(nameText)) {
                    changes.push(`[${group.subType}] "${row.name}" capacity → 가족`);
                    row.capacity = '가족';
                } else if (/개인|1인|단장/.test(nameText) && !/관리/.test(nameText)) {
                    changes.push(`[${group.subType}] "${row.name}" capacity → 개인`);
                    row.capacity = '개인';
                }
            }

            // 4. residency 자동 추출
            const allText = `${row.name || ''} ${row.grade || ''}`;
            if (!row.residency || row.residency === 'ALL') {
                if (/관내|시민|군민|구민/.test(allText) && !/관외/.test(allText)) {
                    changes.push(`[${group.subType}] "${row.name}" residency → LOCAL`);
                    row.residency = 'LOCAL';
                } else if (/관외/.test(allText) && !/관내/.test(allText)) {
                    changes.push(`[${group.subType}] "${row.name}" residency → NON_LOCAL`);
                    row.residency = 'NON_LOCAL';
                }
            }

            // 5. 기간 추출
            if (!row.duration && row.grade) {
                const durMatch = row.grade.match(/(\d+)\s*년/);
                if (durMatch && !/(안치|위|이후|이전|설치|준공)/.test(row.grade)) {
                    const dur = parseInt(durMatch[1]);
                    if (dur > 0 && dur <= 100) {
                        changes.push(`[${group.subType}] "${row.name}" duration → ${dur}년`);
                        row.duration = dur;
                        row.durationType = 'YEAR';
                    }
                }
                if (/영구/.test(row.grade) && !row.durationType) {
                    changes.push(`[${group.subType}] "${row.name}" durationType → PERMANENT`);
                    row.durationType = 'PERMANENT';
                }
            }

            // 6. 0원 체크 (남은 이슈로 기록)
            if (row.price === 0) {
                remainingIssues.push(`[${group.subType}/${row.groupType || '기본'}] "${row.name}" 0원`);
            }

            // 7. groupType이 있는 관리비를 별도 그룹으로 (관리비가 다른 관/실 groupType에 섞여있는 경우)
            if (/관리비|관리료/.test(row.name || '') && row.groupType && !/관리/.test(row.groupType)) {
                changes.push(`[${group.subType}] "${row.name}" groupType: "${row.groupType}" → "관리비"`);
                row.groupType = '관리비';
            }
        });
    });

    if (changes.length === 0 && remainingIssues.length === 0) return null;

    if (changes.length > 0 && !DRY_RUN) {
        pi.standardizedPrices = sp;
        const { error: updateError } = await sb
            .from('Facility')
            .update({ pricing: pi })
            .eq('id', id);
        if (updateError) {
            console.log(`  ❌ ${id} 저장 실패: ${updateError.message}`);
        }
    }

    return { id, name: data.name, changeCount: changes.length, changes, remainingIssues };
}

async function main() {
    console.log(`🚀 park-${String(START_NUM).padStart(4, '0')} ~ park-${String(END_NUM).padStart(4, '0')} 일괄 수정 ${DRY_RUN ? '(DRY RUN)' : '(실제 적용)'}\n`);

    let totalChanges = 0;
    let totalIssues = 0;
    let fixedCount = 0;
    const allRemaining: string[] = [];

    for (let i = START_NUM; i <= END_NUM; i++) {
        const id = `park-${String(i).padStart(4, '0')}`;
        const result = await fixFacility(id);

        if (result) {
            if (result.changeCount > 0) {
                fixedCount++;
                totalChanges += result.changeCount;
                console.log(`✏️ ${result.id} (${result.name}) — ${result.changeCount}건 수정`);
                result.changes.forEach(c => console.log(`   ${c}`));
            }
            if (result.remainingIssues.length > 0) {
                totalIssues += result.remainingIssues.length;
                result.remainingIssues.forEach(issue => {
                    allRemaining.push(`${result.id} (${result.name}): ${issue}`);
                });
            }
        }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 결과: ${fixedCount}개 시설 수정, 총 ${totalChanges}건 변경`);

    if (allRemaining.length > 0) {
        console.log(`\n⚠️ 수동 확인 필요 (0원 항목 등): ${allRemaining.length}건`);
        allRemaining.forEach(r => console.log(`  ${r}`));
    }
}

main();
