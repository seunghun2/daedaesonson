const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const p = data.find(x => x.id === 'park-0570');

// 공식 사이트 기준 (peacepark.or.kr/cheongdo)
// 30년 이용기준 봉안공양금+관리비+추선금 합산 총액
// 30년 이후 재계약으로 연장 가능

p.priceInfo.standardizedPrices = [
    // [0] 개인단(1인)
    {
        serviceType: 'BONGSAN', subType: '개인단(1인)',
        rows: [
            { name: '1단', price: 1300000, feeType: 'USAGE', groupType: '개인', isRepresentative: true },
            { name: '2단', price: 1800000, feeType: 'USAGE', groupType: '개인' },
            { name: '3단', price: 2300000, feeType: 'USAGE', groupType: '개인' },
            { name: '4단', price: 2400000, feeType: 'USAGE', groupType: '개인' },
            { name: '5단', price: 2600000, feeType: 'USAGE', groupType: '개인' },
            { name: '6단', price: 2600000, feeType: 'USAGE', groupType: '개인' },
            { name: '7단', price: 2300000, feeType: 'USAGE', groupType: '개인' },
            { name: '8단', price: 1700000, feeType: 'USAGE', groupType: '개인' },
        ]
    },
    // [1] 부부단(2인)
    {
        serviceType: 'BONGSAN', subType: '부부단(2인)',
        rows: [
            { name: '1단', price: 2600000, feeType: 'USAGE', groupType: '부부' },
            { name: '2단', price: 3600000, feeType: 'USAGE', groupType: '부부' },
            { name: '3단', price: 4600000, feeType: 'USAGE', groupType: '부부' },
            { name: '4단', price: 4800000, feeType: 'USAGE', groupType: '부부' },
            { name: '5단', price: 5200000, feeType: 'USAGE', groupType: '부부' },
            { name: '6단', price: 5200000, feeType: 'USAGE', groupType: '부부' },
            { name: '7단', price: 4600000, feeType: 'USAGE', groupType: '부부' },
            { name: '8단', price: 3400000, feeType: 'USAGE', groupType: '부부' },
        ]
    },
    // [2] 가족단(4인)
    {
        serviceType: 'BONGSAN', subType: '가족단(4인)',
        rows: [
            { name: '1단', price: 6200000, feeType: 'USAGE', groupType: '가족' },
            { name: '2단', price: 6200000, feeType: 'USAGE', groupType: '가족' },
            { name: '3단', price: 9400000, feeType: 'USAGE', groupType: '가족' },
            { name: '4단', price: 9400000, feeType: 'USAGE', groupType: '가족' },
            { name: '5단', price: 10400000, feeType: 'USAGE', groupType: '가족' },
            { name: '6단', price: 10400000, feeType: 'USAGE', groupType: '가족' },
            { name: '7단', price: 8000000, feeType: 'USAGE', groupType: '가족' },
            { name: '8단', price: 8000000, feeType: 'USAGE', groupType: '가족' },
        ]
    },
];

console.log('✅ 570 한국SGI청도평화공원 - 공식 사이트 기준:');
let total = 0;
p.priceInfo.standardizedPrices.forEach((s, i) => {
    console.log('  [' + i + '] ' + s.subType + ': ' + s.rows.length + '개');
    total += s.rows.length;
});
console.log('  총: ' + total + '개 (기존 1개 → ' + total + '개)');
console.log('  ※ 30년 이용기준 총액 (봉안공양금+관리비+추선금)');

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('💾 저장 완료');
