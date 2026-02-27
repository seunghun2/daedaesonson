const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const p = data.find(x => x.id === 'park-0555');

// 공식 사이트 가격표 기준 전체 재구성
// 1봉안실 / 2봉안실 / VIP 3,5봉안실 / VIP 특실(3,5봉안실)
// 개인단/부부단 분리
// 관리비: 개인 년3만, 부부 년5만 (10년 선납)

p.priceInfo.standardizedPrices = [
    // [0] 개인
    {
        serviceType: 'BONGSAN',
        subType: '봉안당(개인)',
        rows: [
            // 1봉안실
            { name: '9단', price: 1000000, feeType: 'USAGE', groupType: '1봉안실' },
            { name: '8단', price: 1500000, feeType: 'USAGE', groupType: '1봉안실' },
            { name: '7단', price: 2000000, feeType: 'USAGE', groupType: '1봉안실' },
            { name: '6단', price: 3000000, feeType: 'USAGE', groupType: '1봉안실' },
            { name: '5단', price: 3000000, feeType: 'USAGE', groupType: '1봉안실' },
            { name: '4단', price: 3000000, feeType: 'USAGE', groupType: '1봉안실' },
            { name: '3단', price: 2000000, feeType: 'USAGE', groupType: '1봉안실' },
            { name: '2단', price: 1500000, feeType: 'USAGE', groupType: '1봉안실' },
            { name: '1단', price: 1000000, feeType: 'USAGE', groupType: '1봉안실', isRepresentative: true },
            // 2봉안실
            { name: '8단', price: 1500000, feeType: 'USAGE', groupType: '2봉안실' },
            { name: '7단', price: 2500000, feeType: 'USAGE', groupType: '2봉안실' },
            { name: '6단', price: 4000000, feeType: 'USAGE', groupType: '2봉안실' },
            { name: '5단', price: 5000000, feeType: 'USAGE', groupType: '2봉안실' },
            { name: '4단', price: 4000000, feeType: 'USAGE', groupType: '2봉안실' },
            { name: '3단', price: 3500000, feeType: 'USAGE', groupType: '2봉안실' },
            { name: '2단', price: 2500000, feeType: 'USAGE', groupType: '2봉안실' },
            { name: '1단', price: 2000000, feeType: 'USAGE', groupType: '2봉안실' },
            // VIP 3,5봉안실
            { name: '8단', price: 2000000, feeType: 'USAGE', groupType: 'VIP 3·5봉안실' },
            { name: '7단', price: 3500000, feeType: 'USAGE', groupType: 'VIP 3·5봉안실' },
            { name: '6단', price: 5000000, feeType: 'USAGE', groupType: 'VIP 3·5봉안실' },
            { name: '5단', price: 6000000, feeType: 'USAGE', groupType: 'VIP 3·5봉안실' },
            { name: '4단', price: 5000000, feeType: 'USAGE', groupType: 'VIP 3·5봉안실' },
            { name: '3단', price: 4000000, feeType: 'USAGE', groupType: 'VIP 3·5봉안실' },
            { name: '2단', price: 3000000, feeType: 'USAGE', groupType: 'VIP 3·5봉안실' },
            { name: '1단', price: 2000000, feeType: 'USAGE', groupType: 'VIP 3·5봉안실' },
            // VIP 특실
            { name: '7단', price: 4000000, feeType: 'USAGE', groupType: 'VIP 특실' },
            { name: '6단', price: 5500000, feeType: 'USAGE', groupType: 'VIP 특실' },
            { name: '5단', price: 6500000, feeType: 'USAGE', groupType: 'VIP 특실' },
            { name: '4단', price: 7000000, feeType: 'USAGE', groupType: 'VIP 특실' },
            { name: '3단', price: 6000000, feeType: 'USAGE', groupType: 'VIP 특실' },
            { name: '2단', price: 4000000, feeType: 'USAGE', groupType: 'VIP 특실' },
            { name: '1단', price: 3000000, feeType: 'USAGE', groupType: 'VIP 특실' },
            // 관리비 (연 3만, 10년 선납)
            { name: '관리비(연 3만원)', price: 30000, feeType: 'MAINTENANCE', paymentCycle: 'YEARLY' },
        ]
    },
    // [1] 부부
    {
        serviceType: 'BONGSAN',
        subType: '봉안당(부부)',
        rows: [
            // 1봉안실
            { name: '9단', price: 2000000, feeType: 'USAGE', groupType: '1봉안실' },
            { name: '8단', price: 3000000, feeType: 'USAGE', groupType: '1봉안실' },
            { name: '7단', price: 4000000, feeType: 'USAGE', groupType: '1봉안실' },
            { name: '6단', price: 6000000, feeType: 'USAGE', groupType: '1봉안실' },
            { name: '5단', price: 6000000, feeType: 'USAGE', groupType: '1봉안실' },
            { name: '4단', price: 6000000, feeType: 'USAGE', groupType: '1봉안실' },
            { name: '3단', price: 4000000, feeType: 'USAGE', groupType: '1봉안실' },
            { name: '2단', price: 3000000, feeType: 'USAGE', groupType: '1봉안실' },
            { name: '1단', price: 2000000, feeType: 'USAGE', groupType: '1봉안실' },
            // 2봉안실
            { name: '8단', price: 3000000, feeType: 'USAGE', groupType: '2봉안실' },
            { name: '7단', price: 5000000, feeType: 'USAGE', groupType: '2봉안실' },
            { name: '6단', price: 7000000, feeType: 'USAGE', groupType: '2봉안실' },
            { name: '5단', price: 9000000, feeType: 'USAGE', groupType: '2봉안실' },
            { name: '4단', price: 7000000, feeType: 'USAGE', groupType: '2봉안실' },
            { name: '3단', price: 6000000, feeType: 'USAGE', groupType: '2봉안실' },
            { name: '2단', price: 5000000, feeType: 'USAGE', groupType: '2봉안실' },
            { name: '1단', price: 4000000, feeType: 'USAGE', groupType: '2봉안실' },
            // VIP 3,5봉안실
            { name: '8단', price: 4000000, feeType: 'USAGE', groupType: 'VIP 3·5봉안실' },
            { name: '7단', price: 7000000, feeType: 'USAGE', groupType: 'VIP 3·5봉안실' },
            { name: '6단', price: 10000000, feeType: 'USAGE', groupType: 'VIP 3·5봉안실' },
            { name: '5단', price: 12000000, feeType: 'USAGE', groupType: 'VIP 3·5봉안실' },
            { name: '4단', price: 10000000, feeType: 'USAGE', groupType: 'VIP 3·5봉안실' },
            { name: '3단', price: 8000000, feeType: 'USAGE', groupType: 'VIP 3·5봉안실' },
            { name: '2단', price: 6000000, feeType: 'USAGE', groupType: 'VIP 3·5봉안실' },
            { name: '1단', price: 4000000, feeType: 'USAGE', groupType: 'VIP 3·5봉안실' },
            // VIP 특실
            { name: '7단', price: 8000000, feeType: 'USAGE', groupType: 'VIP 특실' },
            { name: '6단', price: 11000000, feeType: 'USAGE', groupType: 'VIP 특실' },
            { name: '5단', price: 13000000, feeType: 'USAGE', groupType: 'VIP 특실' },
            { name: '4단', price: 14000000, feeType: 'USAGE', groupType: 'VIP 특실' },
            { name: '3단', price: 12000000, feeType: 'USAGE', groupType: 'VIP 특실' },
            { name: '2단', price: 8000000, feeType: 'USAGE', groupType: 'VIP 특실' },
            { name: '1단', price: 6000000, feeType: 'USAGE', groupType: 'VIP 특실' },
            // 관리비 (연 5만, 10년 선납)
            { name: '관리비(연 5만원)', price: 50000, feeType: 'MAINTENANCE', paymentCycle: 'YEARLY' },
        ]
    },
];

console.log('✅ 555 청통추모관 - 공식 사이트 기준 전체 재구성:');
let total = 0;
p.priceInfo.standardizedPrices.forEach((s, i) => {
    const usage = s.rows.filter(r => r.feeType === 'USAGE').length;
    const mgmt = s.rows.filter(r => r.feeType === 'MAINTENANCE').length;
    console.log('  [' + i + '] ' + s.subType + ': 사용료 ' + usage + '개 + 관리비 ' + mgmt + '개');
    total += s.rows.length;
});
console.log('  총: ' + total + '개 (기존 25개 → ' + total + '개)');

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('💾 저장 완료');
