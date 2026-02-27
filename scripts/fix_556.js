const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const p = data.find(x => x.id === 'park-0556');

// 봉안당: 개인/부부 (BONGSAN)
// 봉안묘/평장묘: 별도 탭 (BURIAL)
p.priceInfo.standardizedPrices = [
    // [0] 봉안당(개인)
    {
        serviceType: 'BONGSAN',
        subType: '봉안당(개인)',
        rows: [
            { name: '개인단(벽체형/원장형)', price: 5800000, feeType: 'USAGE', groupType: '봉안당', isRepresentative: true },
            { name: '관리비(1위/연)', price: 20000, feeType: 'MAINTENANCE' },
        ]
    },
    // [1] 봉안당(부부)
    {
        serviceType: 'BONGSAN',
        subType: '봉안당(부부)',
        rows: [
            { name: '부부단(벽체형/원장형)', price: 9500000, feeType: 'USAGE', groupType: '봉안당' },
            { name: '관리비(1위/연)', price: 20000, feeType: 'MAINTENANCE' },
        ]
    },
    // [2] 봉안묘 (BURIAL 탭)
    {
        serviceType: 'BURIAL',
        subType: '봉안묘',
        rows: [
            { name: '토지사용료(㎡당)', price: 373370, feeType: 'USAGE', groupType: '봉안묘' },
            { name: '안치비(1회)', price: 110000, feeType: 'USAGE', groupType: '봉안묘' },
            { name: '토지관리비(㎡당/연)', price: 7670, feeType: 'MAINTENANCE' },
        ]
    },
    // [3] 평장묘 (BURIAL 탭)
    {
        serviceType: 'BURIAL',
        subType: '평장묘',
        rows: [
            { name: '토지사용료(㎡당)', price: 373370, feeType: 'USAGE', groupType: '평장묘' },
            { name: '안치비(1회)', price: 330000, feeType: 'USAGE', groupType: '평장묘' },
            { name: '토지관리비(㎡당/연)', price: 7670, feeType: 'MAINTENANCE' },
        ]
    },
];

console.log('✅ 556 예래원 - 봉안당/봉안묘/평장묘 탭 분리:');
let total = 0;
p.priceInfo.standardizedPrices.forEach((s, i) => {
    const usage = s.rows.filter(r => r.feeType === 'USAGE').length;
    const mgmt = s.rows.filter(r => r.feeType === 'MAINTENANCE').length;
    console.log('  [' + i + '] ' + s.serviceType + ' / ' + s.subType + ': 사용료 ' + usage + '개 + 관리비 ' + mgmt + '개');
    total += s.rows.length;
});
console.log('  총: ' + total + '개');

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('💾 저장 완료');
