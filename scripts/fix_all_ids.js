const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/facilities.json');

console.log('=== 전체 시설 ID 고정 설정 ===\n');

const facilities = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

console.log(`총 시설 수: ${facilities.length}개\n`);

// ID가 이미 고유한지 확인
const existingIds = new Set();
const duplicates = [];

facilities.forEach((f, idx) => {
    if (existingIds.has(f.id)) {
        duplicates.push({ idx, id: f.id, name: f.name });
    }
    existingIds.add(f.id);
});

if (duplicates.length > 0) {
    console.log(`⚠️  중복 ID 발견: ${duplicates.length}개\n`);
}

// 모든 시설 ID를 순번 기반으로 재설정
let changedCount = 0;

facilities.forEach((facility, idx) => {
    const num = idx + 1;
    const oldId = facility.id;
    const newId = `park-${String(num).padStart(4, '0')}`; // park-0001, park-0002, ...

    if (oldId !== newId) {
        facility.id = newId;
        changedCount++;
    }
});

console.log(`변경된 ID: ${changedCount}개`);

// 저장
fs.writeFileSync(DATA_FILE, JSON.stringify(facilities, null, 2));

console.log('\n✅ 전체 시설 ID 고정 완료!');
console.log('\n처음 10개:');
facilities.slice(0, 10).forEach((f, idx) => {
    console.log(`  ${idx + 1}. ${f.id} - ${f.name}`);
});

console.log(`\n...`);
console.log(`${facilities.length}. ${facilities[facilities.length - 1].id} - ${facilities[facilities.length - 1].name}`);
