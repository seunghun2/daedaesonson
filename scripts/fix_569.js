const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const p = data.find(x => x.id === 'park-0569');

// 공식 사이트 기준 (단위: 만원)
// 개인단: 2,3동 / 4,5,6동
// 부부단: 1동 / 2,3동 / 4,5,6동
// 관리비: 5년 기준 25만원, 선납 원칙

p.priceInfo.standardizedPrices = [
    // [0] 개인단 2,3동
    {
        serviceType: 'BONGSAN', subType: '개인단(2,3동)',
        rows: [
            { name: '1단', price: 4500000, feeType: 'USAGE', groupType: '개인 2,3동', isRepresentative: true },
            { name: '2단', price: 5000000, feeType: 'USAGE', groupType: '개인 2,3동' },
            { name: '3단', price: 5500000, feeType: 'USAGE', groupType: '개인 2,3동' },
            { name: '4단', price: 6000000, feeType: 'USAGE', groupType: '개인 2,3동' },
            { name: '5단', price: 6000000, feeType: 'USAGE', groupType: '개인 2,3동' },
            { name: '6단', price: 5500000, feeType: 'USAGE', groupType: '개인 2,3동' },
        ]
    },
    // [1] 개인단 4,5,6동
    {
        serviceType: 'BONGSAN', subType: '개인단(4,5,6동)',
        rows: [
            { name: '1단', price: 3500000, feeType: 'USAGE', groupType: '개인 4,5,6동' },
            { name: '2단', price: 4000000, feeType: 'USAGE', groupType: '개인 4,5,6동' },
            { name: '3단', price: 4500000, feeType: 'USAGE', groupType: '개인 4,5,6동' },
            { name: '4단', price: 5000000, feeType: 'USAGE', groupType: '개인 4,5,6동' },
            { name: '5단', price: 5000000, feeType: 'USAGE', groupType: '개인 4,5,6동' },
            { name: '6단', price: 4500000, feeType: 'USAGE', groupType: '개인 4,5,6동' },
            { name: '7단', price: 4000000, feeType: 'USAGE', groupType: '개인 4,5,6동' },
            { name: '8단', price: 3500000, feeType: 'USAGE', groupType: '개인 4,5,6동' },
        ]
    },
    // [2] 부부단 1동
    {
        serviceType: 'BONGSAN', subType: '부부단(1동)',
        rows: [
            { name: '1단', price: 7000000, feeType: 'USAGE', groupType: '부부 1동' },
            { name: '2단', price: 8000000, feeType: 'USAGE', groupType: '부부 1동' },
            { name: '3단', price: 10000000, feeType: 'USAGE', groupType: '부부 1동' },
            { name: '4단', price: 10000000, feeType: 'USAGE', groupType: '부부 1동' },
            { name: '5단', price: 10000000, feeType: 'USAGE', groupType: '부부 1동' },
        ]
    },
    // [3] 부부단 2,3동
    {
        serviceType: 'BONGSAN', subType: '부부단(2,3동)',
        rows: [
            { name: '1단', price: 6500000, feeType: 'USAGE', groupType: '부부 2,3동' },
            { name: '2단', price: 7000000, feeType: 'USAGE', groupType: '부부 2,3동' },
            { name: '3단', price: 7500000, feeType: 'USAGE', groupType: '부부 2,3동' },
            { name: '4단', price: 8000000, feeType: 'USAGE', groupType: '부부 2,3동' },
            { name: '5단', price: 8000000, feeType: 'USAGE', groupType: '부부 2,3동' },
            { name: '6단', price: 7500000, feeType: 'USAGE', groupType: '부부 2,3동' },
        ]
    },
    // [4] 부부단 4,5,6동
    {
        serviceType: 'BONGSAN', subType: '부부단(4,5,6동)',
        rows: [
            { name: '1단', price: 5500000, feeType: 'USAGE', groupType: '부부 4,5,6동' },
            { name: '2단', price: 6000000, feeType: 'USAGE', groupType: '부부 4,5,6동' },
            { name: '3단', price: 6500000, feeType: 'USAGE', groupType: '부부 4,5,6동' },
            { name: '4단', price: 7000000, feeType: 'USAGE', groupType: '부부 4,5,6동' },
            { name: '5단', price: 7000000, feeType: 'USAGE', groupType: '부부 4,5,6동' },
            { name: '6단', price: 6500000, feeType: 'USAGE', groupType: '부부 4,5,6동' },
            { name: '7단', price: 6000000, feeType: 'USAGE', groupType: '부부 4,5,6동' },
            { name: '8단', price: 5500000, feeType: 'USAGE', groupType: '부부 4,5,6동' },
            // 관리비 (전체 공통)
            { name: '관리비(5년 선납)', price: 250000, feeType: 'MAINTENANCE', note: '5년 기준, 선납 원칙' },
        ]
    },
];

console.log('✅ 569 양주추모공원 - 공식 사이트 기준 재구성:');
let total = 0;
p.priceInfo.standardizedPrices.forEach((s, i) => {
    console.log('  [' + i + '] ' + s.subType + ': ' + s.rows.length + '개');
    total += s.rows.length;
});
console.log('  총: ' + total + '개');

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('💾 저장 완료');
