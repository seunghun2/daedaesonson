const fs = require('fs');
const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));

const validCategories = ['매장묘', '봉안당', '수목장', '봉안묘', '화장시설', '공원묘지', '옵션'];

// 유효 카테고리 없이 기타/제외됨만 있는 시설
let count = 0;
facilities.filter(f => f.priceInfo?.priceTable).forEach(f => {
    const cats = Object.keys(f.priceInfo.priceTable);
    const hasValid = cats.some(c => validCategories.some(v => c.includes(v)));

    if (!hasValid && f.priceRange?.min > 0) {
        console.log(f.id + ':', cats.join(', '), '-> priceRange:', f.priceRange.min, '만원');
        count++;
    }
});
console.log('\n총', count, '개 문제 있음');
