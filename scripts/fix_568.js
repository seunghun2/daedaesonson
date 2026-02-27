const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const p = data.find(x => x.id === 'park-0568');

// 공식 사이트 기준 재구성
// 일반실 1층: A형(2~7단), B형(1,8단), C형(9~11단)
// 고급실 2층: A형(2~6단), B형(1,7단), C형(8,9단)
// 관리비: 연 50,000 (선납 할인)
// 기간: 1, 3, 10, 30, 60, 100년

p.priceInfo.standardizedPrices = [
    // ===== 일반실 1층 =====
    {
        serviceType: 'BONGSAN', subType: '일반실 A형(2~7단)',
        rows: [
            { name: '1년', price: 150000, feeType: 'USAGE', groupType: '일반실A형', isRepresentative: true },
            { name: '3년', price: 300000, feeType: 'USAGE', groupType: '일반실A형' },
            { name: '10년', price: 650000, feeType: 'USAGE', groupType: '일반실A형' },
            { name: '30년', price: 1600000, feeType: 'USAGE', groupType: '일반실A형' },
            { name: '60년', price: 2500000, feeType: 'USAGE', groupType: '일반실A형' },
            { name: '100년', price: 4000000, feeType: 'USAGE', groupType: '일반실A형' },
            { name: '관리비(연)', price: 50000, feeType: 'MAINTENANCE' },
        ]
    },
    {
        serviceType: 'BONGSAN', subType: '일반실 B형(1,8단)',
        rows: [
            { name: '1년', price: 100000, feeType: 'USAGE', groupType: '일반실B형' },
            { name: '3년', price: 200000, feeType: 'USAGE', groupType: '일반실B형' },
            { name: '10년', price: 450000, feeType: 'USAGE', groupType: '일반실B형' },
            { name: '30년', price: 1000000, feeType: 'USAGE', groupType: '일반실B형' },
            { name: '60년', price: 1700000, feeType: 'USAGE', groupType: '일반실B형' },
            { name: '100년', price: 2700000, feeType: 'USAGE', groupType: '일반실B형' },
            { name: '관리비(연)', price: 50000, feeType: 'MAINTENANCE' },
        ]
    },
    {
        serviceType: 'BONGSAN', subType: '일반실 C형(9~11단)',
        rows: [
            { name: '1년', price: 70000, feeType: 'USAGE', groupType: '일반실C형' },
            { name: '3년', price: 140000, feeType: 'USAGE', groupType: '일반실C형' },
            { name: '10년', price: 300000, feeType: 'USAGE', groupType: '일반실C형' },
            { name: '30년', price: 600000, feeType: 'USAGE', groupType: '일반실C형' },
            { name: '60년', price: 900000, feeType: 'USAGE', groupType: '일반실C형' },
            { name: '100년', price: 1500000, feeType: 'USAGE', groupType: '일반실C형' },
            { name: '관리비(연)', price: 50000, feeType: 'MAINTENANCE' },
        ]
    },
    // ===== 고급실 2층 =====
    {
        serviceType: 'BONGSAN', subType: '고급실 A형(2~6단)',
        rows: [
            { name: '1년', price: 255000, feeType: 'USAGE', groupType: '고급실A형' },
            { name: '3년', price: 510000, feeType: 'USAGE', groupType: '고급실A형' },
            { name: '10년', price: 1105000, feeType: 'USAGE', groupType: '고급실A형' },
            { name: '30년', price: 2720000, feeType: 'USAGE', groupType: '고급실A형' },
            { name: '60년', price: 4250000, feeType: 'USAGE', groupType: '고급실A형' },
            { name: '100년', price: 6800000, feeType: 'USAGE', groupType: '고급실A형' },
            { name: '관리비(연)', price: 50000, feeType: 'MAINTENANCE' },
        ]
    },
    {
        serviceType: 'BONGSAN', subType: '고급실 B형(1,7단)',
        rows: [
            { name: '1년', price: 170000, feeType: 'USAGE', groupType: '고급실B형' },
            { name: '3년', price: 340000, feeType: 'USAGE', groupType: '고급실B형' },
            { name: '10년', price: 765000, feeType: 'USAGE', groupType: '고급실B형' },
            { name: '30년', price: 1700000, feeType: 'USAGE', groupType: '고급실B형' },
            { name: '60년', price: 2890000, feeType: 'USAGE', groupType: '고급실B형' },
            { name: '100년', price: 4590000, feeType: 'USAGE', groupType: '고급실B형' },
            { name: '관리비(연)', price: 50000, feeType: 'MAINTENANCE' },
        ]
    },
    {
        serviceType: 'BONGSAN', subType: '고급실 C형(8,9단)',
        rows: [
            { name: '1년', price: 119000, feeType: 'USAGE', groupType: '고급실C형' },
            { name: '3년', price: 238000, feeType: 'USAGE', groupType: '고급실C형' },
            { name: '10년', price: 510000, feeType: 'USAGE', groupType: '고급실C형' },
            { name: '30년', price: 1020000, feeType: 'USAGE', groupType: '고급실C형' },
            { name: '60년', price: 1530000, feeType: 'USAGE', groupType: '고급실C형' },
            { name: '100년', price: 2550000, feeType: 'USAGE', groupType: '고급실C형' },
            { name: '관리비(연)', price: 50000, feeType: 'MAINTENANCE' },
        ]
    },
];

console.log('✅ 568 상상추모공원 - 공식 사이트 기준 재구성:');
let total = 0;
p.priceInfo.standardizedPrices.forEach((s, i) => {
    console.log('  [' + i + '] ' + s.subType + ': ' + s.rows.length + '개');
    total += s.rows.length;
});
console.log('  총: ' + total + '개 (기존 18개 → ' + total + '개)');

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('💾 저장 완료');
