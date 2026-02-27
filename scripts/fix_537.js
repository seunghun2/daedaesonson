const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const p = data.find(x => x.id === 'park-0537');
const sp = p.priceInfo.standardizedPrices;

// 단위: 만원 → × 10,000
// 클래식단 = 개인(1인), 프리미엄단 = 부부(2인)

// [0] 봉안당(개인) = 클래식단
sp[0].rows = [
    // 일반실 1~9단
    { name: '1단', price: 4000000, feeType: 'USAGE', groupType: '일반실', isRepresentative: true },
    { name: '2단', price: 6500000, feeType: 'USAGE', groupType: '일반실' },
    { name: '3단', price: 8000000, feeType: 'USAGE', groupType: '일반실' },
    { name: '4단', price: 9800000, feeType: 'USAGE', groupType: '일반실' },
    { name: '5단', price: 9800000, feeType: 'USAGE', groupType: '일반실' },
    { name: '6단', price: 9800000, feeType: 'USAGE', groupType: '일반실' },
    { name: '7단', price: 6500000, feeType: 'USAGE', groupType: '일반실' },
    { name: '8단', price: 3500000, feeType: 'USAGE', groupType: '일반실' },
    { name: '9단', price: 2500000, feeType: 'USAGE', groupType: '일반실' },
    // 고급실 1~9단
    { name: '1단', price: 4500000, feeType: 'USAGE', groupType: '고급실' },
    { name: '2단', price: 8000000, feeType: 'USAGE', groupType: '고급실' },
    { name: '3단', price: 10000000, feeType: 'USAGE', groupType: '고급실' },
    { name: '4단', price: 12000000, feeType: 'USAGE', groupType: '고급실' },
    { name: '5단', price: 12000000, feeType: 'USAGE', groupType: '고급실' },
    { name: '6단', price: 12000000, feeType: 'USAGE', groupType: '고급실' },
    { name: '7단', price: 8000000, feeType: 'USAGE', groupType: '고급실' },
    { name: '8단', price: 4500000, feeType: 'USAGE', groupType: '고급실' },
    { name: '9단', price: 3000000, feeType: 'USAGE', groupType: '고급실' },
    // 특실 1~8단
    { name: '1단', price: 5000000, feeType: 'USAGE', groupType: '특실' },
    { name: '2단', price: 10000000, feeType: 'USAGE', groupType: '특실' },
    { name: '3단', price: 12000000, feeType: 'USAGE', groupType: '특실' },
    { name: '4단', price: 13000000, feeType: 'USAGE', groupType: '특실' },
    { name: '5단', price: 13000000, feeType: 'USAGE', groupType: '특실' },
    { name: '6단', price: 13000000, feeType: 'USAGE', groupType: '특실' },
    { name: '7단', price: 10000000, feeType: 'USAGE', groupType: '특실' },
    { name: '8단', price: 5000000, feeType: 'USAGE', groupType: '특실' },
    // VIP실 1~8단
    { name: '1단', price: 5500000, feeType: 'USAGE', groupType: 'VIP실' },
    { name: '2단', price: 11000000, feeType: 'USAGE', groupType: 'VIP실' },
    { name: '3단', price: 13000000, feeType: 'USAGE', groupType: 'VIP실' },
    { name: '4단', price: 15000000, feeType: 'USAGE', groupType: 'VIP실' },
    { name: '5단', price: 15000000, feeType: 'USAGE', groupType: 'VIP실' },
    { name: '6단', price: 15000000, feeType: 'USAGE', groupType: 'VIP실' },
    { name: '7단', price: 11000000, feeType: 'USAGE', groupType: 'VIP실' },
    { name: '8단', price: 5500000, feeType: 'USAGE', groupType: 'VIP실' },
    // 관리비 (5년 선납)
    { name: '관리비 (5년선납)', price: 300000, feeType: 'MAINTENANCE', groupType: '일반실' },
    { name: '관리비 (5년선납)', price: 350000, feeType: 'MAINTENANCE', groupType: 'VIP실' },
];

