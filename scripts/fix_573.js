const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const p = data.find(x => x.id === 'park-0573');

// 가이드 준수 재구성
// - feeType: EXTENSION → USAGE (연장료도 USAGE)
// - note → grade (UI 표시)
// - residency: LOCAL / NON_LOCAL 배지
// - 봉안묘는 BURIAL (야외형이므로)

p.priceInfo.standardizedPrices = [
    // [0] 봉안당
    {
        serviceType: 'BONGSAN', subType: '봉안당',
        rows: [
            { name: '사용료+관리비', price: 700000, feeType: 'USAGE', residency: 'LOCAL', isRepresentative: true, grade: '안장시 일괄 납부' },
            { name: '사용료+관리비', price: 1200000, feeType: 'USAGE', residency: 'NON_LOCAL', grade: '3개월이상 1년미만 거주/등록기준지인자' },
            { name: '연장(관내)', price: 200000, feeType: 'USAGE', residency: 'LOCAL', grade: '연장시' },
            { name: '연장(관외 1년미만)', price: 400000, feeType: 'USAGE', residency: 'NON_LOCAL', grade: '3개월이상 1년미만 거주/등록기준지인자' },
            { name: '연장(관외 3개월이하/기사용자)', price: 600000, feeType: 'USAGE', grade: '3개월이하/관외자/기사용자' },
        ]
    },
    // [1] 봉안단(개인실)
    {
        serviceType: 'BONGSAN', subType: '봉안단(개인실)',
        rows: [
            { name: '사용료+관리비', price: 2300000, feeType: 'USAGE', residency: 'LOCAL', grade: '안장시 일괄 납부' },
            { name: '사용료+관리비', price: 3800000, feeType: 'USAGE', residency: 'NON_LOCAL', grade: '3개월이상 1년미만 거주/등록기준지인자' },
            { name: '연장(관내)', price: 1600000, feeType: 'USAGE', residency: 'LOCAL', grade: '연장시' },
            { name: '연장(관외 1년미만)', price: 2400000, feeType: 'USAGE', residency: 'NON_LOCAL', grade: '연장시' },
            { name: '연장(관외 3개월이하/기사용자)', price: 3200000, feeType: 'USAGE', grade: '3개월이하/관외자/기사용자' },
        ]
    },
    // [2] 봉안단(부부실)
    {
        serviceType: 'BONGSAN', subType: '봉안단(부부실)',
        rows: [
            { name: '사용료+관리비', price: 2900000, feeType: 'USAGE', residency: 'LOCAL', grade: '안장시 일괄 납부' },
            { name: '사용료+관리비', price: 4800000, feeType: 'USAGE', residency: 'NON_LOCAL', grade: '3개월이상 1년미만 거주/등록기준지인자' },
            { name: '연장(관내)', price: 2000000, feeType: 'USAGE', residency: 'LOCAL', grade: '연장시' },
            { name: '연장(관외 1년미만)', price: 3000000, feeType: 'USAGE', residency: 'NON_LOCAL', grade: '연장시' },
            { name: '연장(관외 3개월이하/기사용자)', price: 4000000, feeType: 'USAGE', grade: '3개월이하/관외자/기사용자' },
        ]
    },
    // [3] 봉안묘(2기형) — 야외형이므로 BURIAL
    {
        serviceType: 'BURIAL', subType: '봉안묘(2기형)',
        rows: [
            { name: '사용료+관리비+석물', price: 5290000, feeType: 'USAGE', residency: 'LOCAL', grade: '계약시 일괄 납부' },
            { name: '사용료+관리비+석물', price: 7780000, feeType: 'USAGE', residency: 'NON_LOCAL', grade: '3개월이상 1년미만 거주/등록기준지인자' },
        ]
    },
    // [4] 봉안묘(4기형)
    {
        serviceType: 'BURIAL', subType: '봉안묘(4기형)',
        rows: [
            { name: '사용료+관리비+석물', price: 6550000, feeType: 'USAGE', residency: 'LOCAL', grade: '계약시 일괄 납부' },
            { name: '사용료+관리비+석물', price: 9750000, feeType: 'USAGE', residency: 'NON_LOCAL', grade: '3개월이상 1년미만 거주/등록기준지인자' },
        ]
    },
    // [5] 봉안묘(14기형)
    {
        serviceType: 'BURIAL', subType: '봉안묘(14기형)',
        rows: [
            { name: '사용료+관리비+석물', price: 17532000, feeType: 'USAGE', residency: 'LOCAL', grade: '계약시 일괄 납부' },
            { name: '사용료+관리비+석물', price: 28032000, feeType: 'USAGE', residency: 'NON_LOCAL', grade: '3개월이상 1년미만 거주/등록기준지인자' },
        ]
    },
];

console.log('✅ 573 보령시모란공원 - 가이드 준수 재구성:');
let total = 0;
p.priceInfo.standardizedPrices.forEach((s, i) => {
    console.log('  [' + i + '] ' + s.serviceType + ' / ' + s.subType + ': ' + s.rows.length + '개');
    total += s.rows.length;
});
console.log('  총: ' + total + '개');

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('💾 저장 완료');
