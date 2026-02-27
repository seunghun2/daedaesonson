const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const p = data.find(x => x.id === 'park-0548');

// 개인/부부/가족 분리 + subType: 봉안당(기부회원)
p.priceInfo.standardizedPrices = [
    // [0] 개인
    {
        serviceType: 'BONGSAN',
        subType: '봉안당(기부회원/개인)',
        rows: [
            // 일반실
            { name: '9단', price: 1900000, feeType: 'USAGE', groupType: '일반실' },
            { name: '1단', price: 2000000, feeType: 'USAGE', groupType: '일반실' },
            { name: '8단', price: 2300000, feeType: 'USAGE', groupType: '일반실' },
            { name: '2단', price: 2400000, feeType: 'USAGE', groupType: '일반실' },
            { name: '7단', price: 2900000, feeType: 'USAGE', groupType: '일반실' },
            { name: '3·4·5·6단', price: 3200000, feeType: 'USAGE', groupType: '일반실' },
            // 특별실
            { name: '1·7단', price: 8000000, feeType: 'USAGE', groupType: '특별실' },
            { name: '2·6단', price: 8500000, feeType: 'USAGE', groupType: '특별실' },
            { name: '3·5단', price: 9000000, feeType: 'USAGE', groupType: '특별실' },
            { name: '4단', price: 9500000, feeType: 'USAGE', groupType: '특별실' },
            // 피에타실
            { name: '피에타실', price: 10000000, feeType: 'USAGE', groupType: '피에타실' },
            // 관리비
            { name: '관리비 일반실 (10년)', price: 500000, feeType: 'MAINTENANCE', groupType: '일반실' },
            { name: '관리비 특별실 (10년)', price: 600000, feeType: 'MAINTENANCE', groupType: '특별실' },
            { name: '관리비 피에타실 (10년)', price: 600000, feeType: 'MAINTENANCE', groupType: '피에타실' },
        ]
    },
    // [1] 부부
    {
        serviceType: 'BONGSAN',
        subType: '봉안당(기부회원/부부)',
        rows: [
            // 일반실
            { name: '9단', price: 3800000, feeType: 'USAGE', groupType: '일반실' },
            { name: '1단', price: 4000000, feeType: 'USAGE', groupType: '일반실' },
            { name: '8단', price: 4600000, feeType: 'USAGE', groupType: '일반실' },
            { name: '2단', price: 4800000, feeType: 'USAGE', groupType: '일반실' },
            { name: '7단', price: 5800000, feeType: 'USAGE', groupType: '일반실' },
            { name: '3·4·5·6단', price: 6400000, feeType: 'USAGE', groupType: '일반실' },
            // 특별실
            { name: '1·7단', price: 12000000, feeType: 'USAGE', groupType: '특별실' },
            { name: '2·6단', price: 12800000, feeType: 'USAGE', groupType: '특별실' },
            { name: '3·5단', price: 13500000, feeType: 'USAGE', groupType: '특별실' },
            { name: '4단', price: 14300000, feeType: 'USAGE', groupType: '특별실' },
            // 관리비
            { name: '관리비 일반실 (10년)', price: 1000000, feeType: 'MAINTENANCE', groupType: '일반실' },
            { name: '관리비 특별실 (10년)', price: 1200000, feeType: 'MAINTENANCE', groupType: '특별실' },
        ]
    },
    // [2] 가족실
    {
        serviceType: 'BONGSAN',
        subType: '봉안당(기부회원/가족)',
        rows: [
            { name: '3+4단 가족실', price: 27800000, feeType: 'USAGE', groupType: '가족실' },
            { name: '관리비 (10년)', price: 2400000, feeType: 'MAINTENANCE', groupType: '가족실' },
        ]
    },
];

console.log('✅ 548 천주교 비봉추모관 수정:');
let total = 0;
p.priceInfo.standardizedPrices.forEach((s, i) => {
    console.log('  [' + i + '] ' + s.subType + ': ' + s.rows.length + '개');
    total += s.rows.length;
});
console.log('  총: ' + total + '개');

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('💾 저장 완료');