// [1] 봉안당(부부) = 프리미엄단
sp[1].rows = [
    // 일반실 1~9단
    { name: '1단', price: 8000000, feeType: 'USAGE', groupType: '일반실' },
    { name: '2단', price: 13000000, feeType: 'USAGE', groupType: '일반실' },
    { name: '3단', price: 16000000, feeType: 'USAGE', groupType: '일반실' },
    { name: '4단', price: 19600000, feeType: 'USAGE', groupType: '일반실' },
    { name: '5단', price: 19600000, feeType: 'USAGE', groupType: '일반실' },
    { name: '6단', price: 19600000, feeType: 'USAGE', groupType: '일반실' },
    { name: '7단', price: 13000000, feeType: 'USAGE', groupType: '일반실' },
    { name: '8단', price: 7000000, feeType: 'USAGE', groupType: '일반실' },
    { name: '9단', price: 5000000, feeType: 'USAGE', groupType: '일반실' },
    // 고급실 1~9단
    { name: '1단', price: 9000000, feeType: 'USAGE', groupType: '고급실' },
    { name: '2단', price: 16000000, feeType: 'USAGE', groupType: '고급실' },
    { name: '3단', price: 20000000, feeType: 'USAGE', groupType: '고급실' },
    { name: '4단', price: 24000000, feeType: 'USAGE', groupType: '고급실' },
    { name: '5단', price: 24000000, feeType: 'USAGE', groupType: '고급실' },
    { name: '6단', price: 24000000, feeType: 'USAGE', groupType: '고급실' },
    { name: '7단', price: 16000000, feeType: 'USAGE', groupType: '고급실' },
    { name: '8단', price: 9000000, feeType: 'USAGE', groupType: '고급실' },
    { name: '9단', price: 6000000, feeType: 'USAGE', groupType: '고급실' },
    // 특실 1~8단
    { name: '1단', price: 10000000, feeType: 'USAGE', groupType: '특실' },
    { name: '2단', price: 20000000, feeType: 'USAGE', groupType: '특실' },
    { name: '3단', price: 24000000, feeType: 'USAGE', groupType: '특실' },
    { name: '4단', price: 26000000, feeType: 'USAGE', groupType: '특실' },
    { name: '5단', price: 26000000, feeType: 'USAGE', groupType: '특실' },
    { name: '6단', price: 26000000, feeType: 'USAGE', groupType: '특실' },
    { name: '7단', price: 20000000, feeType: 'USAGE', groupType: '특실' },
    { name: '8단', price: 10000000, feeType: 'USAGE', groupType: '특실' },
    // VIP실 1~8단
    { name: '1단', price: 11000000, feeType: 'USAGE', groupType: 'VIP실' },
    { name: '2단', price: 22000000, feeType: 'USAGE', groupType: 'VIP실' },
    { name: '3단', price: 26000000, feeType: 'USAGE', groupType: 'VIP실' },
    { name: '4단', price: 30000000, feeType: 'USAGE', groupType: 'VIP실' },
    { name: '5단', price: 30000000, feeType: 'USAGE', groupType: 'VIP실' },
    { name: '6단', price: 30000000, feeType: 'USAGE', groupType: 'VIP실' },
    { name: '7단', price: 22000000, feeType: 'USAGE', groupType: 'VIP실' },
    { name: '8단', price: 11000000, feeType: 'USAGE', groupType: 'VIP실' },
    // 관리비 (5년 선납)
    { name: '관리비 (5년선납)', price: 600000, feeType: 'MAINTENANCE', groupType: '일반실' },
    { name: '관리비 (5년선납)', price: 700000, feeType: 'MAINTENANCE', groupType: 'VIP실' },
];

console.log('✅ 537 조안공원양주지사 수정:');
console.log('   개인(클래식): ' + sp[0].rows.length + '개');
console.log('   부부(프리미엄): ' + sp[1].rows.length + '개');

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('💾 저장 완료');
