const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/facilities.json');

console.log('=== facilities.json 정렬 (originalName 기준) ===\n');

const facilities = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

// originalName으로 정렬
const sorted = facilities.sort((a, b) => {
    const nameA = a.originalName || a.name;
    const nameB = b.originalName || b.name;

    // 숫자 추출
    const numA = parseInt(nameA.match(/^\d+/) || '9999');
    const numB = parseInt(nameB.match(/^\d+/) || '9999');

    if (numA !== numB) return numA - numB;
    return nameA.localeCompare(nameB);
});

// 저장
fs.writeFileSync(DATA_FILE, JSON.stringify(sorted, null, 2));

console.log('✅ 정렬 완료!');
console.log('\n처음 10개:');
sorted.slice(0, 10).forEach((f, idx) => {
    console.log(`${idx + 1}. ${f.originalName || f.name}`);
});
