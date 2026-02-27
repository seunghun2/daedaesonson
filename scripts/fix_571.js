const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const p = data.find(x => x.id === 'park-0571');

p.priceInfo.standardizedPrices = [
    {
        serviceType: 'BONGSAN', subType: '개인단(영구안치)',
        rows: [
            { name: '1단', price: 1700000, feeType: 'USAGE', groupType: '개인', isRepresentative: true },
            { name: '2단', price: 2000000, feeType: 'USAGE', groupType: '개인' },
            { name: '3단', price: 2500000, feeType: 'USAGE', groupType: '개인' },
            { name: '4단', price: 2800000, feeType: 'USAGE', groupType: '개인' },
            { name: '5단', price: 2800000, feeType: 'USAGE', groupType: '개인' },
            { name: '6단', price: 2800000, feeType: 'USAGE', groupType: '개인' },
            { name: '7단', price: 2500000, feeType: 'USAGE', groupType: '개인' },
            { name: '8단', price: 2500000, feeType: 'USAGE', groupType: '개인' },
            { name: '9단', price: 2000000, feeType: 'USAGE', groupType: '개인' },
            { name: '10단', price: 1500000, feeType: 'USAGE', groupType: '개인' },
            { name: '관리비(5년/3만×5년)', price: 150000, feeType: 'MAINTENANCE' },
        ]
    },
    {
        serviceType: 'BONGSAN', subType: '부부단(영구안치)',
        rows: [
            { name: '1단', price: 3400000, feeType: 'USAGE', groupType: '부부' },
            { name: '2단', price: 4000000, feeType: 'USAGE', groupType: '부부' },
            { name: '3단', price: 5000000, feeType: 'USAGE', groupType: '부부' },
            { name: '4단', price: 5600000, feeType: 'USAGE', groupType: '부부' },
            { name: '5단', price: 5600000, feeType: 'USAGE', groupType: '부부' },
            { name: '6단', price: 5600000, feeType: 'USAGE', groupType: '부부' },
            { name: '7단', price: 5000000, feeType: 'USAGE', groupType: '부부' },
            { name: '8단', price: 5000000, feeType: 'USAGE', groupType: '부부' },
            { name: '9단', price: 4000000, feeType: 'USAGE', groupType: '부부' },
            { name: '10단', price: 3000000, feeType: 'USAGE', groupType: '부부' },
            { name: '관리비(5년/3만×5년)', price: 150000, feeType: 'MAINTENANCE' },
        ]
    },
];

console.log('✅ 571 약사사 하늘재추모원 - 개인/부부 분리:');
let total = 0;
p.priceInfo.standardizedPrices.forEach((s, i) => {
    console.log('  [' + i + '] ' + s.subType + ': ' + s.rows.length + '개');
    total += s.rows.length;
});
console.log('  총: ' + total + '개 (기존 21개 → ' + total + '개)');

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('💾 저장 완료');
