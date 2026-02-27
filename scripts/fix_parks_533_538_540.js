const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient('https://jbydmhfuqnpukfutvrgs.supabase.co', 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3');
    const changed = [];

    // ── 533 크리스찬메모리얼파크 ──
    const p533 = data.find(x => x.id === 'park-0533');
    if (p533) {
        p533.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당(개인)', unit: '원',
                rows: [
                    // 일반관(소형) - 개인단
                    { name: '1단', price: 2500000, feeType: 'USAGE', isRepresentative: true, groupType: '일반관(소형)' },
                    { name: '2단', price: 3000000, feeType: 'USAGE', groupType: '일반관(소형)' },
                    { name: '3단', price: 3500000, feeType: 'USAGE', groupType: '일반관(소형)' },
                    // 밀봉관
                    { name: '1단', price: 3000000, feeType: 'USAGE', groupType: '밀봉관' },
                    { name: '2단', price: 3500000, feeType: 'USAGE', groupType: '밀봉관' },
                    { name: '3단', price: 4000000, feeType: 'USAGE', groupType: '밀봉관' },
                    { name: '4단', price: 6000000, feeType: 'USAGE', groupType: '밀봉관' },
                    { name: '5단', price: 6000000, feeType: 'USAGE', groupType: '밀봉관' },
                    // 글로리아관
                    { name: '9단', price: 2500000, feeType: 'USAGE', groupType: '글로리아관' },
                    { name: '1단', price: 3000000, feeType: 'USAGE', groupType: '글로리아관' },
                    { name: '8단', price: 3000000, feeType: 'USAGE', groupType: '글로리아관' },
                    { name: '2단', price: 3500000, feeType: 'USAGE', groupType: '글로리아관' },
                    { name: '7단', price: 3500000, feeType: 'USAGE', groupType: '글로리아관' },
                    { name: '3단', price: 4000000, feeType: 'USAGE', groupType: '글로리아관' },
                    { name: '6단', price: 4000000, feeType: 'USAGE', groupType: '글로리아관' },
                    { name: '4단', price: 6000000, feeType: 'USAGE', groupType: '글로리아관' },
                    { name: '5단', price: 6000000, feeType: 'USAGE', groupType: '글로리아관' },
                    // 숭리관
                    { name: '8단', price: 2000000, feeType: 'USAGE', groupType: '숭리관' },
                    { name: '1단', price: 2500000, feeType: 'USAGE', groupType: '숭리관' },
                    { name: '2단', price: 3500000, feeType: 'USAGE', groupType: '숭리관' },
                    { name: '7단', price: 3500000, feeType: 'USAGE', groupType: '숭리관' },
                    { name: '3단', price: 4500000, feeType: 'USAGE', groupType: '숭리관' },
                    { name: '6단', price: 4500000, feeType: 'USAGE', groupType: '숭리관' },
                    { name: '4단', price: 5000000, feeType: 'USAGE', groupType: '숭리관' },
                    { name: '5단', price: 5000000, feeType: 'USAGE', groupType: '숭리관' },
                    // 관리비
                    { name: '관리비 (5년)', price: 280000, feeType: 'MAINTENANCE' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '봉안당(부부)', unit: '원',
                rows: [
                    // 일반관(소형) - 부부단
                    { name: '9단', price: 5000000, feeType: 'USAGE', groupType: '일반관(소형)' },
                    { name: '10단', price: 5000000, feeType: 'USAGE', groupType: '일반관(소형)' },
                    // 글로리아관 부부
                    { name: '9단', price: 5000000, feeType: 'USAGE', groupType: '글로리아관' },
                    { name: '1단', price: 5500000, feeType: 'USAGE', groupType: '글로리아관' },
                    { name: '8단', price: 6000000, feeType: 'USAGE', groupType: '글로리아관' },
                    { name: '2단', price: 6500000, feeType: 'USAGE', groupType: '글로리아관' },
                    { name: '7단', price: 6500000, feeType: 'USAGE', groupType: '글로리아관' },
                    { name: '3단', price: 7500000, feeType: 'USAGE', groupType: '글로리아관' },
                    { name: '4단', price: 8000000, feeType: 'USAGE', groupType: '글로리아관' },
                    { name: '5단', price: 8000000, feeType: 'USAGE', groupType: '글로리아관' },
                    // 숭리관 부부
                    { name: '8단', price: 4000000, feeType: 'USAGE', groupType: '숭리관' },
                    { name: '1단', price: 5000000, feeType: 'USAGE', groupType: '숭리관' },
                    { name: '2단', price: 6000000, feeType: 'USAGE', groupType: '숭리관' },
                    { name: '7단', price: 6000000, feeType: 'USAGE', groupType: '숭리관' },
                    { name: '3단', price: 8000000, feeType: 'USAGE', groupType: '숭리관' },
                    { name: '6단', price: 8000000, feeType: 'USAGE', groupType: '숭리관' },
                    { name: '4단', price: 9000000, feeType: 'USAGE', groupType: '숭리관' },
                    { name: '5단', price: 9000000, feeType: 'USAGE', groupType: '숭리관' },
                    // 관리비
                    { name: '관리비 (5년)', price: 540000, feeType: 'MAINTENANCE' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '옥외벽식(야외봉안담)', unit: '원',
                rows: [
                    { name: '1단', price: 1500000, feeType: 'USAGE', isRepresentative: true },
                    { name: '2단', price: 2000000, feeType: 'USAGE' },
                    { name: '3~4단', price: 2500000, feeType: 'USAGE' },
                ]
            },
        ];
        // 잔디(묘지관) 추가
        p533.priceInfo.standardizedPrices.push({
            serviceType: 'BURIAL', subType: '잔디(묘지관)', unit: '원',
            rows: [
                { name: '잔디(묘지관)', price: 500000, feeType: 'USAGE', isRepresentative: true },
            ]
        });
        console.log('✅ 533 크리스찬메모리얼파크 → 전체 데이터 입력');
        changed.push('park-0533');
    }

    // ── 538 약사사지장전추모관 ──
    const p538 = data.find(x => x.id === 'park-0538');
    if (p538) {
        // 서비스 항목에 봉안당 데이터가 있음
        // 미타실, 정토실, 연화실, 금강실, 선재실, 반야실: 1~7단=3,000,000 / 8단=2,000,000
        // 보현실, 문수실: 개인단 + 부부단
        const rooms_1to7 = ['미타실', '정토실', '연화실', '금강실', '선재실', '반야실'];
        const indivRows = [];
        rooms_1to7.forEach(room => {
            for (let t = 1; t <= 7; t++) {
                indivRows.push({ name: t + '단', price: 3000000, feeType: 'USAGE', groupType: room });
            }
            indivRows.push({ name: '8단', price: 2000000, feeType: 'USAGE', groupType: room });
        });
        // 보현실 개인단
        [3500000, 4000000, 4500000, 4500000, 4000000, 3500000].forEach((p, i) => {
            indivRows.push({ name: (i === 0 ? '1' : i === 1 ? '2~3' : i === 2 ? '4~5' : i === 3 ? '4~5' : i === 4 ? '6' : '7') + '단', price: p, feeType: 'USAGE', groupType: '보현실' });
        });
        // 문수실 개인단
        [3500000, 4000000, 4500000, 4500000, 4000000, 3500000].forEach((p, i) => {
            indivRows.push({ name: (i === 0 ? '1' : i === 1 ? '2~3' : i === 2 ? '4~5' : i === 3 ? '4~5' : i === 4 ? '6' : '7') + '단', price: p, feeType: 'USAGE', groupType: '문수실' });
        });
        indivRows[0].isRepresentative = true;

        // 보현실/문수실 부부단
        const coupleRows = [];
        // 보현실 부부단
        [7000000, 8000000, 9000000, 9000000, 8000000, 7000000].forEach((p, i) => {
            coupleRows.push({ name: (i === 0 ? '1' : i === 1 ? '2~3' : i === 2 ? '4~5' : i === 3 ? '4~5' : i === 4 ? '6' : '7') + '단', price: p, feeType: 'USAGE', groupType: '보현실' });
        });
        // 문수실 부부단  
        [7000000, 8000000, 9000000, 9000000, 8000000, 7000000].forEach((p, i) => {
            coupleRows.push({ name: (i === 0 ? '1' : i === 1 ? '2~3' : i === 2 ? '4~5' : i === 3 ? '4~5' : i === 4 ? '6' : '7') + '단', price: p, feeType: 'USAGE', groupType: '문수실' });
        });

        p538.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당(개인)', unit: '원',
                rows: [
                    ...indivRows,
                    { name: '관리비 (1년/1위당)', price: 50000, feeType: 'MAINTENANCE' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '봉안당(부부)', unit: '원',
                rows: [
                    ...coupleRows,
                    { name: '관리비 (1년/1위당)', price: 50000, feeType: 'MAINTENANCE' },
                ]
            },
        ];
        console.log('✅ 538 약사사지장전추모관 → 전체 데이터 입력 (' + indivRows.length + '개인 + ' + coupleRows.length + '부부)');
        changed.push('park-0538');
    }

    // ── 540 유토피아추모공원(헤리티지관) ──
    const p540 = data.find(x => x.id === 'park-0540');
    if (p540) {
        p540.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당(개인)', unit: '원',
                rows: [
                    // 일반실 개인단
                    { name: '1단', price: 3000000, feeType: 'USAGE', isRepresentative: true, groupType: '일반실' },
                    { name: '2단', price: 4000000, feeType: 'USAGE', groupType: '일반실' },
                    { name: '3단', price: 5000000, feeType: 'USAGE', groupType: '일반실' },
                    { name: '4단', price: 6000000, feeType: 'USAGE', groupType: '일반실' },
                    { name: '5단', price: 7000000, feeType: 'USAGE', groupType: '일반실' },
                    { name: '6단', price: 6000000, feeType: 'USAGE', groupType: '일반실' },
                    { name: '7단', price: 4500000, feeType: 'USAGE', groupType: '일반실' },
                    { name: '8단', price: 3500000, feeType: 'USAGE', groupType: '일반실' },
                    // 고급실 개인단
                    { name: '1단', price: 5000000, feeType: 'USAGE', groupType: '고급실' },
                    { name: '2단', price: 6000000, feeType: 'USAGE', groupType: '고급실' },
                    { name: '3단', price: 8000000, feeType: 'USAGE', groupType: '고급실' },
                    { name: '4단', price: 9000000, feeType: 'USAGE', groupType: '고급실' },
                    { name: '5단', price: 10000000, feeType: 'USAGE', groupType: '고급실' },
                    { name: '6단', price: 7000000, feeType: 'USAGE', groupType: '고급실' },
                    { name: '7단', price: 5500000, feeType: 'USAGE', groupType: '고급실' },
                    // 관리비
                    { name: '관리비 (1기/5년)', price: 350000, feeType: 'MAINTENANCE', grade: '일반실' },
                    { name: '관리비 (1기/5년)', price: 450000, feeType: 'MAINTENANCE', grade: '고급실' },
                    // 유골실교체입관비
                    { name: '유골실교체입관비', price: 40000, feeType: 'USAGE' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '봉안당(부부)', unit: '원',
                rows: [
                    // 일반실 부부단
                    { name: '1단', price: 6000000, feeType: 'USAGE', groupType: '일반실' },
                    { name: '2단', price: 8000000, feeType: 'USAGE', groupType: '일반실' },
                    { name: '3단', price: 10000000, feeType: 'USAGE', groupType: '일반실' },
                    { name: '4단', price: 12000000, feeType: 'USAGE', groupType: '일반실' },
                    { name: '5단', price: 14000000, feeType: 'USAGE', groupType: '일반실' },
                    { name: '6단', price: 12000000, feeType: 'USAGE', groupType: '일반실' },
                    { name: '7단', price: 9000000, feeType: 'USAGE', groupType: '일반실' },
                    { name: '8단', price: 7000000, feeType: 'USAGE', groupType: '일반실' },
                    // 고급실 부부단
                    { name: '1단', price: 10000000, feeType: 'USAGE', groupType: '고급실' },
                    { name: '2단', price: 12000000, feeType: 'USAGE', groupType: '고급실' },
                    { name: '3단', price: 16000000, feeType: 'USAGE', groupType: '고급실' },
                    { name: '4단', price: 18000000, feeType: 'USAGE', groupType: '고급실' },
                    { name: '5단', price: 20000000, feeType: 'USAGE', groupType: '고급실' },
                    { name: '6단', price: 14000000, feeType: 'USAGE', groupType: '고급실' },
                    { name: '7단', price: 11000000, feeType: 'USAGE', groupType: '고급실' },
                    // 관리비
                    { name: '관리비 (1기/5년)', price: 350000, feeType: 'MAINTENANCE', grade: '일반실' },
                    { name: '관리비 (1기/5년)', price: 450000, feeType: 'MAINTENANCE', grade: '고급실' },
                    // 유골실교체입관비
                    { name: '유골실교체입관비', price: 40000, feeType: 'USAGE' },
                ]
            },
        ];
        // 임시안치
        p540.priceInfo.standardizedPrices[0].rows.push(
            { name: '임시안치 (4일/1년/5년/10년)', price: 0, feeType: 'USAGE' }
        );
        console.log('✅ 540 유토피아추모공원 → 전체 데이터 입력');
        changed.push('park-0540');
    }

    // 저장
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('\n💾 facilities.json 저장 완료');

    for (const id of changed) {
        const f = data.find(d => d.id === id);
        const { error } = await supabase
            .from('Facility')
            .update({ pricing: JSON.stringify(f.priceInfo) })
            .eq('id', id);
        if (error) console.log('❌', id, error.message);
        else console.log('✅ DB 동기화:', id);
    }
    console.log('✨ 완료!');
}
fix();
