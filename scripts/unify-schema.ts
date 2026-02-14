import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
);

// ===== 통일 규칙 =====

// 1. 안치 단위 통일: 위/구 → 기
function normalizeCapacityUnit(text: string): string {
    return text.replace(/(\d+)\s*위/g, '$1기').replace(/(\d+)\s*구/g, '$1기');
}

// 2. 면적 단위 통일: 평/m2/m² → ㎡ (값도 변환)
function normalizeArea(value: number | undefined, unit: string | undefined): { area?: number; areaUnit?: string } {
    if (!value && !unit) return {};
    const v = value || 0;
    if (unit === 'PYEONG' || unit === '평') {
        return { area: Math.round(v * 3.3058 * 100) / 100, areaUnit: 'SQM' };
    }
    if (unit === 'm2' || unit === 'm²' || unit === '㎡' || unit === 'SQM') {
        return { area: v, areaUnit: 'SQM' };
    }
    return { area: v, areaUnit: unit || 'SQM' };
}

// 3. grade에서 기간 추출
function extractDuration(grade: string): { duration?: number; durationType?: string; cleaned: string } {
    let cleaned = grade;
    let duration: number | undefined;
    let durationType: string | undefined;

    // "영구안치", "영구", "영안"
    if (/영구|영안|무기한/.test(cleaned)) {
        duration = 0;
        durationType = 'PERMANENT';
        cleaned = cleaned.replace(/영구안치|영구|영안|무기한/g, '').trim();
    }

    // "30년", "15년", "사용기간:15년", "사용기간 : 15년"
    const durationMatch = cleaned.match(/(?:사용기간\s*[:：]?\s*)?(\d+)\s*년/);
    if (durationMatch && !duration) {
        const y = parseInt(durationMatch[1]);
        // 2000년 이상은 연도이지 기간이 아님
        if (y < 100) {
            duration = y;
            durationType = 'YEAR';
            // 매칭된 부분만 제거 (앞뒤 문맥은 유지)
            cleaned = cleaned.replace(durationMatch[0], '').trim();
        }
    }

    return { duration, durationType, cleaned };
}

// 4. grade에서 인원(용량) 추출
function extractCapacity(grade: string): { capacity?: string; cleaned: string } {
    let cleaned = grade;
    let capacity: string | undefined;

    // "부부" 먼저 체크 (개인보다 먼저)
    if (/부부|2인|2기안치|2위|합장/.test(cleaned)) {
        capacity = '부부';
        cleaned = cleaned
            .replace(/부부단?|2인안?치?|합장/g, '')
            .trim();
    }
    // "가족"
    else if (/가족|4인|4기|4위|대가족/.test(cleaned)) {
        capacity = '가족';
        cleaned = cleaned
            .replace(/대?가족형?|4인안?치?/g, '')
            .trim();
    }
    // "개인"
    else if (/^개인$|개인단?(?!장)|1인안치|1인$|1위$/.test(cleaned)) {
        capacity = '개인';
        cleaned = cleaned
            .replace(/개인단?|1인안?치?/g, '')
            .trim();
    }

    return { capacity, cleaned };
}

// 5. grade에서 관내/관외 추출
function extractResidency(grade: string): { residency?: string; cleaned: string } {
    let cleaned = grade;
    let residency: string | undefined;

    if (/기초생활수급|수급자/.test(cleaned)) {
        residency = 'LOW_INCOME';
        cleaned = cleaned.replace(/기초생활수급자?/g, '').trim();
    } else if (/국가보훈|유공자/.test(cleaned)) {
        residency = 'VETERAN';
        cleaned = cleaned.replace(/국가보훈대상자?|유공자/g, '').trim();
    } else if (/관외|타지역|비?거주자/.test(cleaned)) {
        residency = 'NON_RESIDENT';
        cleaned = cleaned.replace(/관외\s*(자격\s*)?|타지역|비거주자/g, '').trim();
    } else if (/관내|거주자|해당\s*(시|군|구)\s*민/.test(cleaned)) {
        residency = 'RESIDENT';
        cleaned = cleaned.replace(/관내\s*(자격\s*)?|거주자/g, '').trim();
    }

    return { residency, cleaned };
}

