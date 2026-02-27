const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const p = data.find(x => x.id === 'park-0535');
const sp = p.priceInfo.standardizedPrices;

// [0] 봉안당(개인) — VVIP 추가 + 관리비
sp[0].rows = [
    // PREMIUM (일반실) 1~10단 — 기존 동일
    { name: '1단', price: 3500000, feeType: 'USAGE', groupType: '일반실', isRepresentative: true },
    { name: '2단', price: 4500000, feeType: 'USAGE', groupType: '일반실' },
    { name: '3단', price: 6000000, feeType: 'USAGE', groupType: '일반실' },
    { name: '4단', price: 6500000, feeType: 'USAGE', groupType: '일반실' },
    { name: '5단', price: 7000000, feeType: 'USAGE', groupType: '일반실' },
    { name: '6단', price: 7000000, feeType: 'USAGE', groupType: '일반실' },
    { name: '7단', price: 5500000, feeType: 'USAGE', groupType: '일반실' },
    { name: '8단', price: 4000000, feeType: 'USAGE', groupType: '일반실' },
    { name: '9단', price: 3000000, feeType: 'USAGE', groupType: '일반실' },
    { name: '10단', price: 2000000, feeType: 'USAGE', groupType: '일반실' },
    // VIP 1~8단 — 기존 동일
    { name: '1단', price: 7500000, feeType: 'USAGE', groupType: 'VIP실' },
    { name: '2단', price: 8500000, feeType: 'USAGE', groupType: 'VIP실' },
    { name: '3단', price: 10000000, feeType: 'USAGE', groupType: 'VIP실' },
    { name: '4단', price: 11000000, feeType: 'USAGE', groupType: 'VIP실' },
    { name: '5단', price: 12000000, feeType: 'USAGE', groupType: 'VIP실' },
    { name: '6단', price: 12000000, feeType: 'USAGE', groupType: 'VIP실' },
    { name: '7단', price: 9000000, feeType: 'USAGE', groupType: 'VIP실' },
    { name: '8단', price: 7000000, feeType: 'USAGE', groupType: 'VIP실' },
    // VVIP 1~8단 — 신규!
    { name: '1단', price: 10000000, feeType: 'USAGE', groupType: 'VVIP실' },
    { name: '2단', price: 15000000, feeType: 'USAGE', groupType: 'VVIP실' },
    { name: '3단', price: 17500000, feeType: 'USAGE', groupType: 'VVIP실' },
    { name: '4단', price: 22500000, feeType: 'USAGE', groupType: 'VVIP실' },
    { name: '5단', price: 22500000, feeType: 'USAGE', groupType: 'VVIP실' },
    { name: '6단', price: 22500000, feeType: 'USAGE', groupType: 'VVIP실' },
    { name: '7단', price: 15000000, feeType: 'USAGE', groupType: 'VVIP실' },
    { name: '8단', price: 10000000, feeType: 'USAGE', groupType: 'VVIP실' },
    // 관리비
    { name: '관리비 (1년/1위)', price: 50000, feeType: 'MAINTENANCE' },
];

// [1] 봉안당(부부) — VIP 1단 수정 + VVIP 추가 + 관리비
sp[1].rows = [
    // PREMIUM 1~10단
    { name: '1단', price: 7000000, feeType: 'USAGE', groupType: '일반실' },
    { name: '2단', price: 9000000, feeType: 'USAGE', groupType: '일반실' },
    { name: '3단', price: 12000000, feeType: 'USAGE', groupType: '일반실' },
    { name: '4단', price: 13000000, feeType: 'USAGE', groupType: '일반실' },
    { name: '5단', price: 14000000, feeType: 'USAGE', groupType: '일반실' },
    { name: '6단', price: 14000000, feeType: 'USAGE', groupType: '일반실' },
    { name: '7단', price: 11000000, feeType: 'USAGE', groupType: '일반실' },
    { name: '8단', price: 8000000, feeType: 'USAGE', groupType: '일반실' },
    { name: '9단', price: 6000000, feeType: 'USAGE', groupType: '일반실' },
    { name: '10단', price: 4000000, feeType: 'USAGE', groupType: '일반실' },
    // VIP 1~8단 (1단 수정: 14M→15M)
    { name: '1단', price: 15000000, feeType: 'USAGE', groupType: 'VIP실' },
    { name: '2단', price: 17000000, feeType: 'USAGE', groupType: 'VIP실' },
    { name: '3단', price: 20000000, feeType: 'USAGE', groupType: 'VIP실' },
    { name: '4단', price: 22000000, feeType: 'USAGE', groupType: 'VIP실' },
    { name: '5단', price: 24000000, feeType: 'USAGE', groupType: 'VIP실' },
    { name: '6단', price: 24000000, feeType: 'USAGE', groupType: 'VIP실' },
    { name: '7단', price: 18000000, feeType: 'USAGE', groupType: 'VIP실' },
    { name: '8단', price: 14000000, feeType: 'USAGE', groupType: 'VIP실' },
    // VVIP 1~8단 — 신규!
    { name: '1단', price: 20000000, feeType: 'USAGE', groupType: 'VVIP실' },
    { name: '2단', price: 30000000, feeType: 'USAGE', groupType: 'VVIP실' },
    { name: '3단', price: 35000000, feeType: 'USAGE', groupType: 'VVIP실' },
    { name: '4단', price: 45000000, feeType: 'USAGE', groupType: 'VVIP실' },
    { name: '5단', price: 45000000, feeType: 'USAGE', groupType: 'VVIP실' },
    { name: '6단', price: 45000000, feeType: 'USAGE', groupType: 'VVIP실' },
    { name: '7단', price: 30000000, feeType: 'USAGE', groupType: 'VVIP실' },
    { name: '8단', price: 20000000, feeType: 'USAGE', groupType: 'VVIP실' },
    // 관리비
    { name: '관리비 (1년/1위)', price: 50000, feeType: 'MAINTENANCE' },
];

console.log('✅ 535 청련사극락원 수정:');
console.log('   개인: ' + sp[0].rows.length + '개 (PREMIUM10 + VIP8 + VVIP8 + 관리비)');
console.log('   부부: ' + sp[1].rows.length + '개 (VIP 1단 15M수정 + VVIP8 추가)');

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('💾 저장 완료');
