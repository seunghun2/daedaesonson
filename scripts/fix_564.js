const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const p = data.find(x => x.id === 'park-0564');

// 공식 사이트 기준 (2026.1.1 적용)
// 싱글단=개인(1인), 프라임단=부부(최대2인)
// 관리비 120만(10년선납), 각인비 10만, 봉안함 50만(옵션)
// 자연장: 1인 180만

p.priceInfo.standardizedPrices = [
    // [0] 싱글단(개인)
    {
        serviceType: 'BONGSAN',
        subType: '봉안당(개인/싱글단)',
        rows: [
            { name: '8단', price: 7500000, feeType: 'USAGE', groupType: '싱글단', isRepresentative: true },
            { name: '7단', price: 8000000, feeType: 'USAGE', groupType: '싱글단' },
            { name: '6단', price: 10250000, feeType: 'USAGE', groupType: '싱글단' },
            { name: '5단', price: 10250000, feeType: 'USAGE', groupType: '싱글단' },
            { name: '4단', price: 10250000, feeType: 'USAGE', groupType: '싱글단' },
            { name: '3단', price: 10250000, feeType: 'USAGE', groupType: '싱글단' },
            { name: '2단', price: 8000000, feeType: 'USAGE', groupType: '싱글단' },
            { name: '1단', price: 6500000, feeType: 'USAGE', groupType: '싱글단' },
            // 관리비·부가
            { name: '관리비(10년 선납)', price: 1200000, feeType: 'MAINTENANCE' },
            { name: '각인비용', price: 100000, feeType: 'ANCILLARY' },
            { name: '봉안함(옵션)', price: 500000, feeType: 'ANCILLARY' },
        ]
    },
    // [1] 프라임단(부부)
    {
        serviceType: 'BONGSAN',
        subType: '봉안당(부부/프라임단)',
        rows: [
            { name: '8단', price: 15000000, feeType: 'USAGE', groupType: '프라임단' },
            { name: '7단', price: 16000000, feeType: 'USAGE', groupType: '프라임단' },
            { name: '6단', price: 20500000, feeType: 'USAGE', groupType: '프라임단' },
            { name: '5단', price: 20500000, feeType: 'USAGE', groupType: '프라임단' },
            { name: '4단', price: 20500000, feeType: 'USAGE', groupType: '프라임단' },
            { name: '3단', price: 20500000, feeType: 'USAGE', groupType: '프라임단' },
            { name: '2단', price: 16000000, feeType: 'USAGE', groupType: '프라임단' },
            { name: '1단', price: 13000000, feeType: 'USAGE', groupType: '프라임단' },
            // 관리비·부가(2인 기준)
            { name: '관리비(10년 선납, 2인)', price: 2400000, feeType: 'MAINTENANCE' },
            { name: '각인비용(2인)', price: 200000, feeType: 'ANCILLARY' },
            { name: '봉안함(옵션, 2인)', price: 1000000, feeType: 'ANCILLARY' },
        ]
    },
    // [2] 자연장
    {
        serviceType: 'NATURAL',
        subType: '자연장지',
        rows: [
            { name: '1인', price: 1800000, feeType: 'USAGE', groupType: '자연장' },
        ]
    },
];

console.log('✅ 564 에덴낙원 - 공식 사이트 기준 재구성:');
let total = 0;
p.priceInfo.standardizedPrices.forEach((s, i) => {
    const usage = s.rows.filter(r => r.feeType === 'USAGE').length;
    const mgmt = s.rows.filter(r => r.feeType === 'MAINTENANCE').length;
    const anc = s.rows.filter(r => r.feeType === 'ANCILLARY').length;
    console.log('  [' + i + '] ' + s.serviceType + '/' + s.subType + ': 사용료 ' + usage + '개 + 관리비 ' + mgmt + '개 + 부가 ' + anc + '개');
    total += s.rows.length;
});
console.log('  총: ' + total + '개');

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('💾 저장 완료');
