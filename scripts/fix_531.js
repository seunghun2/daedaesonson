const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const p = data.find(x => x.id === 'park-0531');
if (!p) { console.log('park-0531 not found'); process.exit(1); }

const sp = p.priceInfo.standardizedPrices;

// [0] 봉안당(개인) — 이미지 기준 전체 재구성
sp[0].rows = [
    // 일반실 개인단 1~9단
    { name: '1단', price: 4000000, feeType: 'USAGE', groupType: '일반실', isRepresentative: true },
    { name: '2단', price: 5100000, feeType: 'USAGE', groupType: '일반실' },
    { name: '3단', price: 5600000, feeType: 'USAGE', groupType: '일반실' },
    { name: '4단', price: 6000000, feeType: 'USAGE', groupType: '일반실' },
    { name: '5단', price: 6500000, feeType: 'USAGE', groupType: '일반실' },
    { name: '6단', price: 6000000, feeType: 'USAGE', groupType: '일반실' },
    { name: '7단', price: 5100000, feeType: 'USAGE', groupType: '일반실' },
    { name: '8단', price: 4000000, feeType: 'USAGE', groupType: '일반실' },
    { name: '9단', price: 2000000, feeType: 'USAGE', groupType: '일반실' },
    // 헤리티지 개인단 1~8단
    { name: '1단', price: 5000000, feeType: 'USAGE', groupType: '헤리티지' },
    { name: '2단', price: 6200000, feeType: 'USAGE', groupType: '헤리티지' },
    { name: '3단', price: 7000000, feeType: 'USAGE', groupType: '헤리티지' },
    { name: '4단', price: 7500000, feeType: 'USAGE', groupType: '헤리티지' },
    { name: '5단', price: 8500000, feeType: 'USAGE', groupType: '헤리티지' },
    { name: '6단', price: 7500000, feeType: 'USAGE', groupType: '헤리티지' },
    { name: '7단', price: 6200000, feeType: 'USAGE', groupType: '헤리티지' },
    { name: '8단', price: 5000000, feeType: 'USAGE', groupType: '헤리티지' },
    // 관리비
    { name: '관리비 (10년)', price: 800000, feeType: 'MAINTENANCE', groupType: '일반실' },
];

// [1] 봉안당(부부) — 이미지 기준 전체 재구성
sp[1].rows = [
    // 일반실 부부단 1~9단
    { name: '1단', price: 8000000, feeType: 'USAGE', groupType: '일반실' },
    { name: '2단', price: 10200000, feeType: 'USAGE', groupType: '일반실' },
    { name: '3단', price: 11200000, feeType: 'USAGE', groupType: '일반실' },
    { name: '4단', price: 12000000, feeType: 'USAGE', groupType: '일반실' },
    { name: '5단', price: 13000000, feeType: 'USAGE', groupType: '일반실' },
    { name: '6단', price: 12000000, feeType: 'USAGE', groupType: '일반실' },
    { name: '7단', price: 10200000, feeType: 'USAGE', groupType: '일반실' },
    { name: '8단', price: 8000000, feeType: 'USAGE', groupType: '일반실' },
    { name: '9단', price: 4000000, feeType: 'USAGE', groupType: '일반실' },
    // 특별실 부부단 1~7단
    { name: '1단', price: 18000000, feeType: 'USAGE', groupType: '특별실' },
    { name: '2단', price: 22000000, feeType: 'USAGE', groupType: '특별실' },
    { name: '3단', price: 25000000, feeType: 'USAGE', groupType: '특별실' },
    { name: '4단', price: 25000000, feeType: 'USAGE', groupType: '특별실' },
    { name: '5단', price: 25000000, feeType: 'USAGE', groupType: '특별실' },
    { name: '6단', price: 25000000, feeType: 'USAGE', groupType: '특별실' },
    { name: '7단', price: 22000000, feeType: 'USAGE', groupType: '특별실' },
    // 헤리티지 부부단 1~8단
    { name: '1단', price: 10000000, feeType: 'USAGE', groupType: '헤리티지' },
    { name: '2단', price: 12400000, feeType: 'USAGE', groupType: '헤리티지' },
    { name: '3단', price: 14000000, feeType: 'USAGE', groupType: '헤리티지' },
    { name: '4단', price: 15000000, feeType: 'USAGE', groupType: '헤리티지' },
    { name: '5단', price: 17000000, feeType: 'USAGE', groupType: '헤리티지' },
    { name: '6단', price: 15000000, feeType: 'USAGE', groupType: '헤리티지' },
    { name: '7단', price: 12400000, feeType: 'USAGE', groupType: '헤리티지' },
    { name: '8단', price: 10000000, feeType: 'USAGE', groupType: '헤리티지' },
    // 관리비
    { name: '관리비 (10년)', price: 1000000, feeType: 'MAINTENANCE', groupType: '특별실' },
];

console.log('✅ 531 모악추모공원 수정 완료:');
console.log('   개인: 일반실 9개 + 헤리티지 8개 + 관리비 1개 = ' + sp[0].rows.length + '개');
console.log('   부부: 일반실 9개 + 특별실 7개 + 헤리티지 8개 + 관리비 1개 = ' + sp[1].rows.length + '개');
console.log('   (신규일반실 제거, 특별실 개인→제거, 헤리티지 추가)');

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('💾 저장 완료');
