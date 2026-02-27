const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const p = data.find(x => x.id === 'park-0558');

// e하늘 이미지 기준 재구성
// 봉안석(일반) = 영구봉안: 싱글(개인)=1인용, 프리미엄(부부)=2인용
// 10년 임대 봉안당: 싱글/프리미엄
// 관리비: 5년 기준, 일반/VIP
// 자연장지: NATURAL 탭

p.priceInfo.standardizedPrices = [
    // [0] 영구봉안(개인/싱글)
    {
        serviceType: 'BONGSAN',
        subType: '봉안당(개인)',
        rows: [
            // 영구봉안
            { name: '9단', price: 1000000, feeType: 'USAGE', groupType: '영구봉안', isRepresentative: true },
            { name: '8단', price: 1500000, feeType: 'USAGE', groupType: '영구봉안' },
            { name: '7단', price: 2000000, feeType: 'USAGE', groupType: '영구봉안' },
            { name: '6단', price: 3000000, feeType: 'USAGE', groupType: '영구봉안' },
            { name: '5단', price: 4500000, feeType: 'USAGE', groupType: '영구봉안' },
            { name: '4단', price: 4000000, feeType: 'USAGE', groupType: '영구봉안' },
            { name: '3단', price: 3500000, feeType: 'USAGE', groupType: '영구봉안' },
            { name: '2단', price: 2500000, feeType: 'USAGE', groupType: '영구봉안' },
            { name: '1단', price: 1500000, feeType: 'USAGE', groupType: '영구봉안' },
            // 10년 임대
            { name: '2~7단(10년 임대)', price: 300000, feeType: 'USAGE', groupType: '임대봉안' },
            // 관리비
            { name: '관리비(5년/일반)', price: 250000, feeType: 'MAINTENANCE' },
            { name: '관리비(5년/VIP)', price: 300000, feeType: 'MAINTENANCE' },
        ]
    },
    // [1] 영구봉안(부부/프리미엄)
    {
        serviceType: 'BONGSAN',
        subType: '봉안당(부부)',
        rows: [
            // 영구봉안
            { name: '9단', price: 2000000, feeType: 'USAGE', groupType: '영구봉안' },
            { name: '8단', price: 3000000, feeType: 'USAGE', groupType: '영구봉안' },
            { name: '7단', price: 4000000, feeType: 'USAGE', groupType: '영구봉안' },
            { name: '6단', price: 6000000, feeType: 'USAGE', groupType: '영구봉안' },
            { name: '5단', price: 9000000, feeType: 'USAGE', groupType: '영구봉안' },
            { name: '4단', price: 8000000, feeType: 'USAGE', groupType: '영구봉안' },
            { name: '3단', price: 7000000, feeType: 'USAGE', groupType: '영구봉안' },
            { name: '2단', price: 5000000, feeType: 'USAGE', groupType: '영구봉안' },
            { name: '1단', price: 3000000, feeType: 'USAGE', groupType: '영구봉안' },
            // 10년 임대
            { name: '2~7단(10년 임대)', price: 600000, feeType: 'USAGE', groupType: '임대봉안' },
            // 관리비
            { name: '관리비(5년/일반)', price: 500000, feeType: 'MAINTENANCE' },
            { name: '관리비(5년/VIP)', price: 600000, feeType: 'MAINTENANCE' },
        ]
    },
    // [2] 자연장지 (NATURAL 탭)
    {
        serviceType: 'NATURAL',
        subType: '자연장지',
        rows: [
            { name: '30년 사용료', price: 2000000, feeType: 'USAGE', groupType: '자연장지' },
            { name: '30년 관리비', price: 600000, feeType: 'MAINTENANCE' },
        ]
    },
];

console.log('✅ 558 효원가족공원 - 개인/부부 + 자연장지 분리:');
let total = 0;
p.priceInfo.standardizedPrices.forEach((s, i) => {
    const usage = s.rows.filter(r => r.feeType === 'USAGE').length;
    const mgmt = s.rows.filter(r => r.feeType === 'MAINTENANCE').length;
    console.log('  [' + i + '] ' + s.serviceType + ' / ' + s.subType + ': 사용료 ' + usage + '개 + 관리비 ' + mgmt + '개');
    total += s.rows.length;
});
console.log('  총: ' + total + '개 (기존 26개 → ' + total + '개)');

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('💾 저장 완료');
