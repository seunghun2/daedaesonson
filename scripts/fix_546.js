const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const src = data.find(x => x.id === 'park-0540'); // 유토피아추모공원(헤리티지관) - 이미 전체 데이터 있음
const dst = data.find(x => x.id === 'park-0546'); // 유토피아추모관

if (!src || !dst) { console.log('❌ 시설을 찾을 수 없음'); process.exit(); }

// 540 데이터를 546에 복사 (같은 사이트 utopia.co.kr 동일 가격)
dst.priceInfo.standardizedPrices = JSON.parse(JSON.stringify(src.priceInfo.standardizedPrices));

console.log('✅ 546 유토피아추모관 ← 540 데이터 복사');
dst.priceInfo.standardizedPrices.forEach((s, i) => {
    console.log('  [' + i + '] ' + s.serviceType + ' / ' + s.subType + ': ' + s.rows.length + '개');
});
const total = dst.priceInfo.standardizedPrices.reduce((sum, s) => sum + s.rows.length, 0);
console.log('  총: ' + total + '개');

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('💾 저장 완료');
