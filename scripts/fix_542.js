const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const p = data.find(x => x.id === 'park-0542');

// 3개 카테고리를 각각 별도 standardizedPrices entry로 분리
p.priceInfo.standardizedPrices = [
    // [0] 봉안당
    {
        serviceType: 'BONGSAN',
        subType: '봉안당',
        rows: [
            { name: '최초사용료 (15년)', price: 326000, feeType: 'USAGE', groupType: '봉안당', isRepresentative: true },
            { name: '연장사용료 (1회/5년)', price: 85000, feeType: 'MAINTENANCE', groupType: '봉안당' },
        ]
    },
    // [1] 벽식봉안담
    {
        serviceType: 'BONGSAN',
        subType: '벽식봉안담',
        rows: [
            { name: '개인단 (사용료+관리비 15년)', price: 597000, feeType: 'USAGE', groupType: '개인단' },
            { name: '개인단 연장 (1회/5년)', price: 35000, feeType: 'MAINTENANCE', groupType: '개인단' },
            { name: '가족단 (사용료+관리비 15년)', price: 1194000, feeType: 'USAGE', groupType: '가족단' },
            { name: '가족단 연장 (1회/5년)', price: 70000, feeType: 'MAINTENANCE', groupType: '가족단' },
        ]
    },
    // [2] 가족봉안묘
    {
        serviceType: 'BONGSAN',
        subType: '가족봉안묘',
        rows: [
            { name: '4위용 (사용료+관리비 15년)', price: 1858000, feeType: 'USAGE', groupType: '4위용' },
            { name: '4위용 연장 (1회/5년)', price: 139000, feeType: 'MAINTENANCE', groupType: '4위용' },
            { name: '6위용 (사용료+관리비 15년)', price: 2787000, feeType: 'USAGE', groupType: '6위용' },
            { name: '6위용 연장 (1회/5년)', price: 209000, feeType: 'MAINTENANCE', groupType: '6위용' },
            { name: '12위용 (사용료+관리비 15년)', price: 5574000, feeType: 'USAGE', groupType: '12위용' },
            { name: '12위용 연장 (1회/5년)', price: 418000, feeType: 'MAINTENANCE', groupType: '12위용' },
        ]
    },
];

console.log('✅ 542 부산추모공원 구조 수정:');
p.priceInfo.standardizedPrices.forEach((s, i) => {
    console.log('  [' + i + '] ' + s.subType + ': ' + s.rows.length + '개');
    s.rows.forEach(r => console.log('      ' + r.name + ' = ' + r.price.toLocaleString()));
});

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('\n💾 저장 완료');