// 6. grade에서 면적 추출
function extractArea(grade: string): { area?: number; areaUnit?: string; cleaned: string } {
    let cleaned = grade;

    // "1평", "3.3㎡", "6.516㎡", "4.95㎡당", "3.3m2"
    const areaMatch = cleaned.match(/([\d.]+)\s*(평|㎡|m²|m2)\s*(당)?/);
    if (areaMatch) {
        const rawValue = parseFloat(areaMatch[1]);
        const rawUnit = areaMatch[2];
        cleaned = cleaned.replace(areaMatch[0], '').trim();

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

// 7. 안치 수량 추출 (grade에서 "1기", "4기", "8기" 등 숫자+기/위/구)
function extractQuantity(grade: string): { quantity?: number; cleaned: string } {
    let cleaned = grade;

    // "4기", "8위", "12기", "48기 이하" 등
    const qtyMatch = cleaned.match(/^(\d+)\s*(기|위|구)\s*(당|이하|이상)?$/);
    if (qtyMatch) {
        const qty = parseInt(qtyMatch[1]);
        cleaned = cleaned.replace(qtyMatch[0], '').trim();
        return { quantity: qty, cleaned };
    }

    // "1기당", "기당"
    const perMatch = cleaned.match(/^(\d*)\s*(기|위|구)당$/);
    if (perMatch) {
        const qty = perMatch[1] ? parseInt(perMatch[1]) : 1;
        cleaned = '';
        return { quantity: qty, cleaned };
    }

    return { cleaned };
}

// 8. name에서 비용유형 판별
function detectFeeType(name: string, grade: string): string {
    const combined = `${name} ${grade}`.toLowerCase();

    if (/관리비|관리료|유지비|연관리/.test(combined)) return 'MAINTENANCE';
    if (/석물비|석물|비석|상석|화병/.test(combined)) return 'STONE';
    if (/연장|재사용|갱신/.test(combined)) return 'EXTENSION';
    if (/제례|추모제|제사/.test(combined)) return 'RITUAL';
    if (/매장비|안장비|설치비/.test(combined)) return 'INSTALLATION';

    return 'USAGE';
}

// 9. grade 정리 (추출 후 남은 텍스트 클린업)
function cleanGrade(grade: string): string {
    let cleaned = grade;

    // 앞뒤 구두점/공백 제거
    cleaned = cleaned.replace(/^[\s,.:;·\-()（）\[\]]+|[\s,.:;·\-()（）\[\]]+$/g, '');

    // 연속 공백 제거
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    // 빈 괄호 제거
    cleaned = cleaned.replace(/\(\s*\)/g, '').trim();

    return cleaned;
}

// ===== 메인 프로세스 =====
async function unifySchema() {
    console.log('🔄 스키마 통일 시작...\n');

    // 전체 시설 로드
    let allFacilities: any[] = [];
    let from = 0;
    const PAGE_SIZE = 500;
    while (true) {
        const { data, error } = await supabase
            .from('Facility')
            .select('id, name, pricing')
            .range(from, from + PAGE_SIZE - 1);
        if (error) { console.error(error); break; }
        if (data) allFacilities.push(...data);
        if (!data || data.length < PAGE_SIZE) break;
        from += PAGE_SIZE;
    }

    console.log(`📦 전체 ${allFacilities.length}개 시설 로드\n`);

    let processed = 0;
    let updated = 0;
    let totalRowsProcessed = 0;
    let fieldExtracted = {
        duration: 0,
        capacity: 0,
        residency: 0,
        area: 0,
        feeType: 0,
        quantity: 0,
        gradeCleanup: 0,
    };

    const errors: string[] = [];
    const DRY_RUN = process.argv.includes('--dry-run');
    const VERBOSE = process.argv.includes('--verbose');
    const LIMIT = process.argv.includes('--limit')
        ? parseInt(process.argv[process.argv.indexOf('--limit') + 1])
        : Infinity;

    if (DRY_RUN) console.log('⚠️ DRY RUN 모드 - 실제 저장하지 않음\n');

    for (const facility of allFacilities) {
        if (processed >= LIMIT) break;
        if (!facility.pricing) continue;

        let parsed: any;
        try {
            parsed = typeof facility.pricing === 'string' ? JSON.parse(facility.pricing) : facility.pricing;
        } catch { continue; }

        const standardized = parsed?.standardizedPrices;
        if (!standardized || !Array.isArray(standardized) || standardized.length === 0) continue;

        processed++;
        let changed = false;

        for (const group of standardized) {
            // 그룹 레벨 unit 통일
            if (group.unit && group.unit !== '원') {
                const oldUnit = group.unit;
                group.unit = normalizeCapacityUnit(group.unit);
                if (oldUnit !== group.unit) changed = true;
            }

            for (const row of group.rows || []) {
                totalRowsProcessed++;
                const originalGrade = row.grade || '';
                let workingGrade = originalGrade;

                // === Step 1: grade에서 기간 추출 ===
                if (!row.duration && !row.durationType) {
                    const { duration, durationType, cleaned } = extractDuration(workingGrade);
                    if (duration !== undefined) {
                        row.duration = duration;
                        row.durationType = durationType;
                        workingGrade = cleaned;
                        fieldExtracted.duration++;
                        changed = true;
                    }
                }

                // === Step 2: grade에서 인원 추출 ===
                if (!row.capacity) {
                    const { capacity, cleaned } = extractCapacity(workingGrade);
                    if (capacity) {
                        row.capacity = capacity;
                        workingGrade = cleaned;
                        fieldExtracted.capacity++;
                        changed = true;
                    }
                }

                // === Step 3: grade에서 관내/관외 추출 ===
                if (!row.residency || row.residency === 'ALL') {
                    const { residency, cleaned } = extractResidency(workingGrade);
                    if (residency) {
                        row.residency = residency;
                        workingGrade = cleaned;
                        fieldExtracted.residency++;
                        changed = true;
                    }
                }

                // === Step 4: grade에서 면적 추출 ===
                if (!row.area && !row.areaUnit) {
                    const { area, areaUnit, cleaned } = extractArea(workingGrade);
                    if (area) {
                        row.area = area;
                        row.areaUnit = areaUnit;
                        workingGrade = cleaned;
                        fieldExtracted.area++;
                        changed = true;
                    }
                }

                // === Step 5: grade에서 안치 수량 추출 ===
                const { quantity, cleaned: afterQty } = extractQuantity(workingGrade);
                if (quantity) {
                    // 수량 정보는 note에 추가 (capacity와 다른 개념)
                    if (!row.note) row.note = `${quantity}기 기준`;
                    else if (!row.note.includes('기 기준')) row.note += ` (${quantity}기 기준)`;
                    workingGrade = afterQty;
                    fieldExtracted.quantity++;
                    changed = true;
                }

                // === Step 6: name에서 비용유형 판별 ===
                if (!row.feeType || row.feeType === 'USAGE') {
                    const detected = detectFeeType(row.name || '', workingGrade);
                    if (detected !== 'USAGE' && detected !== row.feeType) {
                        row.feeType = detected;
                        fieldExtracted.feeType++;
                        changed = true;
                    }
                }

                // === Step 7: 기존 면적 필드 단위 통일 ===
                if (row.area && row.areaUnit) {
                    const { area, areaUnit } = normalizeArea(row.area, row.areaUnit);
                    if (area !== row.area || areaUnit !== row.areaUnit) {
                        row.area = area;
                        row.areaUnit = areaUnit;
                        changed = true;
                    }
                }

                // === Step 8: grade 정리 ===
                const cleanedGrade = cleanGrade(workingGrade);
                if (cleanedGrade !== originalGrade) {
                    row.grade = cleanedGrade;
                    fieldExtracted.gradeCleanup++;
                    changed = true;
                }

                if (VERBOSE && changed && originalGrade) {
                    const extracted: string[] = [];
                    if (row.duration !== undefined) extracted.push(`기간:${row.duration}${row.durationType}`);
                    if (row.capacity) extracted.push(`인원:${row.capacity}`);
                    if (row.residency && row.residency !== 'ALL') extracted.push(`거주:${row.residency}`);
                    if (row.area) extracted.push(`면적:${row.area}${row.areaUnit}`);
                    if (extracted.length > 0) {
                        console.log(`  [${facility.name}] "${originalGrade}" → grade:"${cleanedGrade}" + ${extracted.join(', ')}`);
                    }
                }
            }
        }

        if (changed) {
            updated++;
            if (!DRY_RUN) {
                const newPricing = { ...parsed, standardizedPrices: standardized };
                const { error } = await supabase
                    .from('Facility')
                    .update({ pricing: JSON.stringify(newPricing) })
                    .eq('id', facility.id);
                if (error) {
                    errors.push(`${facility.name}: ${error.message}`);
                }
            }
        }

        if (processed % 100 === 0) {
            console.log(`   ... ${processed}개 처리 (${updated}개 업데이트)`);
        }
    }

    // ===== 결과 리포트 =====
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 스키마 통일 결과`);
    console.log('='.repeat(60));
    console.log(`  처리 시설: ${processed}개`);
    console.log(`  업데이트된 시설: ${updated}개`);
    console.log(`  총 행 처리: ${totalRowsProcessed}개`);
    console.log('');
    console.log(`  📌 추출된 필드:`);
    console.log(`    ⏳ 기간(duration): ${fieldExtracted.duration}개 행`);
    console.log(`    👥 인원(capacity): ${fieldExtracted.capacity}개 행`);
    console.log(`    🏠 거주구분(residency): ${fieldExtracted.residency}개 행`);
    console.log(`    📐 면적(area): ${fieldExtracted.area}개 행`);
    console.log(`    🔢 수량(quantity→note): ${fieldExtracted.quantity}개 행`);
    console.log(`    💰 비용유형(feeType): ${fieldExtracted.feeType}개 행`);
    console.log(`    📝 grade 정리: ${fieldExtracted.gradeCleanup}개 행`);

    if (errors.length > 0) {
        console.log(`\n  ❌ 오류 ${errors.length}개:`);
        errors.forEach(e => console.log(`    - ${e}`));
    }

    if (DRY_RUN) {
        console.log(`\n⚠️ DRY RUN 완료. 실제 저장하려면: npx tsx scripts/unify-schema.ts`);
    } else {
        console.log(`\n✅ 저장 완료!`);
    }
}

unifySchema().catch(console.error);
