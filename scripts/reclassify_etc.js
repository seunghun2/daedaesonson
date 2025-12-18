const fs = require('fs');
const path = require('path');

const FACILITIES_PATH = path.join(__dirname, '../data/facilities.json');
const facilities = JSON.parse(fs.readFileSync(FACILITIES_PATH, 'utf8'));

let changedCount = 0;

facilities.forEach(f => {
    if (f.category !== 'ETC') return;

    const name = f.name || '';
    let newCategory = null;

    // 이름 기반 분류
    if (name.includes('수목장') || name.includes('자연장')) {
        newCategory = 'NATURAL_BURIAL';
    } else if (name.includes('봉안') || name.includes('추모의집') || name.includes('추모당') || name.includes('숭조당') || name.includes('납골')) {
        newCategory = 'CHARNEL_HOUSE';
    } else if (name.includes('공원묘') || name.includes('묘지') || name.includes('묘원') || name.includes('매장')) {
        newCategory = 'FAMILY_GRAVE';
    } else if (name.includes('화장')) {
        newCategory = 'CREMATORIUM';
    }

    if (newCategory) {
        console.log(f.id + ':', f.name, '-> ' + newCategory);
        f.category = newCategory;
        changedCount++;
    } else {
        console.log('⚠️ 분류 실패:', f.id, f.name);
    }
});

console.log('\n✅ 변경:', changedCount, '개');

fs.writeFileSync(FACILITIES_PATH, JSON.stringify(facilities, null, 2), 'utf8');
console.log('💾 저장 완료');
