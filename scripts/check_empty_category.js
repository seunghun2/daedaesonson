const fs = require('fs');
const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));

// 카테고리 없거나 빈 시설 확인
const empty = facilities.filter(f => !f.category || f.category === '');
console.log('카테고리 없는 시설:', empty.length, '개\n');
empty.forEach(f => {
    console.log('-', f.id, f.name);
});
