const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const p = data.find(x => x.id === 'park-0574');

// 공식 사이트 기준 전체 재구성
// 1. 일반실(불교/유교) — e하늘 이미지 기준 (영구)
// 2. 특별실(기독교/불교/유교) — e하늘 이미지 기준 (영구)
// 3. 납골당(개인/10년), 납골당(부부/10년) — 공식 사이트
// 4. 수목형 자연장 — 공식 사이트

p.priceInfo.standardizedPrices = [
    // [0] 일반실(불교/유교) — 영구
    {
        serviceType: 'BONGSAN', subType: '일반실(불교/유교)',
        rows: [
            { name: '1단', price: 2000000, feeType: 'USAGE', groupType: '일반실', isRepresentative: true },
            { name: '2단', price: 3000000, feeType: 'USAGE', groupType: '일반실' },
            { name: '3단', price: 3500000, feeType: 'USAGE', groupType: '일반실' },
            { name: '4단', price: 3500000, feeType: 'USAGE', groupType: '일반실' },
            { name: '5단', price: 3500000, feeType: 'USAGE', groupType: '일반실' },
            { name: '6단', price: 3500000, feeType: 'USAGE', groupType: '일반실' },
            { name: '7단', price: 3000000, feeType: 'USAGE', groupType: '일반실' },
            { name: '8단', price: 2500000, feeType: 'USAGE', groupType: '일반실' },
            { name: '9단', price: 1500000, feeType: 'USAGE', groupType: '일반실' },
        ]
    },
    // [1] 특별실(기독교/불교/유교) — 영구
    {
        serviceType: 'BONGSAN', subType: '특별실(기독교/불교/유교)',
        rows: [
            { name: '1단', price: 2500000, feeType: 'USAGE', groupType: '특별실' },
            { name: '2단', price: 3500000, feeType: 'USAGE', groupType: '특별실' },
            { name: '3단', price: 4000000, feeType: 'USAGE', groupType: '특별실' },
            { name: '4단', price: 4000000, feeType: 'USAGE', groupType: '특별실' },
            { name: '5단', price: 4000000, feeType: 'USAGE', groupType: '특별실' },
            { name: '6단', price: 4000000, feeType: 'USAGE', groupType: '특별실' },
            { name: '7단', price: 3500000, feeType: 'USAGE', groupType: '특별실' },
            { name: '8단', price: 3000000, feeType: 'USAGE', groupType: '특별실' },
            { name: '9단', price: 1800000, feeType: 'USAGE', groupType: '특별실' },
        ]
    },
    // [2] 납골당(개인/10년)
    {
        serviceType: 'BONGSAN', subType: '납골당(개인/10년)',
        rows: [
            { name: '1단', price: 600000, feeType: 'USAGE', groupType: '납골당 개인', grade: '10년 계약, 부가세 별도' },
            { name: '2단', price: 700000, feeType: 'USAGE', groupType: '납골당 개인' },
            { name: '3단', price: 800000, feeType: 'USAGE', groupType: '납골당 개인' },
            { name: '4단', price: 1000000, feeType: 'USAGE', groupType: '납골당 개인' },
            { name: '5단', price: 1000000, feeType: 'USAGE', groupType: '납골당 개인' },
            { name: '6단', price: 800000, feeType: 'USAGE', groupType: '납골당 개인' },
            { name: '7단', price: 600000, feeType: 'USAGE', groupType: '납골당 개인' },
            { name: '8단', price: 500000, feeType: 'USAGE', groupType: '납골당 개인' },
        ]
    },
    // [3] 납골당(부부/10년)
    {
        serviceType: 'BONGSAN', subType: '납골당(부부/10년)',
        rows: [
            { name: '1단', price: 1200000, feeType: 'USAGE', groupType: '납골당 부부', grade: '10년 계약, 부가세 별도' },
            { name: '2단', price: 1400000, feeType: 'USAGE', groupType: '납골당 부부' },
            { name: '3단', price: 1600000, feeType: 'USAGE', groupType: '납골당 부부' },
            { name: '4단', price: 2000000, feeType: 'USAGE', groupType: '납골당 부부' },
            { name: '5단', price: 2000000, feeType: 'USAGE', groupType: '납골당 부부' },
            { name: '6단', price: 1600000, feeType: 'USAGE', groupType: '납골당 부부' },
            { name: '7단', price: 1200000, feeType: 'USAGE', groupType: '납골당 부부' },
            { name: '8단', price: 1000000, feeType: 'USAGE', groupType: '납골당 부부' },
        ]
    },
    // [4] 수목형 자연장
    {
        serviceType: 'NATURAL', subType: '수목형 자연장',
        rows: [
            { name: '개인형', price: 5500000, feeType: 'USAGE', groupType: '자연장', grade: '부가세 포함, 나무의 전/좌/우 안치, 수목 위치 선택' },
            { name: '부부형', price: 8800000, feeType: 'USAGE', groupType: '자연장', grade: '부가세 포함, 나무의 중앙 안치, 수목 위치 선택' },
            { name: '관리비(개인/연)', price: 50000, feeType: 'MAINTENANCE', grade: '처음 안치시 10년분 선납' },
            { name: '관리비(부부/연)', price: 100000, feeType: 'MAINTENANCE', grade: '처음 안치시 10년분 선납' },
            { name: '외비甲(450×330)', price: 600000, feeType: 'USAGE', groupType: '자연장' },
        ]
    },
];

console.log('✅ 574 영호공원 - 납골당+수목형 추가:');
let total = 0;
p.priceInfo.standardizedPrices.forEach((s, i) => {
    console.log('  [' + i + '] ' + s.serviceType + ' / ' + s.subType + ': ' + s.rows.length + '개');
    total += s.rows.length;
});
console.log('  총: ' + total + '개 (기존 18개 → ' + total + '개)');

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('💾 저장 완료');
