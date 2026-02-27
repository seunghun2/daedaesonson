const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const p = data.find(x => x.id === 'park-0567');

// 개인(1기)/부부(2기)/가족(4기) 분리
// 관리비: 봉안함 1기 30년 기준 33만
// 추선금: 봉안함 1기 30년 기준 60만

p.priceInfo.standardizedPrices = [
    // [0] 개인(1기)
    {
        serviceType: 'BONGSAN',
        subType: '봉안당(개인)',
        rows: [
            { name: '8단', price: 770000, feeType: 'USAGE', groupType: '개인', isRepresentative: true },
            { name: '7단', price: 1370000, feeType: 'USAGE', groupType: '개인' },
            { name: '6단', price: 1670000, feeType: 'USAGE', groupType: '개인' },
            { name: '5단', price: 1670000, feeType: 'USAGE', groupType: '개인' },
            { name: '4단', price: 1470000, feeType: 'USAGE', groupType: '개인' },
            { name: '3단', price: 1370000, feeType: 'USAGE', groupType: '개인' },
            { name: '2단', price: 870000, feeType: 'USAGE', groupType: '개인' },
            { name: '1단', price: 370000, feeType: 'USAGE', groupType: '개인' },
            { name: '관리비(1기/30년)', price: 330000, feeType: 'MAINTENANCE' },
            { name: '추선금(1기/30년)', price: 600000, feeType: 'ANCILLARY' },
        ]
    },
    // [1] 부부(2기)
    {
        serviceType: 'BONGSAN',
        subType: '봉안당(부부)',
        rows: [
            { name: '8단', price: 1540000, feeType: 'USAGE', groupType: '부부' },
            { name: '7단', price: 2740000, feeType: 'USAGE', groupType: '부부' },
            { name: '6단', price: 3340000, feeType: 'USAGE', groupType: '부부' },
            { name: '5단', price: 3340000, feeType: 'USAGE', groupType: '부부' },
            { name: '4단', price: 2940000, feeType: 'USAGE', groupType: '부부' },
            { name: '3단', price: 2740000, feeType: 'USAGE', groupType: '부부' },
            { name: '2단', price: 1740000, feeType: 'USAGE', groupType: '부부' },
            { name: '1단', price: 740000, feeType: 'USAGE', groupType: '부부' },
            { name: '관리비(2기/30년)', price: 660000, feeType: 'MAINTENANCE' },
            { name: '추선금(2기/30년)', price: 1200000, feeType: 'ANCILLARY' },
        ]
    },
    // [2] 가족(4기)
    {
        serviceType: 'BONGSAN',
        subType: '봉안당(가족)',
        rows: [
            { name: '7·8단', price: 4280000, feeType: 'USAGE', groupType: '가족' },
            { name: '5·6단', price: 6680000, feeType: 'USAGE', groupType: '가족' },
            { name: '3·4단', price: 5680000, feeType: 'USAGE', groupType: '가족' },
            { name: '1·2단', price: 2480000, feeType: 'USAGE', groupType: '가족' },
            { name: '관리비(4기/30년)', price: 1320000, feeType: 'MAINTENANCE' },
            { name: '추선금(4기/30년)', price: 2400000, feeType: 'ANCILLARY' },
        ]
    },
];

console.log('✅ 567 한국SGI이천평화공원 - 개인/부부/가족 분리:');
let total = 0;
p.priceInfo.standardizedPrices.forEach((s, i) => {
    const usage = s.rows.filter(r => r.feeType === 'USAGE').length;
    const mgmt = s.rows.filter(r => r.feeType === 'MAINTENANCE').length;
    const anc = s.rows.filter(r => r.feeType === 'ANCILLARY').length;
    console.log('  [' + i + '] ' + s.subType + ': 사용료 ' + usage + '개 + 관리비 ' + mgmt + '개 + 추선금 ' + anc + '개');
    total += s.rows.length;
});
console.log('  총: ' + total + '개 (기존 22개 → ' + total + '개)');

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('💾 저장 완료');
