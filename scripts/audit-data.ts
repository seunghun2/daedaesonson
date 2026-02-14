/**
 * 전체 데이터 감사(audit) 스크립트
 * 문제 있는 항목을 카테고리별로 분류해서 보여줌
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
);

interface Issue {
    facility: string;
    facilityId: string;
    group: string;
    rowName: string;
    issue: string;
    detail: string;
}

async function run() {
    let allFacilities: any[] = [];
    let from = 0;
    while (true) {
        const { data } = await supabase.from('Facility').select('id, name, pricing').range(from, from + 499);
        if (data) allFacilities.push(...data);
        if (!data || data.length < 500) break;
        from += 500;
    }

    console.log(`📦 ${allFacilities.length}개 시설 분석 중...\n`);
    const issues: Issue[] = [];

    for (const f of allFacilities) {
        if (!f.pricing) continue;
        let parsed: any;
        try { parsed = typeof f.pricing === 'string' ? JSON.parse(f.pricing) : f.pricing; } catch { continue; }
        const sp = parsed?.standardizedPrices;
        if (!sp || !Array.isArray(sp)) continue;

        for (const group of sp) {
            const st = group.serviceType || '?';
            for (const row of group.rows || []) {
                const grade = row.grade || '';
                const name = row.name || '';
                const text = `${name} ${grade}`;

                // 1) 거주구분 미세팅: grade/name에 관내/관외/시민/군민 키워드가 있는데 residency 없음
                if (!row.residency || row.residency === 'ALL') {
                    if (/관내|관외|[가-힣]+(군민|시민|구민|도민)|타\s*(시|도|지역)|거주/.test(text)) {
                        issues.push({ facility: f.name, facilityId: f.id, group: st, rowName: name, issue: 'RESIDENCY_MISSING', detail: `grade:"${grade}"` });
                    }
                }

                // 2) 면적값 있는데 단위 없음
                if (row.area && !row.areaUnit) {
                    issues.push({ facility: f.name, facilityId: f.id, group: st, rowName: name, issue: 'AREA_NO_UNIT', detail: `area:${row.area}` });
                }

                // 3) grade에 면적 숫자(㎡, 평)가 있는데 area 필드 미세팅
                if (!row.area && /\d+\.?\d*\s*(㎡|평|m2|제곱미터)/.test(grade)) {
                    issues.push({ facility: f.name, facilityId: f.id, group: st, rowName: name, issue: 'AREA_IN_GRADE', detail: `grade:"${grade}"` });
                }

                // 4) grade에 기간 정보가 있는데 duration 미세팅
                if (!row.duration && /\d+\s*년/.test(grade)) {
                    issues.push({ facility: f.name, facilityId: f.id, group: st, rowName: name, issue: 'DURATION_IN_GRADE', detail: `grade:"${grade}"` });
                }

                // 5) grade에 인원 정보가 있는데 capacity 미세팅
                if (!row.capacity && /(개인|부부|가족|1인|2인|단장|합장)/.test(grade)) {
                    issues.push({ facility: f.name, facilityId: f.id, group: st, rowName: name, issue: 'CAPACITY_IN_GRADE', detail: `grade:"${grade}"` });
                }

                // 6) feeType이 USAGE인데, name에 관리비/석물비 키워드
                if ((!row.feeType || row.feeType === 'USAGE') &&
                    /(관리비|석물비|연장|설치비|제례비|비석|상석)/.test(text)) {
                    issues.push({ facility: f.name, facilityId: f.id, group: st, rowName: name, issue: 'FEETYPE_WRONG', detail: `name:"${name}" feeType:${row.feeType || 'NONE'}` });
                }

                // 7) 단위 불일치 (봉안인데 위/구, 자연장인데 기/구, 매장인데 기/위)
                const unitMap: Record<string, string[]> = {
                    'BONGSAN': ['위', '구'],
                    'NATURAL': ['기', '구'],
                    'BURIAL': ['기', '위'],
                };
                const wrongUnits = unitMap[st];
                if (wrongUnits) {
                    for (const wu of wrongUnits) {
                        if (new RegExp(`\\d+\\s*${wu}`).test(text)) {
                            issues.push({ facility: f.name, facilityId: f.id, group: st, rowName: name, issue: 'UNIT_MISMATCH', detail: `"${text.match(new RegExp(`\\d+\\s*${wu}`))?.[0]}" in ${st}` });
                            break;
                        }
                    }
                }

                // 8) 가격이 0이거나 비정상
                if (row.price === 0) {
                    issues.push({ facility: f.name, facilityId: f.id, group: st, rowName: name, issue: 'ZERO_PRICE', detail: `price:0` });
                }

                // 9) 오타 패턴
                if (/기준명적|사용료료|관릴비/.test(text)) {
                    issues.push({ facility: f.name, facilityId: f.id, group: st, rowName: name, issue: 'TYPO', detail: `"${text}"` });
                }
            }
        }
    }

    // 카테고리별 집계
    const byCategory: Record<string, Issue[]> = {};
    for (const issue of issues) {
        (byCategory[issue.issue] ??= []).push(issue);
    }

    console.log('='.repeat(60));
    console.log('📊 데이터 감사 결과');
    console.log('='.repeat(60));

    for (const [cat, items] of Object.entries(byCategory).sort((a, b) => b[1].length - a[1].length)) {
        console.log(`\n🔸 ${cat} (${items.length}건)`);
        const show = items.slice(0, 5);
        for (const i of show) {
            console.log(`   [${i.facility}] ${i.rowName} → ${i.detail}`);
        }
        if (items.length > 5) console.log(`   ... 외 ${items.length - 5}건`);
    }

    console.log(`\n📋 총 ${issues.length}건의 문제 발견 (${Object.keys(byCategory).length}가지 유형)`);
}

run().catch(console.error);
