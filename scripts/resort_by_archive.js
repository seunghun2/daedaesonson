const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/facilities.json');
const ARCHIVE_DIR = path.join(__dirname, '../archive');

console.log('=== facilities.json을 archive 순서로 재정렬 ===\n');

const facilities = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
const archiveFolders = fs.readdirSync(ARCHIVE_DIR)
    .filter(f => !f.startsWith('.'))
    .sort((a, b) => {
        const numA = parseInt(a.match(/^\d+/) || '9999');
        const numB = parseInt(b.match(/^\d+/) || '9999');
        return numA - numB;
    });

console.log('Archive 순서 (처음 10개):');
archiveFolders.slice(0, 10).forEach(f => console.log(`  ${f}`));

// Archive 폴더 순서대로 시설 찾아서 재정렬
const sorted = [];
const used = new Set();

archiveFolders.forEach(folder => {
    const folderName = folder.replace(/^\d+\./, ''); // "1.(재)낙원추모공원" -> "(재)낙원추모공원"

    const facility = facilities.find(f => {
        const name = (f.originalName || f.name).replace(/^\d+\./, '');
        return name === folderName && !used.has(f.id);
    });

    if (facility) {
        sorted.push(facility);
        used.add(facility.id);
    }
});

// 나머지 시설들 추가
facilities.forEach(f => {
    if (!used.has(f.id)) {
        sorted.push(f);
    }
});

console.log(`\n재정렬 완료: ${sorted.length}개 시설`);
console.log('\n처음 5개:');
sorted.slice(0, 5).forEach((f, idx) => {
    console.log(`  ${idx + 1}. ${f.name}`);
});

// 저장
fs.writeFileSync(DATA_FILE, JSON.stringify(sorted, null, 2));
console.log('\n✅ 저장 완료!');
