const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const p = data.find(x => x.id === 'park-0549');

// e하늘 이미지 기준
// 일반 단장형(봉안담) 1~6층 + 관리비
// 일반 합장형(봉안담) 1~6층 + 관리비
// 재대릉 단장형(봉안담) 1~7층
// 재대릉 합장형(봉안담) 1~7층

p.priceInfo.standardizedPrices = [
    // [0] 단장형(개인)
    {
        serviceType: 'BONGSAN',
        subType: '봉안담(단장형)',
        rows: [
            // 일반
            { name: '1층', price: 1800000, feeType: 'USAGE', groupType: '일반', isRepresentative: true },
            { name: '2층', price: 1900000, feeType: 'USAGE', groupType: '일반' },
            { name: '3층', price: 2300000, feeType: 'USAGE', groupType: '일반' },
            { name: '4층', price: 2300000, feeType: 'USAGE', groupType: '일반' },
            { name: '5층', price: 1900000, feeType: 'USAGE', groupType: '일반' },
            { name: '6층', price: 1800000, feeType: 'USAGE', groupType: '일반' },
            { name: '관리비 (30년분)', price: 300000, feeType: 'MAINTENANCE', groupType: '일반' },
            // 재대릉
            { name: '1층', price: 3300000, feeType: 'USAGE', groupType: '재대릉' },
            { name: '2층', price: 3400000, feeType: 'USAGE', groupType: '재대릉' },
            { name: '3층', price: 4000000, feeType: 'USAGE', groupType: '재대릉' },
            { name: '4층', price: 4000000, feeType: 'USAGE', groupType: '재대릉' },
            { name: '5층', price: 4000000, feeType: 'USAGE', groupType: '재대릉' },
            { name: '6층', price: 3800000, feeType: 'USAGE', groupType: '재대릉' },
            { name: '7층', price: 3700000, feeType: 'USAGE', groupType: '재대릉' },
        ]
    },
    // [1] 합장형(부부)
    {
        serviceType: 'BONGSAN',
        subType: '봉안담(합장형)',
        rows: [
            // 일반
            { name: '1층', price: 3600000, feeType: 'USAGE', groupType: '일반' },
            { name: '2층', price: 3800000, feeType: 'USAGE', groupType: '일반' },
            { name: '3층', price: 4600000, feeType: 'USAGE', groupType: '일반' },
            { name: '4층', price: 4600000, feeType: 'USAGE', groupType: '일반' },
            { name: '5층', price: 3800000, feeType: 'USAGE', groupType: '일반' },
            { name: '6층', price: 3600000, feeType: 'USAGE', groupType: '일반' },
            { name: '관리비 (30년분)', price: 450000, feeType: 'MAINTENANCE', groupType: '일반' },
            // 재대릉
            { name: '1층', price: 6000000, feeType: 'USAGE', groupType: '재대릉' },
            { name: '2층', price: 6300000, feeType: 'USAGE', groupType: '재대릉' },
            { name: '3층', price: 7500000, feeType: 'USAGE', groupType: '재대릉' },
            { name: '4층', price: 7500000, feeType: 'USAGE', groupType: '재대릉' },
            { name: '5층', price: 7500000, feeType: 'USAGE', groupType: '재대릉' },
            { name: '6층', price: 7000000, feeType: 'USAGE', groupType: '재대릉' },
            { name: '7층', price: 6000000, feeType: 'USAGE', groupType: '재대릉' },
        ]
    },
];

console.log('✅ 549 천주교 서울대교구 평화묘원 봉안묘 전체 재구성:');
let total = 0;
p.priceInfo.standardizedPrices.forEach((s, i) => {
    console.log('  [' + i + '] ' + s.subType + ': ' + s.rows.length + '개');
    total += s.rows.length;
});
console.log('  총: ' + total + '개 (기존 1개 → ' + total + '개)');

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('💾 저장 완료');
