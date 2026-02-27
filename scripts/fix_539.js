const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const p = data.find(x => x.id === 'park-0539');
const sp = p.priceInfo.standardizedPrices;

// [0] 개인 — 프리미엄관에 마단 추가 (라단 뒤, 바단 앞)
const indRows = sp[0].rows;
const premIdxInd = indRows.findIndex(r => r.groupType === '프리미엄관' && r.name === '바단');
if (premIdxInd >= 0 && !indRows.some(r => r.groupType === '프리미엄관' && r.name === '마단')) {
    indRows.splice(premIdxInd, 0, { name: '마단', price: 5000000, feeType: 'USAGE', groupType: '프리미엄관' });
    console.log('✅ 개인 프리미엄관 마단(5,000,000) 추가');
}

// [1] 부부 — 프리미엄관에 마단 추가
const couRows = sp[1].rows;
const premIdxCou = couRows.findIndex(r => r.groupType === '프리미엄관' && r.name === '바단');
if (premIdxCou >= 0 && !couRows.some(r => r.groupType === '프리미엄관' && r.name === '마단')) {
    couRows.splice(premIdxCou, 0, { name: '마단', price: 10000000, feeType: 'USAGE', groupType: '프리미엄관' });
    console.log('✅ 부부 프리미엄관 마단(10,000,000) 추가');
}

console.log('   개인: ' + sp[0].rows.length + '개');
console.log('   부부: ' + sp[1].rows.length + '개');

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('💾 저장 완료');
