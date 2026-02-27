const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const p = data.find(x => x.id === 'park-0552');

// 삼봉사 공식 사이트 (sambongsa.com/m_sbsm3.html) 기준
// 개인단/부부단, 단기(1년)/영구봉안
// 단위: 만원 → ×10000
// 영구안치 시 관리비 무료

p.priceInfo.standardizedPrices = [
    // [0] 영구봉안(개인단)
    {
        serviceType: 'BONGSAN',
        subType: '봉안당(영구/개인)',
        rows: [
            { name: '7단', price: 3000000, feeType: 'USAGE', groupType: '개인단' },
            { name: '6단', price: 7000000, feeType: 'USAGE', groupType: '개인단' },
            { name: '5단', price: 10000000, feeType: 'USAGE', groupType: '개인단' },
            { name: '4단', price: 10000000, feeType: 'USAGE', groupType: '개인단' },
            { name: '3단', price: 8000000, feeType: 'USAGE', groupType: '개인단' },
            { name: '2단', price: 6000000, feeType: 'USAGE', groupType: '개인단' },
            { name: '1단', price: 4000000, feeType: 'USAGE', groupType: '개인단' },
        ]
    },
    // [1] 영구봉안(부부단)
    {
        serviceType: 'BONGSAN',
        subType: '봉안당(영구/부부)',
        rows: [
            { name: '7단', price: 6000000, feeType: 'USAGE', groupType: '부부단' },
            { name: '6단', price: 14000000, feeType: 'USAGE', groupType: '부부단' },
            { name: '5단', price: 20000000, feeType: 'USAGE', groupType: '부부단' },
            { name: '4단', price: 20000000, feeType: 'USAGE', groupType: '부부단' },
            { name: '3단', price: 16000000, feeType: 'USAGE', groupType: '부부단' },
            { name: '2단', price: 12000000, feeType: 'USAGE', groupType: '부부단' },
            { name: '1단', price: 8000000, feeType: 'USAGE', groupType: '부부단' },
        ]
    },
    // [2] 단기봉안(1년)
    {
        serviceType: 'BONGSAN',
        subType: '봉안당(단기 1년)',
        rows: [
            { name: '6단 개인', price: 700000, feeType: 'USAGE', groupType: '개인단', isRepresentative: true },
            { name: '5단 개인', price: 700000, feeType: 'USAGE', groupType: '개인단' },
            { name: '4단 개인', price: 700000, feeType: 'USAGE', groupType: '개인단' },
            { name: '3단 개인', price: 700000, feeType: 'USAGE', groupType: '개인단' },
            { name: '2단 개인', price: 500000, feeType: 'USAGE', groupType: '개인단' },
            { name: '1단 개인', price: 300000, feeType: 'USAGE', groupType: '개인단' },
            { name: '6단 부부', price: 1400000, feeType: 'USAGE', groupType: '부부단' },
            { name: '5단 부부', price: 1400000, feeType: 'USAGE', groupType: '부부단' },
            { name: '4단 부부', price: 1400000, feeType: 'USAGE', groupType: '부부단' },
            { name: '3단 부부', price: 1400000, feeType: 'USAGE', groupType: '부부단' },
            { name: '2단 부부', price: 1000000, feeType: 'USAGE', groupType: '부부단' },
            { name: '1단 부부', price: 600000, feeType: 'USAGE', groupType: '부부단' },
        ]
    },
];

console.log('✅ 552 삼봉사 봉안당 - 공식 사이트 기준 재구성:');
let total = 0;
p.priceInfo.standardizedPrices.forEach((s, i) => {
    console.log('  [' + i + '] ' + s.subType + ': ' + s.rows.length + '개');
    total += s.rows.length;
});
console.log('  총: ' + total + '개 (기존 24개 → ' + total + '개)');

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('💾 저장 완료');
