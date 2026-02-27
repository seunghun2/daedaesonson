const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const p = data.find(x => x.id === 'park-0565');

// e하늘 이미지 기준 전체 재구성
// 무지개(지하1층): 1~4단 + 5단(추가)
// 봉화(지상3층): 1단, 2·7단, 3~7단, 4·5·6단
// 황제(지하5층): 1단, 2·8단, 5~7단, 4·5·6단
// 천상(지하5층): 로얄단 개인/부부
// 행복(지상1층): 1단, 2·7단, 3·6단, 4단, 5단

p.priceInfo.standardizedPrices = [
    // [0] 무지개(지하1층)
    {
        serviceType: 'BONGSAN',
        subType: '무지개(지하1층)',
        rows: [
            { name: '1단', price: 2000000, feeType: 'USAGE', groupType: '무지개', isRepresentative: true },
            { name: '2단', price: 2500000, feeType: 'USAGE', groupType: '무지개' },
            { name: '3·7단', price: 3500000, feeType: 'USAGE', groupType: '무지개' },
            { name: '4단', price: 4500000, feeType: 'USAGE', groupType: '무지개' },
            { name: '5단', price: 5500000, feeType: 'USAGE', groupType: '무지개' },
            { name: '5단(추가)', price: 5000000, feeType: 'USAGE', groupType: '무지개' },
        ]
    },
    // [1] 봉화(지상3층)
    {
        serviceType: 'BONGSAN',
        subType: '봉화(지상3층)',
        rows: [
            { name: '1단', price: 3000000, feeType: 'USAGE', groupType: '봉화' },
            { name: '2·7단', price: 4500000, feeType: 'USAGE', groupType: '봉화' },
            { name: '3~7단', price: 6000000, feeType: 'USAGE', groupType: '봉화' },
            { name: '4·5·6단', price: 7500000, feeType: 'USAGE', groupType: '봉화' },
        ]
    },
    // [2] 황제(지하5층)
    {
        serviceType: 'BONGSAN',
        subType: '황제(지하5층)',
        rows: [
            { name: '1단', price: 4500000, feeType: 'USAGE', groupType: '황제' },
            { name: '2·8단', price: 6000000, feeType: 'USAGE', groupType: '황제' },
            { name: '5~7단', price: 8500000, feeType: 'USAGE', groupType: '황제' },
            { name: '4·5·6단', price: 10000000, feeType: 'USAGE', groupType: '황제' },
        ]
    },
    // [3] 천상(지하5층) - VIP/로얄
    {
        serviceType: 'BONGSAN',
        subType: '천상(지하5층/VIP)',
        rows: [
            { name: '로얄단(개인)', price: 17500000, feeType: 'USAGE', groupType: '천상' },
            { name: '로얄단(부부)', price: 35000000, feeType: 'USAGE', groupType: '천상' },
        ]
    },
    // [4] 행복(지상1층)
    {
        serviceType: 'BONGSAN',
        subType: '행복(지상1층)',
        rows: [
            { name: '1단', price: 5500000, feeType: 'USAGE', groupType: '행복' },
            { name: '2·7단', price: 6500000, feeType: 'USAGE', groupType: '행복' },
            { name: '3·6단', price: 8500000, feeType: 'USAGE', groupType: '행복' },
            { name: '4단', price: 9500000, feeType: 'USAGE', groupType: '행복' },
            { name: '5단', price: 10000000, feeType: 'USAGE', groupType: '행복' },
        ]
    },
];

console.log('✅ 565 분당스카이캐슬 - 구역별 아코디언 재구성:');
let total = 0;
p.priceInfo.standardizedPrices.forEach((s, i) => {
    console.log('  [' + i + '] ' + s.subType + ': ' + s.rows.length + '개');
    total += s.rows.length;
});
console.log('  총: ' + total + '개 (기존 21개 → ' + total + '개)');

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('💾 저장 완료');
