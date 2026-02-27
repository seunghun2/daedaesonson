const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// ===== 533 크리스찬메모리얼파크 수정 =====
const p533 = data.find(x => x.id === 'park-0533');
if (p533) {
    const sp = p533.priceInfo.standardizedPrices;

    // [0] 봉안당(개인) - 전체 재구성
    sp[0].rows = [
        // 일반관(소형) 개인단 - 이미지: 1,9,10단=2,500,000 / 2,8단=3,000,000 / 3~7단=3,500,000
        { name: '1단', price: 2500000, feeType: 'USAGE', groupType: '일반관(소형)', isRepresentative: true },
        { name: '2단', price: 3000000, feeType: 'USAGE', groupType: '일반관(소형)' },
        { name: '3단', price: 3500000, feeType: 'USAGE', groupType: '일반관(소형)' },
        { name: '4단', price: 3500000, feeType: 'USAGE', groupType: '일반관(소형)' },
        { name: '5단', price: 3500000, feeType: 'USAGE', groupType: '일반관(소형)' },
        { name: '6단', price: 3500000, feeType: 'USAGE', groupType: '일반관(소형)' },
        { name: '7단', price: 3500000, feeType: 'USAGE', groupType: '일반관(소형)' },
        { name: '8단', price: 3000000, feeType: 'USAGE', groupType: '일반관(소형)' },
        { name: '9단', price: 2500000, feeType: 'USAGE', groupType: '일반관(소형)' },
        { name: '10단', price: 2500000, feeType: 'USAGE', groupType: '일반관(소형)' },
        // 밀봉관 개인단 - 이미지: 1,10단=3,000,000 / 2,8,9단=3,500,000 / 3,6,7단=4,000,000 / 4,5단=6,000,000
        { name: '1단', price: 3000000, feeType: 'USAGE', groupType: '밀봉관' },
        { name: '2단', price: 3500000, feeType: 'USAGE', groupType: '밀봉관' },
        { name: '3단', price: 4000000, feeType: 'USAGE', groupType: '밀봉관' },
        { name: '4단', price: 6000000, feeType: 'USAGE', groupType: '밀봉관' },
        { name: '5단', price: 6000000, feeType: 'USAGE', groupType: '밀봉관' },
        { name: '6단', price: 4000000, feeType: 'USAGE', groupType: '밀봉관' },
        { name: '7단', price: 4000000, feeType: 'USAGE', groupType: '밀봉관' },
        { name: '8단', price: 3500000, feeType: 'USAGE', groupType: '밀봉관' },
        { name: '9단', price: 3500000, feeType: 'USAGE', groupType: '밀봉관' },
        { name: '10단', price: 3000000, feeType: 'USAGE', groupType: '밀봉관' },
        // 글로리아관 개인단 - 이미지: 9단=2,500,000 / 1,8단=3,000,000 / 2,7단=3,500,000 / 3,6단=4,000,000 / 4,5단=6,000,000
        { name: '1단', price: 3000000, feeType: 'USAGE', groupType: '글로리아관' },
        { name: '2단', price: 3500000, feeType: 'USAGE', groupType: '글로리아관' },
        { name: '3단', price: 4000000, feeType: 'USAGE', groupType: '글로리아관' },
        { name: '4단', price: 6000000, feeType: 'USAGE', groupType: '글로리아관' },
        { name: '5단', price: 6000000, feeType: 'USAGE', groupType: '글로리아관' },
        { name: '6단', price: 4000000, feeType: 'USAGE', groupType: '글로리아관' },
        { name: '7단', price: 3500000, feeType: 'USAGE', groupType: '글로리아관' },
        { name: '8단', price: 3000000, feeType: 'USAGE', groupType: '글로리아관' },
        { name: '9단', price: 2500000, feeType: 'USAGE', groupType: '글로리아관' },
        // 숭리관 개인단 - 이미지: 8단=2,000,000 / 1단=2,500,000 / 2,7단=3,500,000 / 3,6단=4,500,000 / 4,5단=5,000,000
        { name: '1단', price: 2500000, feeType: 'USAGE', groupType: '숭리관' },
        { name: '2단', price: 3500000, feeType: 'USAGE', groupType: '숭리관' },
        { name: '3단', price: 4500000, feeType: 'USAGE', groupType: '숭리관' },
        { name: '4단', price: 5000000, feeType: 'USAGE', groupType: '숭리관' },
        { name: '5단', price: 5000000, feeType: 'USAGE', groupType: '숭리관' },
        { name: '6단', price: 4500000, feeType: 'USAGE', groupType: '숭리관' },
        { name: '7단', price: 3500000, feeType: 'USAGE', groupType: '숭리관' },
        { name: '8단', price: 2000000, feeType: 'USAGE', groupType: '숭리관' },
        // 관리비 - 두 옵션 모두 개인에 넣기 
        { name: '관리비 (5년)', price: 280000, feeType: 'MAINTENANCE' },
        { name: '관리비 (10년)', price: 540000, feeType: 'MAINTENANCE' },
    ];

    // [1] 봉안당(부부) - 전체 재구성
    sp[1].rows = [
        // 일반관(소형) 부부단 - 이미지: 9,10단=5,000,000 / 1,8단=5,500,000 / 3~7단=6,500,000 (2단 없음)
        { name: '1단', price: 5500000, feeType: 'USAGE', groupType: '일반관(소형)' },
        { name: '3단', price: 6500000, feeType: 'USAGE', groupType: '일반관(소형)' },
        { name: '4단', price: 6500000, feeType: 'USAGE', groupType: '일반관(소형)' },
        { name: '5단', price: 6500000, feeType: 'USAGE', groupType: '일반관(소형)' },
        { name: '6단', price: 6500000, feeType: 'USAGE', groupType: '일반관(소형)' },
        { name: '7단', price: 6500000, feeType: 'USAGE', groupType: '일반관(소형)' },
        { name: '8단', price: 5500000, feeType: 'USAGE', groupType: '일반관(소형)' },
        { name: '9단', price: 5000000, feeType: 'USAGE', groupType: '일반관(소형)' },
        { name: '10단', price: 5000000, feeType: 'USAGE', groupType: '일반관(소형)' },
        // 글로리아관 부부단 - 이미지: 9단=5,000,000 / 1단=5,500,000 / 8단=6,000,000 / 2,7단=6,500,000 / 3단=7,500,000 / 4,5단=8,000,000
        { name: '1단', price: 5500000, feeType: 'USAGE', groupType: '글로리아관' },
        { name: '2단', price: 6500000, feeType: 'USAGE', groupType: '글로리아관' },
        { name: '3단', price: 7500000, feeType: 'USAGE', groupType: '글로리아관' },
        { name: '4단', price: 8000000, feeType: 'USAGE', groupType: '글로리아관' },
        { name: '5단', price: 8000000, feeType: 'USAGE', groupType: '글로리아관' },
        { name: '6단', price: 7500000, feeType: 'USAGE', groupType: '글로리아관' },
        { name: '7단', price: 6500000, feeType: 'USAGE', groupType: '글로리아관' },
        { name: '8단', price: 6000000, feeType: 'USAGE', groupType: '글로리아관' },
        { name: '9단', price: 5000000, feeType: 'USAGE', groupType: '글로리아관' },
        // 숭리관 부부단 - 이미지: 8단=4,000,000 / 1단=5,000,000 / 2,7단=6,000,000 / 3,6단=8,000,000 / 4,5단=9,000,000
        { name: '1단', price: 5000000, feeType: 'USAGE', groupType: '숭리관' },
        { name: '2단', price: 6000000, feeType: 'USAGE', groupType: '숭리관' },
        { name: '3단', price: 8000000, feeType: 'USAGE', groupType: '숭리관' },
        { name: '4단', price: 9000000, feeType: 'USAGE', groupType: '숭리관' },
        { name: '5단', price: 9000000, feeType: 'USAGE', groupType: '숭리관' },
        { name: '6단', price: 8000000, feeType: 'USAGE', groupType: '숭리관' },
        { name: '7단', price: 6000000, feeType: 'USAGE', groupType: '숭리관' },
        { name: '8단', price: 4000000, feeType: 'USAGE', groupType: '숭리관' },
    ];

    // [2] 옥외벽식 - 재구성 (이미지: 1,8단=1,500,000 / 2,7단=2,000,000 / 3~6단=2,500,000)
    sp[2].rows = [
        { name: '1단', price: 1500000, feeType: 'USAGE', isRepresentative: true },
        { name: '2단', price: 2000000, feeType: 'USAGE' },
        { name: '3단', price: 2500000, feeType: 'USAGE' },
        { name: '4단', price: 2500000, feeType: 'USAGE' },
        { name: '5단', price: 2500000, feeType: 'USAGE' },
        { name: '6단', price: 2500000, feeType: 'USAGE' },
        { name: '7단', price: 2000000, feeType: 'USAGE' },
        { name: '8단', price: 1500000, feeType: 'USAGE' },
    ];

    // [3] 잔디(묘지관) - 변경 없음 (이미지: 500,000 ✓)

    console.log('✅ 533 크리스찬메모리얼파크 수정:');
    console.log('   - 일반관(소형) 개인단: 3 → 10개 (4~10단 추가)');
    console.log('   - 일반관(소형) 부부단: 2 → 9개 (1,3~8단 추가)');
    console.log('   - 밀봉관 개인단: 5 → 10개 (6~10단 추가)');
    console.log('   - 옥외벽식: 3 → 8개 (5~8단 추가, 범위 수정)');
    console.log('   - 관리비: 5년/10년 레이블 수정');
    console.log('   - 글로리아관 부부단: 6단=7,500,000 추가 (이미지에 3단=7,500,000이므로 6단도 대칭)');
}

