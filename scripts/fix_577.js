const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const p = data.find(x => x.id === 'park-0577');

// e하늘 이미지 기준 전체 재구성
// (2F) 봉안 1,3,4,5관(개인단) — 영구
// (1F) 극락전(부부단) — 영구
// (2F) 봉안 2관(개인단) — 20년 임대
// 1단은 폐지(2단부터 안치)

p.priceInfo.standardizedPrices = [
    // [0] (2F) 봉안 1,3,4,5관 (개인단/영구)
    {
        serviceType: 'BONGSAN', subType: '봉안 1,3,4,5관(개인/영구)',
        rows: [
            { name: '2단', price: 2500000, feeType: 'USAGE', groupType: '2F 개인(영구)', isRepresentative: true, grade: '영구, 최저층' },
            { name: '3단', price: 4000000, feeType: 'USAGE', groupType: '2F 개인(영구)', grade: '영구' },
            { name: '4단', price: 5500000, feeType: 'USAGE', groupType: '2F 개인(영구)', grade: '영구' },
            { name: '5단', price: 6000000, feeType: 'USAGE', groupType: '2F 개인(영구)', grade: '영구, ROYAL' },
            { name: '6단', price: 4500000, feeType: 'USAGE', groupType: '2F 개인(영구)', grade: '영구, 최상층(총 5층 구조)' },
            { name: '관리비(개인/연)', price: 400000, feeType: 'MAINTENANCE', grade: '1년 4만원, 10년 선납(영구·임대)' },
        ]
    },
    // [1] (1F) 극락전(부부단/영구)
    {
        serviceType: 'BONGSAN', subType: '극락전(부부/영구)',
        rows: [
            { name: '2단', price: 5000000, feeType: 'USAGE', groupType: '1F 부부(영구)', grade: '영구, 최저층' },
            { name: '3단', price: 8000000, feeType: 'USAGE', groupType: '1F 부부(영구)', grade: '영구' },
            { name: '4단', price: 11000000, feeType: 'USAGE', groupType: '1F 부부(영구)', grade: '영구' },
            { name: '5단', price: 12000000, feeType: 'USAGE', groupType: '1F 부부(영구)', grade: '영구, ROYAL' },
            { name: '6단', price: 9000000, feeType: 'USAGE', groupType: '1F 부부(영구)', grade: '영구, 최상층(총 5층 구조)' },
            { name: '관리비(부부/연)', price: 800000, feeType: 'MAINTENANCE', grade: '1년 8만원, 10년 선납(영구)' },
        ]
    },
    // [2] (2F) 봉안 2관(개인단/20년 임대)
    {
        serviceType: 'BONGSAN', subType: '봉안 2관(개인/20년 임대)',
        rows: [
            { name: '2단', price: 1000000, feeType: 'USAGE', groupType: '2F 개인(임대)', grade: '20년 임대, 최저층' },
            { name: '3단', price: 2000000, feeType: 'USAGE', groupType: '2F 개인(임대)', grade: '20년 임대' },
            { name: '4단', price: 2750000, feeType: 'USAGE', groupType: '2F 개인(임대)', grade: '20년 임대' },
            { name: '5단', price: 3000000, feeType: 'USAGE', groupType: '2F 개인(임대)', grade: '20년 임대, ROYAL' },
            { name: '6단', price: 2250000, feeType: 'USAGE', groupType: '2F 개인(임대)', grade: '20년 임대, 최상층(총 5층 구조)' },
        ]
    },
];

console.log('✅ 577 삼우추모공원 - 이미지 기준 재구성:');
let total = 0;
p.priceInfo.standardizedPrices.forEach((s, i) => {
    console.log('  [' + i + '] ' + s.subType + ': ' + s.rows.length + '개');
    total += s.rows.length;
});
console.log('  총: ' + total + '개 (기존 17개 → ' + total + '개)');

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('💾 저장 완료');
