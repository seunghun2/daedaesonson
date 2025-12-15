const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/facilities.json');
const ARCHIVE_DIR = path.join(__dirname, '../archive');

console.log('=== Top 10 시설을 맨 앞으로 이동 ===\n');

const facilities = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
const archiveFolders = fs.readdirSync(ARCHIVE_DIR).filter(f => !f.startsWith('.'));

// Top 10 폴더명
const top10Folders = archiveFolders
    .filter(f => {
        const num = parseInt(f.match(/^\d+/));
        return num >= 1 && num <= 10;
    })
    .sort((a, b) => {
        const numA = parseInt(a.match(/^\d+/));
        const numB = parseInt(b.match(/^\d+/));
        return numA - numB;
    });

console.log('Top 10 폴더:');
top10Folders.forEach(f => console.log(`  - ${f}`));

// 각 폴더에 해당하는 시설 찾기
const top10Facilities = [];
const remainingFacilities = [];

facilities.forEach(facility => {
    const originalName = facility.originalName || facility.name;
    const isTop10 = top10Folders.some(folder => {
        // 폴더명에서 번호와 시설명 추출
        const folderName = folder.split('.').slice(1).join('.'); // "1.(재)낙원추모공원" -> "(재)낙원추모공원"
        return originalName.includes(folderName) || facility.name.includes(folderName);
    });

    if (isTop10) {
        top10Facilities.push(facility);
    } else {
        remainingFacilities.push(facility);
    }
});

console.log(`\nTop 10 시설 발견: ${top10Facilities.length}개`);
top10Facilities.forEach((f, idx) => {
    console.log(`  ${idx + 1}. ${f.name}`);
});

// Top 10을 맨 앞에 배치
const reordered = [...top10Facilities, ...remainingFacilities];

// 저장
fs.writeFileSync(DATA_FILE, JSON.stringify(reordered, null, 2));

console.log('\n✅ 저장 완료!');
console.log('브라우저 새로고침 후 확인하세요.');
