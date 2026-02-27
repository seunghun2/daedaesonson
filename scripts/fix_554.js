const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const p = data.find(x => x.id === 'park-0554');

// e하늘 이미지 기준 전체 재구성
// 봉안당: 개인 1~8단, 부부 1~8단
// 봉안묘: 개인 1위, 부부(원앙) 2위, 가족묘 4~32위
p.priceInfo.standardizedPrices = [
    // [0] 봉안당(개인)
    {
        serviceType: 'BONGSAN',
        subType: '봉안당(개인)',
        rows: [
            { name: '1단', price: 3000000, feeType: 'USAGE', groupType: '개인' },
            { name: '2단', price: 3500000, feeType: 'USAGE', groupType: '개인' },
            { name: '3단', price: 4500000, feeType: 'USAGE', groupType: '개인' },
            { name: '4단', price: 6000000, feeType: 'USAGE', groupType: '개인' },
            { name: '5단', price: 6000000, feeType: 'USAGE', groupType: '개인' },
            { name: '6단', price: 4500000, feeType: 'USAGE', groupType: '개인' },
            { name: '7단', price: 3500000, feeType: 'USAGE', groupType: '개인' },
            { name: '8단', price: 2500000, feeType: 'USAGE', groupType: '개인', isRepresentative: true },
        ]
    },
    // [1] 봉안당(부부)
    {
        serviceType: 'BONGSAN',
        subType: '봉안당(부부)',
        rows: [
            { name: '1단', price: 5500000, feeType: 'USAGE', groupType: '부부' },
            { name: '2단', price: 6500000, feeType: 'USAGE', groupType: '부부' },
            { name: '3단', price: 8500000, feeType: 'USAGE', groupType: '부부' },
            { name: '4단', price: 11000000, feeType: 'USAGE', groupType: '부부' },
            { name: '5단', price: 11000000, feeType: 'USAGE', groupType: '부부' },
            { name: '6단', price: 8500000, feeType: 'USAGE', groupType: '부부' },
            { name: '7단', price: 6500000, feeType: 'USAGE', groupType: '부부' },
            { name: '8단', price: 4500000, feeType: 'USAGE', groupType: '부부' },
        ]
    },
    // [2] 봉안묘
    {
        serviceType: 'BONGSAN',
        subType: '봉안묘',
        rows: [
            { name: '개인묘 1위', price: 4000000, feeType: 'USAGE', groupType: '개인' },
            { name: '원앙(부부) 2위', price: 7000000, feeType: 'USAGE', groupType: '부부' },
            { name: '가족묘 4위', price: 13000000, feeType: 'USAGE', groupType: '가족묘' },
            { name: '가족묘 6위', price: 15000000, feeType: 'USAGE', groupType: '가족묘' },
            { name: '가족묘 8위', price: 17000000, feeType: 'USAGE', groupType: '가족묘' },
            { name: '가족묘 12위', price: 20000000, feeType: 'USAGE', groupType: '가족묘' },
            { name: '가족묘 16위', price: 22000000, feeType: 'USAGE', groupType: '가족묘' },
            { name: '가족묘 20위', price: 25000000, feeType: 'USAGE', groupType: '가족묘' },
            { name: '가족묘 24위', price: 27000000, feeType: 'USAGE', groupType: '가족묘' },
            { name: '가족묘 32위', price: 30000000, feeType: 'USAGE', groupType: '가족묘' },
        ]
    },
];

console.log('✅ 554 아산메모리얼파크 휴온 봉안당 재구성:');
let total = 0;
p.priceInfo.standardizedPrices.forEach((s, i) => {
    console.log('  [' + i + '] ' + s.subType + ': ' + s.rows.length + '개');
    total += s.rows.length;
});
console.log('  총: ' + total + '개 (기존 19개 → ' + total + '개)');

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('💾 저장 완료');
