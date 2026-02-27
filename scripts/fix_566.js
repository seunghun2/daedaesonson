const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const p = data.find(x => x.id === 'park-0566');

// e하늘 이미지 기준
// 기간실(15년봉안), 일반실(영구봉안), 특별실(영구봉안)
// 부부단은 각 실별 개인단 금액의 2배
// 관리비: 1년/1기당 60,000원

p.priceInfo.standardizedPrices = [
    // [0] 기간실(15년)
    {
        serviceType: 'BONGSAN',
        subType: '기간실(15년)',
        rows: [
            { name: '1·8단', price: 1300000, feeType: 'USAGE', groupType: '기간실', isRepresentative: true },
            { name: '2·7단', price: 1800000, feeType: 'USAGE', groupType: '기간실' },
            { name: '3·6단', price: 2300000, feeType: 'USAGE', groupType: '기간실' },
            { name: '4단', price: 2500000, feeType: 'USAGE', groupType: '기간실' },
            { name: '5단', price: 3000000, feeType: 'USAGE', groupType: '기간실' },
            { name: '9단', price: 900000, feeType: 'USAGE', groupType: '기간실' },
            // 관리비
            { name: '관리비(연/1기당)', price: 60000, feeType: 'MAINTENANCE' },
        ]
    },
    // [1] 일반실(영구)
    {
        serviceType: 'BONGSAN',
        subType: '일반실(영구)',
        rows: [
            { name: '1·8단', price: 3000000, feeType: 'USAGE', groupType: '일반실' },
            { name: '2·7단', price: 3500000, feeType: 'USAGE', groupType: '일반실' },
            { name: '3·6단', price: 4000000, feeType: 'USAGE', groupType: '일반실' },
            { name: '4단', price: 4500000, feeType: 'USAGE', groupType: '일반실' },
            { name: '5단', price: 5000000, feeType: 'USAGE', groupType: '일반실' },
            { name: '9단', price: 2500000, feeType: 'USAGE', groupType: '일반실' },
            // 관리비
            { name: '관리비(연/1기당)', price: 60000, feeType: 'MAINTENANCE' },
        ]
    },
    // [2] 특별실(영구)
    {
        serviceType: 'BONGSAN',
        subType: '특별실(영구)',
        rows: [
            { name: '1·8단', price: 6000000, feeType: 'USAGE', groupType: '특별실' },
            { name: '2·7단', price: 7000000, feeType: 'USAGE', groupType: '특별실' },
            { name: '3·6단', price: 8000000, feeType: 'USAGE', groupType: '특별실' },
            { name: '4단', price: 8500000, feeType: 'USAGE', groupType: '특별실' },
            { name: '5단', price: 9000000, feeType: 'USAGE', groupType: '특별실' },
            { name: '9단', price: 5000000, feeType: 'USAGE', groupType: '특별실' },
            { name: '10단', price: 4000000, feeType: 'USAGE', groupType: '특별실' },
            { name: '11단', price: 3500000, feeType: 'USAGE', groupType: '특별실' },
            // 관리비
            { name: '관리비(연/1기당)', price: 60000, feeType: 'MAINTENANCE' },
        ]
    },
];

console.log('✅ 566 녹야원추모관 - 실별 아코디언 분리 + 관리비 수정:');
let total = 0;
p.priceInfo.standardizedPrices.forEach((s, i) => {
    const usage = s.rows.filter(r => r.feeType === 'USAGE').length;
    const mgmt = s.rows.filter(r => r.feeType === 'MAINTENANCE').length;
    console.log('  [' + i + '] ' + s.subType + ': 사용료 ' + usage + '개 + 관리비 ' + mgmt + '개');
    total += s.rows.length;
});
console.log('  총: ' + total + '개 (기존 21개 → ' + total + '개)');
console.log('  ※ 부부단 = 개인단 × 2배');

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('💾 저장 완료');
