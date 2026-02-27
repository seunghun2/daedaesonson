const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const p = data.find(x => x.id === 'park-0563');

// 전부 개인단. 연화실(일반)/화엄실(특별) 구분
// 관리비: 개인단=3만(연화실)/4만(화엄실), 가족단=6만(연화실)/8만(화엄실) 연
p.priceInfo.standardizedPrices = [
    // [0] 연화실(일반)
    {
        serviceType: 'BONGSAN',
        subType: '연화실(일반)',
        rows: [
            { name: '1단', price: 4200000, feeType: 'USAGE', groupType: '연화실', isRepresentative: true },
            { name: '2단', price: 4500000, feeType: 'USAGE', groupType: '연화실' },
            { name: '3단', price: 4800000, feeType: 'USAGE', groupType: '연화실' },
            { name: '4단', price: 5000000, feeType: 'USAGE', groupType: '연화실' },
            { name: '5단', price: 5200000, feeType: 'USAGE', groupType: '연화실' },
            { name: '6단', price: 5000000, feeType: 'USAGE', groupType: '연화실' },
            { name: '7단', price: 4800000, feeType: 'USAGE', groupType: '연화실' },
            { name: '8단', price: 4500000, feeType: 'USAGE', groupType: '연화실' },
            { name: '9단', price: 4200000, feeType: 'USAGE', groupType: '연화실' },
            { name: '정면창측 추가', price: 1000000, feeType: 'USAGE', groupType: '추가옵션' },
            // 관리비
            { name: '관리비(개인단 1위/연)', price: 30000, feeType: 'MAINTENANCE' },
            { name: '관리비(가족단/연)', price: 60000, feeType: 'MAINTENANCE' },
        ]
    },
    // [1] 화엄실(특별)
    {
        serviceType: 'BONGSAN',
        subType: '화엄실(특별)',
        rows: [
            { name: '1단', price: 5200000, feeType: 'USAGE', groupType: '화엄실' },
            { name: '2단', price: 5500000, feeType: 'USAGE', groupType: '화엄실' },
            { name: '3단', price: 5800000, feeType: 'USAGE', groupType: '화엄실' },
            { name: '4단', price: 6000000, feeType: 'USAGE', groupType: '화엄실' },
            { name: '5단', price: 6200000, feeType: 'USAGE', groupType: '화엄실' },
            { name: '6단', price: 6000000, feeType: 'USAGE', groupType: '화엄실' },
            { name: '7단', price: 5800000, feeType: 'USAGE', groupType: '화엄실' },
            { name: '8단', price: 5500000, feeType: 'USAGE', groupType: '화엄실' },
            { name: '9단', price: 5200000, feeType: 'USAGE', groupType: '화엄실' },
            { name: '정면창측 추가', price: 1000000, feeType: 'USAGE', groupType: '추가옵션' },
            // 관리비
            { name: '관리비(개인단 1위/연)', price: 40000, feeType: 'MAINTENANCE' },
            { name: '관리비(가족단/연)', price: 80000, feeType: 'MAINTENANCE' },
        ]
    },
];

console.log('✅ 563 극락사 안양원 - 연화실/화엄실 아코디언 분리:');
let total = 0;
p.priceInfo.standardizedPrices.forEach((s, i) => {
    const usage = s.rows.filter(r => r.feeType === 'USAGE').length;
    const mgmt = s.rows.filter(r => r.feeType === 'MAINTENANCE').length;
    console.log('  [' + i + '] ' + s.subType + ': 사용료 ' + usage + '개 + 관리비 ' + mgmt + '개');
    total += s.rows.length;
});
console.log('  총: ' + total + '개 (기존 23개 → ' + total + '개)');

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('💾 저장 완료');
