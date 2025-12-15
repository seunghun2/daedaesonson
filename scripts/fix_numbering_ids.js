const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/facilities.json');

console.log('=== 1~10번 시설 ID 고정 설정 ===\n');

const facilities = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

// 1~10번 시설 ID를 고정값으로 설정
for (let i = 0; i < 10 && i < facilities.length; i++) {
    const facility = facilities[i];
    const oldId = facility.id;
    const newId = `park-${String(i + 1).padStart(3, '0')}`; // park-001, park-002, ...

    facility.id = newId;

    console.log(`${i + 1}. ${facility.name}`);
    console.log(`   ID: ${oldId} → ${newId}`);
}

// 저장
fs.writeFileSync(DATA_FILE, JSON.stringify(facilities, null, 2));

console.log('\n✅ ID 고정 완료!');
console.log('\n고정된 ID:');
facilities.slice(0, 10).forEach((f, idx) => {
    console.log(`  ${idx + 1}. ${f.id} - ${f.name}`);
});
