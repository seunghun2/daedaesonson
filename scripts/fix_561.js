const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const p = data.find(x => x.id === 'park-0561');

// 기존 데이터 정확. 개인/부부 아코디언 분리만
p.priceInfo.standardizedPrices = [
    // [0] 봉안당(개인)
    {
        serviceType: 'BONGSAN',
        subType: '봉안당(개인)',
        rows: [
            { name: '1단(최저단)', price: 1000000, feeType: 'USAGE', groupType: '개인', isRepresentative: true },
            { name: '2단', price: 2500000, feeType: 'USAGE', groupType: '개인' },
            { name: '3단', price: 3500000, feeType: 'USAGE', groupType: '개인' },
            { name: '4단', price: 5000000, feeType: 'USAGE', groupType: '개인' },
            { name: '5단', price: 5000000, feeType: 'USAGE', groupType: '개인' },
            { name: '6단', price: 5000000, feeType: 'USAGE', groupType: '개인' },
            { name: '7단', price: 3000000, feeType: 'USAGE', groupType: '개인' },
            { name: '8단(최고단)', price: 2500000, feeType: 'USAGE', groupType: '개인' },
            // 유골보관단
            { name: '1단(유골보관단)', price: 1500000, feeType: 'USAGE', groupType: '유골보관단' },
            // 관리비
            { name: '관리비(10년 선납, 단/1년)', price: 50000, feeType: 'MAINTENANCE' },
        ]
    },
    // [1] 봉안당(부부)
    {
        serviceType: 'BONGSAN',
        subType: '봉안당(부부)',
        rows: [
            { name: '1단(최저단)', price: 2000000, feeType: 'USAGE', groupType: '부부' },
            { name: '2단', price: 5000000, feeType: 'USAGE', groupType: '부부' },
            { name: '3단', price: 7000000, feeType: 'USAGE', groupType: '부부' },
            { name: '4단', price: 10000000, feeType: 'USAGE', groupType: '부부' },
            { name: '5단', price: 10000000, feeType: 'USAGE', groupType: '부부' },
            { name: '6단', price: 10000000, feeType: 'USAGE', groupType: '부부' },
            { name: '7단', price: 6000000, feeType: 'USAGE', groupType: '부부' },
            { name: '8단(최고단)', price: 5000000, feeType: 'USAGE', groupType: '부부' },
            // 유골보관단
            { name: '1단(유골보관단)', price: 2000000, feeType: 'USAGE', groupType: '유골보관단' },
            // 관리비
            { name: '관리비(10년 선납, 단/1년)', price: 50000, feeType: 'MAINTENANCE' },
        ]
    },
];

console.log('✅ 561 금릉공원묘원 - 개인/부부 분리:');
let total = 0;
p.priceInfo.standardizedPrices.forEach((s, i) => {
    const usage = s.rows.filter(r => r.feeType === 'USAGE').length;
    const mgmt = s.rows.filter(r => r.feeType === 'MAINTENANCE').length;
    console.log('  [' + i + '] ' + s.subType + ': 사용료 ' + usage + '개 + 관리비 ' + mgmt + '개');
    total += s.rows.length;
});
console.log('  총: ' + total + '개 (기존 19개 → ' + total + '개)');

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('💾 저장 완료');
