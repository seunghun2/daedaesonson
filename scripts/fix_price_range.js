const fs = require('fs');
const path = require('path');

const FACILITIES_PATH = path.join(__dirname, '../data/facilities.json');
const facilities = JSON.parse(fs.readFileSync(FACILITIES_PATH, 'utf8'));

const validCategories = ['매장묘', '봉안당', '수목장', '봉안묘', '화장시설', '공원묘지', '옵션'];
let fixedCount = 0;

facilities.forEach(f => {
    if (!f.priceInfo?.priceTable) return;

    const cats = Object.keys(f.priceInfo.priceTable);
    const hasValid = cats.some(c => validCategories.some(v => c.includes(v)));

    // 유효 카테고리 없으면 priceRange를 0으로
    if (!hasValid) {
        if (f.priceRange?.min > 0 || f.priceRange?.max > 0) {
            console.log(f.id + ': ' + cats.join(', ') + ' -> 0원으로 변경');
            f.priceRange = { min: 0, max: 0 };
            fixedCount++;
        }
    }
});

console.log('\n✅ 수정:', fixedCount, '개');

fs.writeFileSync(FACILITIES_PATH, JSON.stringify(facilities, null, 2), 'utf8');
console.log('💾 저장 완료');
