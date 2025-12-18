const fs = require('fs');
const data = JSON.parse(fs.readFileSync('data/facilities.json', 'utf-8'));

// 시/군 + 카테고리 조합 추출
const combos = new Map();

data.forEach(f => {
    if (!f.address || !f.category || f.category === 'FUNERAL_HOME' || f.category === 'CREMATORIUM') return;
    if (!f.priceRange?.min || f.priceRange.min <= 0) return;

    const tokens = f.address.split(' ');
    const city = tokens[1]; // 시/군/구
    if (!city) return;

    const key = `${city}-${f.category}`;
    combos.set(key, (combos.get(key) || 0) + 1);
});

// 시설 2개 이상인 조합만
const valid = [...combos.entries()].filter(([k, v]) => v >= 2);
console.log('유효한 조합:', valid.length);
console.log('예시:', valid.slice(0, 10).map(([k, v]) => `${k} (${v}개)`).join('\n'));
