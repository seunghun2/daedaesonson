const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient('https://jbydmhfuqnpukfutvrgs.supabase.co', 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3');

    const p = data.find(x => x.id === 'park-0520');
    if (!p) { console.log('NOT FOUND'); return; }

    // 1층 프리미엄관
    const f1_indiv = [
        { name: '일반실 1단', price: 3500000, feeType: 'USAGE', isRepresentative: true, groupType: '일반실' },
        { name: '일반실 2단', price: 4500000, feeType: 'USAGE', groupType: '일반실' },
        { name: '일반실 3단', price: 5500000, feeType: 'USAGE', groupType: '일반실' },
        { name: '일반실 4단', price: 6500000, feeType: 'USAGE', groupType: '일반실' },
        { name: '일반실 5단', price: 7500000, feeType: 'USAGE', groupType: '일반실' },
        { name: '일반실 6단', price: 6500000, feeType: 'USAGE', groupType: '일반실' },
        { name: '일반실 7단', price: 5500000, feeType: 'USAGE', groupType: '일반실' },
        { name: '일반실 8단', price: 4500000, feeType: 'USAGE', groupType: '일반실' },
        { name: '고급실 1단', price: 4500000, feeType: 'USAGE', groupType: '고급실' },
        { name: '고급실 2단', price: 5500000, feeType: 'USAGE', groupType: '고급실' },
        { name: '고급실 3단', price: 6500000, feeType: 'USAGE', groupType: '고급실' },
        { name: '고급실 4단', price: 7500000, feeType: 'USAGE', groupType: '고급실' },
        { name: '고급실 5단', price: 8500000, feeType: 'USAGE', groupType: '고급실' },
        { name: '고급실 6단', price: 7500000, feeType: 'USAGE', groupType: '고급실' },
        { name: '고급실 7단', price: 6500000, feeType: 'USAGE', groupType: '고급실' },
        { name: '고급실 8단', price: 5500000, feeType: 'USAGE', groupType: '고급실' },
        { name: '관리비', price: 300000, feeType: 'MAINTENANCE', grade: '5년 일시납' },
    ];

    const f1_couple = [
        { name: '일반실 1단', price: 7000000, feeType: 'USAGE', groupType: '일반실' },
        { name: '일반실 2단', price: 9000000, feeType: 'USAGE', groupType: '일반실' },
        { name: '일반실 3단', price: 11000000, feeType: 'USAGE', groupType: '일반실' },
        { name: '일반실 4단', price: 13000000, feeType: 'USAGE', groupType: '일반실' },
        { name: '일반실 5단', price: 15000000, feeType: 'USAGE', groupType: '일반실' },
        { name: '일반실 6단', price: 13000000, feeType: 'USAGE', groupType: '일반실' },
        { name: '일반실 7단', price: 11000000, feeType: 'USAGE', groupType: '일반실' },
        { name: '일반실 8단', price: 9000000, feeType: 'USAGE', groupType: '일반실' },
        { name: '고급실 1단', price: 9000000, feeType: 'USAGE', groupType: '고급실' },
        { name: '고급실 2단', price: 11000000, feeType: 'USAGE', groupType: '고급실' },
        { name: '고급실 3단', price: 13000000, feeType: 'USAGE', groupType: '고급실' },
        { name: '고급실 4단', price: 15000000, feeType: 'USAGE', groupType: '고급실' },
        { name: '고급실 5단', price: 17000000, feeType: 'USAGE', groupType: '고급실' },
        { name: '고급실 6단', price: 15000000, feeType: 'USAGE', groupType: '고급실' },
        { name: '고급실 7단', price: 13000000, feeType: 'USAGE', groupType: '고급실' },
        { name: '고급실 8단', price: 11000000, feeType: 'USAGE', groupType: '고급실' },
        { name: '관리비', price: 600000, feeType: 'MAINTENANCE', grade: '5년 일시납' },
    ];

    // 2층 로얄관
    const f2_indiv = [
        { name: '1단', price: 3500000, feeType: 'USAGE', groupType: '정면' },
        { name: '2단', price: 4500000, feeType: 'USAGE', groupType: '정면' },
        { name: '3단', price: 5500000, feeType: 'USAGE', groupType: '정면' },
        { name: '4단', price: 6500000, feeType: 'USAGE', groupType: '정면' },
        { name: '5단', price: 7000000, feeType: 'USAGE', groupType: '정면' },
        { name: '6단', price: 6500000, feeType: 'USAGE', groupType: '정면' },
        { name: '7단', price: 5500000, feeType: 'USAGE', groupType: '정면' },
        { name: '8단', price: 4500000, feeType: 'USAGE', groupType: '정면' },
        { name: '1단', price: 2500000, feeType: 'USAGE', groupType: '측면' },
        { name: '2단', price: 3000000, feeType: 'USAGE', groupType: '측면' },
        { name: '3단', price: 4000000, feeType: 'USAGE', groupType: '측면' },
        { name: '4단', price: 5000000, feeType: 'USAGE', groupType: '측면' },
        { name: '5단', price: 6000000, feeType: 'USAGE', groupType: '측면' },
        { name: '6단', price: 6500000, feeType: 'USAGE', groupType: '측면' },
        { name: '7단', price: 6000000, feeType: 'USAGE', groupType: '측면' },
        { name: '8단', price: 5000000, feeType: 'USAGE', groupType: '측면' },
        { name: '관리비', price: 300000, feeType: 'MAINTENANCE', grade: '5년 일시납' },
    ];

    const f2_couple = [
        { name: '1단', price: 7000000, feeType: 'USAGE', groupType: '정면' },
        { name: '2단', price: 9000000, feeType: 'USAGE', groupType: '정면' },
        { name: '3단', price: 11000000, feeType: 'USAGE', groupType: '정면' },
        { name: '4단', price: 13000000, feeType: 'USAGE', groupType: '정면' },
        { name: '5단', price: 14000000, feeType: 'USAGE', groupType: '정면' },
        { name: '6단', price: 13000000, feeType: 'USAGE', groupType: '정면' },
        { name: '7단', price: 11000000, feeType: 'USAGE', groupType: '정면' },
        { name: '8단', price: 9000000, feeType: 'USAGE', groupType: '정면' },
        { name: '1단', price: 6000000, feeType: 'USAGE', groupType: '측면' },
        { name: '2단', price: 8000000, feeType: 'USAGE', groupType: '측면' },
        { name: '3단', price: 10000000, feeType: 'USAGE', groupType: '측면' },
        { name: '4단', price: 12000000, feeType: 'USAGE', groupType: '측면' },
        { name: '5단', price: 13000000, feeType: 'USAGE', groupType: '측면' },
        { name: '6단', price: 12000000, feeType: 'USAGE', groupType: '측면' },
        { name: '7단', price: 10000000, feeType: 'USAGE', groupType: '측면' },
        { name: '8단', price: 8000000, feeType: 'USAGE', groupType: '측면' },
        { name: '관리비', price: 600000, feeType: 'MAINTENANCE', grade: '5년 일시납' },
    ];

    p.priceInfo.standardizedPrices = [
        { serviceType: 'BONGSAN', subType: '1층 프리미엄관(개인)', unit: '원', rows: f1_indiv },
        { serviceType: 'BONGSAN', subType: '1층 프리미엄관(부부)', unit: '원', rows: f1_couple },
        { serviceType: 'BONGSAN', subType: '2층 로얄관(개인)', unit: '원', rows: f2_indiv },
        { serviceType: 'BONGSAN', subType: '2층 로얄관(부부)', unit: '원', rows: f2_couple },
    ];

    console.log('✅ 520 수불사추모공원 가격 데이터 입력 완료');
    console.log('  1층 프리미엄관(개인):', f1_indiv.length + '건');
    console.log('  1층 프리미엄관(부부):', f1_couple.length + '건');
    console.log('  2층 로얄관(개인):', f2_indiv.length + '건');
    console.log('  2층 로얄관(부부):', f2_couple.length + '건');

    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('💾 facilities.json 저장 완료');

    const { error } = await supabase
        .from('Facility')
        .update({ pricing: JSON.stringify(p.priceInfo) })
        .eq('id', 'park-0520');
    if (error) console.log('❌', error.message);
    else console.log('✅ DB 동기화: park-0520');
    console.log('✨ 완료!');
}
fix();