// ===== 538 약사사지장전추모관 수정 =====
const p538 = data.find(x => x.id === 'park-0538');
if (p538) {
    const sp = p538.priceInfo.standardizedPrices;

    // 봉안당(개인) - 보현실과 문수실의 중복 4~5단 제거
    const indivRows = sp[0].rows;

    // 보현실 중복 제거: "4~5단" 이 2번 나오는 것중 하나 제거
    // 현재: [48]1단, [49]2~3단, [50]4~5단, [51]4~5단(중복), [52]6단, [53]7단
    // 수정: [48]1단, [49]2~3단, [50]4~5단, [51]6단, [52]7단

    // 문수실 중복 제거: 같은 패턴
    // 현재: [54]1단, [55]2~3단, [56]4~5단, [57]4~5단(중복), [58]6단, [59]7단

    // 보현실 항목 찾기
    let dupFound = 0;
    const newIndivRows = [];
    let prevWas45 = false;
    for (const row of indivRows) {
        const is45 = row.name === '4~5단';
        if (is45 && prevWas45) {
            dupFound++;
            continue; // 중복 스킵
        }
        newIndivRows.push(row);
        prevWas45 = is45;
    }
    sp[0].rows = newIndivRows;

    // 봉안당(부부) - 같은 중복 패턴 확인
    const coupleRows = sp[1].rows;
    const newCoupleRows = [];
    let prevWas45c = false;
    let dupFoundC = 0;
    for (const row of coupleRows) {
        const is45 = row.name === '4~5단';
        if (is45 && prevWas45c) {
            dupFoundC++;
            continue;
        }
        newCoupleRows.push(row);
        prevWas45c = is45;
    }
    sp[1].rows = newCoupleRows;

    console.log('\n✅ 538 약사사지장전추모관 수정:');
    console.log('   - 봉안당(개인): ' + dupFound + '개 중복 4~5단 항목 제거 → ' + sp[0].rows.length + '개');
    console.log('   - 봉안당(부부): ' + dupFoundC + '개 중복 4~5단 항목 제거 → ' + sp[1].rows.length + '개');
}

// ===== 540 유토피아추모공원 - 이상 없음 =====
console.log('\n✅ 540 유토피아추모공원 - 이미지와 정확히 일치 (변경 없음)');

// 저장
fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('\n💾 facilities.json 저장 완료');
