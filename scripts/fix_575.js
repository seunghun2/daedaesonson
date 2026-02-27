const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const p = data.find(x => x.id === 'park-0575');

// 일반(영구봉안) / 선예약(영구봉안) 분리
// 관리비: 영구=150만, 5년=25만
// 서비스: 봉안제 무료, 기제사 50만, 합동제사 명절 1만(10원 표기→실제 1만), 대웅전 영구위패봉안 100만

p.priceInfo.standardizedPrices = [
    {
        serviceType: 'BONGSAN', subType: '봉안당(일반)',
        rows: [
            { name: '1단', price: 2500000, feeType: 'USAGE', groupType: '일반', isRepresentative: true, grade: '영구봉안' },
            { name: '2단', price: 3000000, feeType: 'USAGE', groupType: '일반', grade: '영구봉안' },
            { name: '3단', price: 4000000, feeType: 'USAGE', groupType: '일반', grade: '영구봉안' },
            { name: '4단', price: 5000000, feeType: 'USAGE', groupType: '일반', grade: '영구봉안' },
            { name: '5단', price: 5500000, feeType: 'USAGE', groupType: '일반', grade: '영구봉안' },
            { name: '6단', price: 4000000, feeType: 'USAGE', groupType: '일반', grade: '영구봉안' },
            { name: '7단', price: 2000000, feeType: 'USAGE', groupType: '일반', grade: '영구봉안' },
            { name: '영구 관리비', price: 1500000, feeType: 'MAINTENANCE' },
            { name: '5년납 관리비', price: 250000, feeType: 'MAINTENANCE', grade: '5년 단위' },
        ]
    },
    {
        serviceType: 'BONGSAN', subType: '봉안당(선예약)',
        rows: [
            { name: '1단', price: 2000000, feeType: 'USAGE', groupType: '선예약', grade: '영구봉안' },
            { name: '2단', price: 2100000, feeType: 'USAGE', groupType: '선예약', grade: '영구보관' },
            { name: '3단', price: 2800000, feeType: 'USAGE', groupType: '선예약', grade: '영구보관' },
            { name: '4단', price: 3500000, feeType: 'USAGE', groupType: '선예약', grade: '영구보관' },
            { name: '5단', price: 3850000, feeType: 'USAGE', groupType: '선예약', grade: '영구보관' },
            { name: '6단', price: 2800000, feeType: 'USAGE', groupType: '선예약', grade: '영구보관' },
            { name: '7단', price: 1600000, feeType: 'USAGE', groupType: '선예약', grade: '영구봉안' },
        ]
    },
];

console.log('✅ 575 대원사 봉안당 - 일반/선예약 분리:');
let total = 0;
p.priceInfo.standardizedPrices.forEach((s, i) => {
    console.log('  [' + i + '] ' + s.subType + ': ' + s.rows.length + '개');
    total += s.rows.length;
});
console.log('  총: ' + total + '개 (기존 16개 → ' + total + '개)');

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('💾 저장 완료');
