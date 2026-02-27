const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const p = data.find(x => x.id === 'park-0544');

// 봉안실 가격안내 (2023년 1월 1일 현재, 단위: 만원)
// VIP실: 별도 상담
// 특별실: 개인 8단~1단 / 부부 8단~1단
// 일반실: 개인 8단~1단 / 부부 8단~1단
// 관리비: 1위당 년 5만원 (VIP실은 1위당 년 8만원), 5년분 선납

p.priceInfo.standardizedPrices = [
    // [0] 개인
    {
        serviceType: 'BONGSAN',
        subType: '봉안당(개인)',
        rows: [
            // 일반실
            { name: '1단', price: 2000000, feeType: 'USAGE', groupType: '일반실' },
            { name: '2단', price: 2500000, feeType: 'USAGE', groupType: '일반실' },
            { name: '3단', price: 4000000, feeType: 'USAGE', groupType: '일반실' },
            { name: '4단', price: 4000000, feeType: 'USAGE', groupType: '일반실' },
            { name: '5단', price: 4000000, feeType: 'USAGE', groupType: '일반실' },
            { name: '6단', price: 3500000, feeType: 'USAGE', groupType: '일반실' },
            { name: '7단', price: 2000000, feeType: 'USAGE', groupType: '일반실' },
            { name: '8단', price: 1500000, feeType: 'USAGE', groupType: '일반실' },
            // 특별실
            { name: '1단', price: 3000000, feeType: 'USAGE', groupType: '특별실' },
            { name: '2단', price: 3500000, feeType: 'USAGE', groupType: '특별실' },
            { name: '3단', price: 5000000, feeType: 'USAGE', groupType: '특별실' },
            { name: '4단', price: 5000000, feeType: 'USAGE', groupType: '특별실' },
            { name: '5단', price: 5000000, feeType: 'USAGE', groupType: '특별실' },
            { name: '6단', price: 4500000, feeType: 'USAGE', groupType: '특별실' },
            { name: '7단', price: 3000000, feeType: 'USAGE', groupType: '특별실' },
            { name: '8단', price: 2500000, feeType: 'USAGE', groupType: '특별실' },
            // VIP실
            { name: 'VIP실', price: 0, feeType: 'USAGE', groupType: 'VIP실', note: '별도 상담' },
            // 관리비
            { name: '관리비 (1위/년, 5년 선납)', price: 50000, feeType: 'MAINTENANCE', groupType: '일반실·특별실' },
            { name: '관리비 VIP (1위/년, 5년 선납)', price: 80000, feeType: 'MAINTENANCE', groupType: 'VIP실' },
        ]
    },
    // [1] 부부
    {
        serviceType: 'BONGSAN',
        subType: '봉안당(부부)',
        rows: [
            // 일반실
            { name: '1단', price: 4000000, feeType: 'USAGE', groupType: '일반실' },
            { name: '2단', price: 5000000, feeType: 'USAGE', groupType: '일반실' },
            { name: '3단', price: 8000000, feeType: 'USAGE', groupType: '일반실' },
            { name: '4단', price: 8000000, feeType: 'USAGE', groupType: '일반실' },
            { name: '5단', price: 8000000, feeType: 'USAGE', groupType: '일반실' },
            { name: '6단', price: 7000000, feeType: 'USAGE', groupType: '일반실' },
            { name: '7단', price: 4000000, feeType: 'USAGE', groupType: '일반실' },
            { name: '8단', price: 3000000, feeType: 'USAGE', groupType: '일반실' },
            // 특별실
            { name: '1단', price: 6000000, feeType: 'USAGE', groupType: '특별실' },
            { name: '2단', price: 7000000, feeType: 'USAGE', groupType: '특별실' },
            { name: '3단', price: 10000000, feeType: 'USAGE', groupType: '특별실' },
            { name: '4단', price: 10000000, feeType: 'USAGE', groupType: '특별실' },
            { name: '5단', price: 10000000, feeType: 'USAGE', groupType: '특별실' },
            { name: '6단', price: 9000000, feeType: 'USAGE', groupType: '특별실' },
            { name: '7단', price: 6000000, feeType: 'USAGE', groupType: '특별실' },
            { name: '8단', price: 5000000, feeType: 'USAGE', groupType: '특별실' },
            // VIP실
            { name: 'VIP실', price: 0, feeType: 'USAGE', groupType: 'VIP실', note: '별도 상담' },
            // 관리비
            { name: '관리비 (1위/년, 5년 선납)', price: 50000, feeType: 'MAINTENANCE', groupType: '일반실·특별실' },
            { name: '관리비 VIP (1위/년, 5년 선납)', price: 80000, feeType: 'MAINTENANCE', groupType: 'VIP실' },
        ]
    },
];

const ic = p.priceInfo.standardizedPrices[0].rows.length;
const cc = p.priceInfo.standardizedPrices[1].rows.length;
console.log('✅ 544 목포추모관 휴 수정:');
console.log('   개인: ' + ic + '개');
console.log('   부부: ' + cc + '개');

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('💾 저장 완료');
