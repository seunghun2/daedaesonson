const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const p = data.find(x => x.id === 'park-0538');
const sp = p.priceInfo.standardizedPrices;

// 실제 가격표 기준 (단위: 만원)
// 1층: 개인 200,300,400 / 부부 400,550,700 (2007년 봉안시작)
// 복2층: 개인 400,500,600,700,700,600,500,400 / 부부 800,1000,1200,1300,1300,1200,1000,800 (2011년 3월~)

// [0] 봉안당(개인)
sp[0].rows = [
    // 1층 (3단)
    { name: '1층 하단', price: 2000000, feeType: 'USAGE', groupType: '1층', isRepresentative: true },
    { name: '1층 중단', price: 3000000, feeType: 'USAGE', groupType: '1층' },
    { name: '1층 상단', price: 4000000, feeType: 'USAGE', groupType: '1층' },
    // 복2층 (8단) - 아래→위 순서
    { name: '1단', price: 4000000, feeType: 'USAGE', groupType: '복2층' },
    { name: '2단', price: 5000000, feeType: 'USAGE', groupType: '복2층' },
    { name: '3단', price: 6000000, feeType: 'USAGE', groupType: '복2층' },
    { name: '4단', price: 7000000, feeType: 'USAGE', groupType: '복2층' },
    { name: '5단', price: 7000000, feeType: 'USAGE', groupType: '복2층' },
    { name: '6단', price: 6000000, feeType: 'USAGE', groupType: '복2층' },
    { name: '7단', price: 5000000, feeType: 'USAGE', groupType: '복2층' },
    { name: '8단', price: 4000000, feeType: 'USAGE', groupType: '복2층' },
];

// [1] 봉안당(부부)
sp[1].rows = [
    // 1층 (3단)
    { name: '1층 하단', price: 4000000, feeType: 'USAGE', groupType: '1층' },
    { name: '1층 중단', price: 5500000, feeType: 'USAGE', groupType: '1층' },
    { name: '1층 상단', price: 7000000, feeType: 'USAGE', groupType: '1층' },
    // 복2층 (8단)
    { name: '1단', price: 8000000, feeType: 'USAGE', groupType: '복2층' },
    { name: '2단', price: 10000000, feeType: 'USAGE', groupType: '복2층' },
    { name: '3단', price: 12000000, feeType: 'USAGE', groupType: '복2층' },
    { name: '4단', price: 13000000, feeType: 'USAGE', groupType: '복2층' },
    { name: '5단', price: 13000000, feeType: 'USAGE', groupType: '복2층' },
    { name: '6단', price: 12000000, feeType: 'USAGE', groupType: '복2층' },
    { name: '7단', price: 10000000, feeType: 'USAGE', groupType: '복2층' },
    { name: '8단', price: 8000000, feeType: 'USAGE', groupType: '복2층' },
];

console.log('✅ 538 약사사지장전추모관 수정 (실제 가격표):');
console.log('   개인: ' + sp[0].rows.length + '개 (1층3 + 복2층8)');
console.log('   부부: ' + sp[1].rows.length + '개 (1층3 + 복2층8)');

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('💾 저장 완료');
