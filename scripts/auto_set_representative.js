/**
 * 대표가격(★) 자동 설정 스크립트
 * 
 * 각 시설의 priceTable에서:
 * 1. 관리비/석물/부가 카테고리 건너뜀
 * 2. 각 카테고리(봉안당, 매장묘 등)에서 ★이 없으면
 * 3. 관리비 이름 포함 행 제외
 * 4. 사용료(비용유형) 우선, 없으면 전체 중 최저가에 ★ 찍기
 * 5. facilities.json 저장 + Supabase DB 업데이트
 */

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

// 제외할 카테고리명 패턴
const SKIP_CAT = /옵션|관리비|기타|공통|제외|석물|비고|안내|별도|설치|용역|부대|제례|조경|유품/;
// 제외할 행 이름 패턴
const SKIP_ROW = /관리비|관리|석물|작업|각자|제례|상석|비석|둘레석|걸방석|봉분|개장|전지|식재|판석|석등|석곽|갓|추가|유골함|대여|벌초|와비|표석|석화분|반환|환불|제거/;

async function main() {
    const data = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
    const facilities = data.facilities || data;

    let updated = 0;
    let skipped = 0;
    let alreadySet = 0;
    const changes = [];

    for (const f of facilities) {
        const pt = f.priceInfo?.priceTable || f.pricing;
        if (!pt) continue;

        let facilityChanged = false;

        for (const [catName, catData] of Object.entries(pt)) {
            if (SKIP_CAT.test(catName)) continue;
            const rows = catData.rows || [];
            if (rows.length === 0) continue;

            // 이미 ★ 있으면 스킵
            if (rows.some(r => r.isRepresentative)) {
                alreadySet++;
                continue;
            }

            // 관리비 행 제외한 유효 행
            const validRows = rows.filter((r, idx) => {
                if (SKIP_ROW.test(r.name || '')) return false;
                const price = Number(r.price);
                if (isNaN(price) || price <= 0) return false;
                return true;
            });

            if (validRows.length === 0) {
                skipped++;
                continue;
            }

            // 사용료 타입 우선
            const usageFeeRows = validRows.filter(r =>
                (r.feeType === 'USAGE' || r.feeType === '사용료' || (r.name || '').includes('사용료'))
            );
            const candidates = usageFeeRows.length > 0 ? usageFeeRows : validRows;

            // 최저가 찾기
            let minPrice = Infinity;
            let minIdx = -1;
            candidates.forEach(r => {
                const p = Number(r.price);
                if (p < minPrice) {
                    minPrice = p;
                    minIdx = rows.indexOf(r);
                }
            });

            if (minIdx >= 0) {
                rows[minIdx].isRepresentative = true;
                facilityChanged = true;
                const priceDisplay = minPrice >= 10000 ? Math.round(minPrice / 10000) + '만원' : minPrice + '원';
                changes.push(`${f.id} | ${f.name} | ${catName} → ${rows[minIdx].name} ${priceDisplay} ★`);
            }
        }

        if (facilityChanged) updated++;
    }

    console.log('=== 대표가격 자동 설정 결과 ===');
    console.log(`처리 시설: ${updated}개`);
    console.log(`이미 ★ 있음: ${alreadySet}개 카테고리`);
    console.log(`유효 데이터 없음 (스킵): ${skipped}개 카테고리`);
    console.log(`새로 ★ 설정: ${changes.length}건`);
    console.log('');

    if (changes.length === 0) {
        console.log('변경 사항 없음');
        return;
    }

    console.log('=== 변경 내역 (처음 30건) ===');
    changes.slice(0, 30).forEach(c => console.log('  ' + c));
    if (changes.length > 30) console.log(`  ... 외 ${changes.length - 30}건`);

    // facilities.json 저장
    fs.writeFileSync('data/facilities.json', JSON.stringify(data, null, 2));
    console.log('\n✅ facilities.json 저장 완료');

    // Supabase DB 업데이트
    console.log('\n=== Supabase DB 업데이트 시작 ===');
    let dbUpdated = 0;
    let dbErrors = 0;

    for (const f of facilities) {
        const pt = f.priceInfo?.priceTable || f.pricing;
        if (!pt) continue;

        // ★이 있는 카테고리가 하나라도 있는 시설만 업데이트
        let hasRep = false;
        for (const [catName, catData] of Object.entries(pt)) {
            if (SKIP_CAT.test(catName)) continue;
            if ((catData.rows || []).some(r => r.isRepresentative)) { hasRep = true; break; }
        }
        if (!hasRep) continue;

        // priceInfo 전체를 업데이트 (pricing JSON 컬럼)
        const { error } = await supabase
            .from('Facility')
            .update({ pricing: pt })
            .eq('id', f.id);

        if (error) {
            dbErrors++;
            if (dbErrors <= 5) console.error(`  ❌ ${f.id}: ${error.message}`);
        } else {
            dbUpdated++;
        }
    }

    console.log(`\n✅ DB 업데이트: ${dbUpdated}개 성공, ${dbErrors}개 실패`);
}

main().catch(console.error);
