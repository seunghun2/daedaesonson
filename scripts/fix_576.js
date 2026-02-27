const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const p = data.find(x => x.id === 'park-0576');

// e하늘 이미지 기준 (가격 다름!)
// 1층 싱글단 / 1층 프리미엄단 — 아코디언 분리

p.priceInfo.standardizedPrices = [
    {
        serviceType: 'BONGSAN', subType: '싱글단(1층)',
        rows: [
            { name: '1단', price: 4000000, feeType: 'USAGE', groupType: '싱글단', isRepresentative: true },
            { name: '2단', price: 4800000, feeType: 'USAGE', groupType: '싱글단' },
            { name: '3단', price: 5500000, feeType: 'USAGE', groupType: '싱글단' },
            { name: '4단', price: 6500000, feeType: 'USAGE', groupType: '싱글단' },
            { name: '5단', price: 6500000, feeType: 'USAGE', groupType: '싱글단' },
            { name: '6단', price: 5500000, feeType: 'USAGE', groupType: '싱글단' },
            { name: '7단', price: 5200000, feeType: 'USAGE', groupType: '싱글단' },
            { name: '8단', price: 4500000, feeType: 'USAGE', groupType: '싱글단' },
            { name: '9단', price: 3800000, feeType: 'USAGE', groupType: '싱글단' },
            { name: '10단', price: 3000000, feeType: 'USAGE', groupType: '싱글단' },
        ]
    },
    {
        serviceType: 'BONGSAN', subType: '프리미엄단(1층)',
        rows: [
            { name: '1단', price: 8000000, feeType: 'USAGE', groupType: '프리미엄단' },
            { name: '2단', price: 9600000, feeType: 'USAGE', groupType: '프리미엄단' },
            { name: '3단', price: 11000000, feeType: 'USAGE', groupType: '프리미엄단' },
            { name: '4단', price: 13000000, feeType: 'USAGE', groupType: '프리미엄단' },
            { name: '5단', price: 13000000, feeType: 'USAGE', groupType: '프리미엄단' },
            { name: '6단', price: 11000000, feeType: 'USAGE', groupType: '프리미엄단' },
            { name: '7단', price: 10400000, feeType: 'USAGE', groupType: '프리미엄단' },
            { name: '8단', price: 9000000, feeType: 'USAGE', groupType: '프리미엄단' },
            { name: '9단', price: 7600000, feeType: 'USAGE', groupType: '프리미엄단' },
            { name: '10단', price: 6000000, feeType: 'USAGE', groupType: '프리미엄단' },
        ]
    },
];

console.log('✅ 576 자임추모공원 - 이미지 기준 가격 수정:');
let total = 0;
p.priceInfo.standardizedPrices.forEach((s, i) => {
    console.log('  [' + i + '] ' + s.subType + ': ' + s.rows.length + '개');
    total += s.rows.length;
});
console.log('  총: ' + total + '개 (기존 20개 → ' + total + '개)');

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('💾 저장 완료');
