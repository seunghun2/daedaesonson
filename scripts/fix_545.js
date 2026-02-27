const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const p = data.find(x => x.id === 'park-0545');

// 사이트 기준(peacememorialpark.co.kr) 전체 재구성
// 부부단 = 개인단 × 2
// 관리비: 개인 25만/5년, 부부 50만/5년

p.priceInfo.standardizedPrices = [
    // [0] 개인
    {
        serviceType: 'BONGSAN',
        subType: '봉안당(개인)',
        rows: [
            // 일반실
            { name: '1단', price: 2500000, feeType: 'USAGE', groupType: '일반실' },
            { name: '2단', price: 3500000, feeType: 'USAGE', groupType: '일반실' },
            { name: '3단', price: 4300000, feeType: 'USAGE', groupType: '일반실' },
            { name: '4단', price: 5200000, feeType: 'USAGE', groupType: '일반실' },
            { name: '5단', price: 5200000, feeType: 'USAGE', groupType: '일반실' },
            { name: '6단', price: 4800000, feeType: 'USAGE', groupType: '일반실' },
            { name: '7단', price: 3500000, feeType: 'USAGE', groupType: '일반실' },
            { name: '8단', price: 2500000, feeType: 'USAGE', groupType: '일반실' },
            { name: '9단', price: 1500000, feeType: 'USAGE', groupType: '일반실' },
            // 특별실(예정)
            { name: '1단', price: 3500000, feeType: 'USAGE', groupType: '특별실' },
            { name: '2단', price: 4800000, feeType: 'USAGE', groupType: '특별실' },
            { name: '3단', price: 7500000, feeType: 'USAGE', groupType: '특별실' },
            { name: '4단', price: 7500000, feeType: 'USAGE', groupType: '특별실' },
            { name: '5단', price: 7500000, feeType: 'USAGE', groupType: '특별실' },
            { name: '6단', price: 6000000, feeType: 'USAGE', groupType: '특별실' },
            { name: '7단', price: 4800000, feeType: 'USAGE', groupType: '특별실' },
            { name: '8단', price: 3500000, feeType: 'USAGE', groupType: '특별실' },
            // VIP실
            { name: '1단', price: 6000000, feeType: 'USAGE', groupType: 'VIP실' },
            { name: '2단', price: 7000000, feeType: 'USAGE', groupType: 'VIP실' },
            { name: '3단', price: 10000000, feeType: 'USAGE', groupType: 'VIP실' },
            { name: '4단', price: 10000000, feeType: 'USAGE', groupType: 'VIP실' },
            { name: '5단', price: 10000000, feeType: 'USAGE', groupType: 'VIP실' },
            { name: '6단', price: 7000000, feeType: 'USAGE', groupType: 'VIP실' },
            // 관리비
            { name: '관리비 (5년)', price: 250000, feeType: 'MAINTENANCE', groupType: '관리비' },
        ]
    },
    // [1] 부부
    {
        serviceType: 'BONGSAN',
        subType: '봉안당(부부)',
        rows: [
            // 일반실 (×2)
            { name: '1단', price: 5000000, feeType: 'USAGE', groupType: '일반실' },
            { name: '2단', price: 7000000, feeType: 'USAGE', groupType: '일반실' },
            { name: '3단', price: 8600000, feeType: 'USAGE', groupType: '일반실' },
            { name: '4단', price: 10400000, feeType: 'USAGE', groupType: '일반실' },
            { name: '5단', price: 10400000, feeType: 'USAGE', groupType: '일반실' },
            { name: '6단', price: 9600000, feeType: 'USAGE', groupType: '일반실' },
            { name: '7단', price: 7000000, feeType: 'USAGE', groupType: '일반실' },
            { name: '8단', price: 5000000, feeType: 'USAGE', groupType: '일반실' },
            { name: '9단', price: 3000000, feeType: 'USAGE', groupType: '일반실' },
            // 특별실 (×2)
            { name: '1단', price: 7000000, feeType: 'USAGE', groupType: '특별실' },
            { name: '2단', price: 9600000, feeType: 'USAGE', groupType: '특별실' },
            { name: '3단', price: 15000000, feeType: 'USAGE', groupType: '특별실' },
            { name: '4단', price: 15000000, feeType: 'USAGE', groupType: '특별실' },
            { name: '5단', price: 15000000, feeType: 'USAGE', groupType: '특별실' },
            { name: '6단', price: 12000000, feeType: 'USAGE', groupType: '특별실' },
            { name: '7단', price: 9600000, feeType: 'USAGE', groupType: '특별실' },
            { name: '8단', price: 7000000, feeType: 'USAGE', groupType: '특별실' },
            // VIP실 (×2)
            { name: '1단', price: 12000000, feeType: 'USAGE', groupType: 'VIP실' },
            { name: '2단', price: 14000000, feeType: 'USAGE', groupType: 'VIP실' },
            { name: '3단', price: 20000000, feeType: 'USAGE', groupType: 'VIP실' },
            { name: '4단', price: 20000000, feeType: 'USAGE', groupType: 'VIP실' },
            { name: '5단', price: 20000000, feeType: 'USAGE', groupType: 'VIP실' },
            { name: '6단', price: 14000000, feeType: 'USAGE', groupType: 'VIP실' },
            // 관리비
            { name: '관리비 (5년)', price: 500000, feeType: 'MAINTENANCE', groupType: '관리비' },
        ]
    },
];

const ic = p.priceInfo.standardizedPrices[0].rows.length;
const cc = p.priceInfo.standardizedPrices[1].rows.length;
console.log('✅ 545 평화공원 파라다이스 추모관 수정:');
console.log('   개인: ' + ic + '개 (일반9+특별8+VIP6+관리비1)');
console.log('   부부: ' + cc + '개 (일반9+특별8+VIP6+관리비1)');

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('💾 저장 완료');
