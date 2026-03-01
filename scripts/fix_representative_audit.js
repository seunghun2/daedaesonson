/**
 * park-0659 ~ park-0735 대표가격(isRepresentative) 전수 점검 v2
 * 
 * 개선사항: 대표가 후보에서 특수 항목 제외
 * - 무연고, 국가유공자, 독립유공자 → 특수 대상 할인가
 * - 추가, 연장 → 부가/갱신 비용
 * - 석물, 매장비, 작업비 → 부대비용 (feeType 무관하게 name 기준)
 * - 유골함 → 용기 비용
 * - 각지, 세라믹, 영정 → 부속품
 * - ㎡당, ㎡ → 단위가격 (총액 아님)
 * - 예약가 → 예약 할인가
 * 
 * 대표가 = "일반 이용자가 처음 분양받을 때 내는 핵심 사용료" 중 최저가
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// 대표가 후보에서 제외할 키워드
const EXCLUDE_KEYWORDS = [
    '무연고', '국가유공자', '독립유공자', '보훈',
    '추가', '연장',
    '석물', '매장비', '작업비', '설치비',
    '유골함',
    '각지', '세라믹', '영정',
    '㎡당', '㎡',
];

function isExcluded(name) {
    if (!name) return false;
    return EXCLUDE_KEYWORDS.some(kw => name.includes(kw));
}

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    const updates = [];

    let totalChecked = 0;
    let totalFixed = 0;

    for (let i = 659; i <= 735; i++) {
        const id = `park-0${i}`;
        const park = data.find(x => x.id === id);
        if (!park || !park.priceInfo || !park.priceInfo.standardizedPrices) continue;

        totalChecked++;
        const prices = park.priceInfo.standardizedPrices;
        const serviceTypes = [...new Set(prices.map(g => g.serviceType))];
        let needsFix = false;

        for (const st of serviceTypes) {
            const groups = prices.filter(g => g.serviceType === st);

            const allRows = [];
            for (const grp of groups) {
                for (const row of grp.rows) {
                    allRows.push({ row, grp });
                }
            }

            // 대표가 후보: USAGE이면서 특수항목이 아닌 것, 10만원 이상
            const candidates = allRows.filter(r =>
                r.row.feeType === 'USAGE' &&
                r.row.price &&
                r.row.price >= 100000 &&
                !isExcluded(r.row.name)
            );

            if (candidates.length === 0) continue;

            const minPrice = Math.min(...candidates.map(r => r.row.price));
            const minRow = candidates.find(r => r.row.price === minPrice);

            // 현재 isRepresentative 상태 확인
            const currentReps = allRows.filter(r => r.row.isRepresentative === true);

            // 현재 대표가 행이 제외 대상인지 체크
            const currentRepOnExcluded = currentReps.some(r => isExcluded(r.row.name));
            // 현재 대표가가 USAGE가 아닌지 체크
            const currentRepNotUsage = currentReps.some(r => r.row.feeType !== 'USAGE');

            if (currentReps.length === 0) {
                // 대표가 없음 → 최저 후보에 설정
                minRow.row.isRepresentative = true;
                needsFix = true;
                console.log(`  ⚠️  ${id} [${st}] 대표가 없음 → ${minRow.row.name} ${minPrice.toLocaleString()}원`);
            } else if (currentRepOnExcluded || currentRepNotUsage) {
                // 특수항목이나 비-USAGE에 설정됨 → 수정
                for (const r of currentReps) delete r.row.isRepresentative;
                minRow.row.isRepresentative = true;
                needsFix = true;
                const oldName = currentReps[0].row.name;
                const oldPrice = currentReps[0].row.price;
                console.log(`  🔧 ${id} [${st}] "${oldName}" ${oldPrice?.toLocaleString()}원(제외대상) → "${minRow.row.name}" ${minPrice.toLocaleString()}원`);
            } else {
                // 정상 USAGE에 설정됨 → 최저가인지만 체크
                const currentRepMin = Math.min(...currentReps.map(r => r.row.price));
                if (currentRepMin > minPrice) {
                    for (const r of currentReps) delete r.row.isRepresentative;
                    minRow.row.isRepresentative = true;
                    needsFix = true;
                    console.log(`  🔧 ${id} [${st}] ${currentRepMin.toLocaleString()}원 → ${minPrice.toLocaleString()}원 (${minRow.row.name})`);
                }
                // 이미 최저가면 OK
            }
        }

        if (needsFix) {
            totalFixed++;
            updates.push({ id, p: park });
        }
    }

    console.log(`\n📊 점검 결과: ${totalChecked}개 공원 점검, ${totalFixed}개 수정`);

    if (updates.length === 0) {
        console.log('✅ 수정 불필요');
        return;
    }

    // 저장
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('💾 저장 완료');

    // Supabase 동기화
    for (const u of updates) {
        const ud = { pricing: JSON.stringify(u.p.priceInfo) };
        const { error } = await supabase.from('Facility').update(ud).eq('id', u.id);
        if (error) console.log('❌', u.id, error.message);
        else console.log('☁️', u.id, 'Supabase 동기화 완료');
    }
}
fix();
