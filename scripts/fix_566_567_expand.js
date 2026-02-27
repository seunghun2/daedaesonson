const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
const { createClient } = require('@supabase/supabase-js');
const s = createClient('https://jbydmhfuqnpukfutvrgs.supabase.co', 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3');

// ===== 566 녹야원추모관 =====
const p566 = data.find(x => x.id === 'park-0566');
p566.priceInfo.standardizedPrices = [
    {
        serviceType: 'BONGSAN', subType: '기간실(15년)',
        rows: [
            { name: '1단', price: 1300000, feeType: 'USAGE', groupType: '기간실', isRepresentative: true },
            { name: '2단', price: 1800000, feeType: 'USAGE', groupType: '기간실' },
            { name: '3단', price: 2300000, feeType: 'USAGE', groupType: '기간실' },
            { name: '4단', price: 2500000, feeType: 'USAGE', groupType: '기간실' },
            { name: '5단', price: 3000000, feeType: 'USAGE', groupType: '기간실' },
            { name: '6단', price: 2300000, feeType: 'USAGE', groupType: '기간실' },
            { name: '7단', price: 1800000, feeType: 'USAGE', groupType: '기간실' },
            { name: '8단', price: 1300000, feeType: 'USAGE', groupType: '기간실' },
            { name: '9단', price: 900000, feeType: 'USAGE', groupType: '기간실' },
            { name: '관리비(연/1기당)', price: 60000, feeType: 'MAINTENANCE' },
        ]
    },
    {
        serviceType: 'BONGSAN', subType: '일반실(영구)',
        rows: [
            { name: '1단', price: 3000000, feeType: 'USAGE', groupType: '일반실' },
            { name: '2단', price: 3500000, feeType: 'USAGE', groupType: '일반실' },
            { name: '3단', price: 4000000, feeType: 'USAGE', groupType: '일반실' },
            { name: '4단', price: 4500000, feeType: 'USAGE', groupType: '일반실' },
            { name: '5단', price: 5000000, feeType: 'USAGE', groupType: '일반실' },
            { name: '6단', price: 4000000, feeType: 'USAGE', groupType: '일반실' },
            { name: '7단', price: 3500000, feeType: 'USAGE', groupType: '일반실' },
            { name: '8단', price: 3000000, feeType: 'USAGE', groupType: '일반실' },
            { name: '9단', price: 2500000, feeType: 'USAGE', groupType: '일반실' },
            { name: '관리비(연/1기당)', price: 60000, feeType: 'MAINTENANCE' },
        ]
    },
    {
        serviceType: 'BONGSAN', subType: '특별실(영구)',
        rows: [
            { name: '1단', price: 6000000, feeType: 'USAGE', groupType: '특별실' },
            { name: '2단', price: 7000000, feeType: 'USAGE', groupType: '특별실' },
            { name: '3단', price: 8000000, feeType: 'USAGE', groupType: '특별실' },
            { name: '4단', price: 8500000, feeType: 'USAGE', groupType: '특별실' },
            { name: '5단', price: 9000000, feeType: 'USAGE', groupType: '특별실' },
            { name: '6단', price: 8000000, feeType: 'USAGE', groupType: '특별실' },
            { name: '7단', price: 7000000, feeType: 'USAGE', groupType: '특별실' },
            { name: '8단', price: 6000000, feeType: 'USAGE', groupType: '특별실' },
            { name: '9단', price: 5000000, feeType: 'USAGE', groupType: '특별실' },
            { name: '10단', price: 4000000, feeType: 'USAGE', groupType: '특별실' },
            { name: '11단', price: 3500000, feeType: 'USAGE', groupType: '특별실' },
            { name: '관리비(연/1기당)', price: 60000, feeType: 'MAINTENANCE' },
        ]
    },
];

// ===== 567 한국SGI이천평화공원 (가족만 풀기) =====
const p567 = data.find(x => x.id === 'park-0567');
// 개인/부부는 이미 개별이므로 가족만 수정
p567.priceInfo.standardizedPrices[2] = {
    serviceType: 'BONGSAN', subType: '봉안당(가족)',
    rows: [
        { name: '1단', price: 2480000, feeType: 'USAGE', groupType: '가족' },
        { name: '2단', price: 2480000, feeType: 'USAGE', groupType: '가족' },
        { name: '3단', price: 5680000, feeType: 'USAGE', groupType: '가족' },
        { name: '4단', price: 5680000, feeType: 'USAGE', groupType: '가족' },
        { name: '5단', price: 6680000, feeType: 'USAGE', groupType: '가족' },
        { name: '6단', price: 6680000, feeType: 'USAGE', groupType: '가족' },
        { name: '7단', price: 4280000, feeType: 'USAGE', groupType: '가족' },
        { name: '8단', price: 4280000, feeType: 'USAGE', groupType: '가족' },
        { name: '관리비(4기/30년)', price: 1320000, feeType: 'MAINTENANCE' },
        { name: '추선금(4기/30년)', price: 2400000, feeType: 'ANCILLARY' },
    ]
};

// 저장
fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');

// 로그
console.log('✅ 566 녹야원추모관:');
p566.priceInfo.standardizedPrices.forEach((sec, i) => {
    console.log('  [' + i + '] ' + sec.subType + ': ' + sec.rows.length + '개');
});
console.log('✅ 567 봉안당(가족):');
console.log('  ' + p567.priceInfo.standardizedPrices[2].rows.length + '개 (1~8단 개별)');
console.log('💾 저장 완료');

// DB 동기화
Promise.all([
    s.from('Facility').update({ pricing: JSON.stringify(p566.priceInfo) }).eq('id', 'park-0566'),
    s.from('Facility').update({ pricing: JSON.stringify(p567.priceInfo) }).eq('id', 'park-0567'),
]).then(results => {
    results.forEach((r, i) => {
        const id = ['park-0566', 'park-0567'][i];
        if (r.error) console.log('❌ ' + id, r.error.message);
        else console.log('✅ ' + id + ' DB 동기화 완료');
    });
});
