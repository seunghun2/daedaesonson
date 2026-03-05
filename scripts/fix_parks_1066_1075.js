const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const supabase = createClient('https://jbydmhfuqnpukfutvrgs.supabase.co', 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3');
const fp = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
const updated = [];

function u(id, sp) {
    const p = data.find(x => x.id === id);
    if (!p) { console.log('⚠️ NOT FOUND:', id); return; }
    if (!p.priceInfo) p.priceInfo = {};
    p.priceInfo.standardizedPrices = sp;
    updated.push(id);
    console.log('✅', id, p.name);
}

const INQ = (sub) => [{ serviceType: 'BONGSAN', subType: sub, unit: '원', rows: [{ name: sub, price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true }] }];

// 1066~1074: 전부 가격 없음 → 시설문의
u('park-1066', INQ('봉안당'));
u('park-1067', INQ('봉안당'));
u('park-1068', INQ('봉안당'));
u('park-1069', INQ('봉안당'));
u('park-1070', INQ('봉안당'));
u('park-1071', INQ('봉안당'));
u('park-1072', INQ('봉안당'));
u('park-1073', INQ('봉안당'));
u('park-1074', INQ('봉안당'));

// 1075: 천주교 춘천교구 부활성당 추모관 - 이미 데이터 있음, grade로 개인/부부 구분 추가
u('park-1075', [{
    serviceType: 'BONGSAN', subType: '봉안당', unit: '원',
    rows: [
        // 개인
        { name: '1단', price: 3150000, feeType: 'USAGE', grade: '개인', isRepresentative: true },
        { name: '2단', price: 3650000, feeType: 'USAGE', grade: '개인' },
        { name: '3단', price: 4150000, feeType: 'USAGE', grade: '개인' },
        { name: '4단', price: 4150000, feeType: 'USAGE', grade: '개인' },
        { name: '5단', price: 4150000, feeType: 'USAGE', grade: '개인' },
        { name: '6단', price: 3650000, feeType: 'USAGE', grade: '개인' },
        { name: '7단', price: 3150000, feeType: 'USAGE', grade: '개인' },
        // 부부
        { name: '1단', price: 6300000, feeType: 'USAGE', grade: '부부' },
        { name: '2단', price: 7300000, feeType: 'USAGE', grade: '부부' },
        { name: '3단', price: 8300000, feeType: 'USAGE', grade: '부부' },
        { name: '4단', price: 8300000, feeType: 'USAGE', grade: '부부' },
        { name: '5단', price: 8300000, feeType: 'USAGE', grade: '부부' },
        { name: '6단', price: 7300000, feeType: 'USAGE', grade: '부부' },
        { name: '7단', price: 6300000, feeType: 'USAGE', grade: '부부' },
    ]
}]);

fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
console.log('\n📁 facilities.json 저장');

(async () => {
    for (const id of updated) {
        const f = data.find(d => d.id === id);
        const { error } = await supabase.from('Facility').update({ pricing: JSON.stringify(f.priceInfo) }).eq('id', id);
        console.log(error ? `❌ ${id} ${error.message}` : `🔄 ${id} → Supabase OK`);
    }
    console.log('\n🎉 1066-1075 완료!');
})();
