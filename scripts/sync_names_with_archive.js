const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/facilities.json');
const ARCHIVE_DIR = path.join(__dirname, '../archive');

console.log('=== archive 폴더명 기준으로 시설명 통일 ===\n');

const facilities = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
const archiveFolders = fs.readdirSync(ARCHIVE_DIR).filter(f => !f.startsWith('.'));

// archive 1~10번
const archive110 = archiveFolders
    .filter(f => {
        const num = parseInt(f.match(/^\d+/));
        return num >= 1 && num <= 10;
    })
    .sort((a, b) => {
        const numA = parseInt(a.match(/^\d+/));
        const numB = parseInt(b.match(/^\d+/));
        return numA - numB;
    });

console.log('Archive 1~10번:');
archive110.forEach(f => console.log(`  ${f}`));
console.log('');

let updateCount = 0;

// facilities 1~10번과 매칭
archive110.forEach((folderName, idx) => {
    const facility = facilities[idx];
    const archiveName = folderName.replace(/^\d+\./, ''); // "1.(재)낙원추모공원" -> "(재)낙원추모공원"

    if (facility) {
        const oldName = facility.name;

        // originalName 저장 (없으면)
        if (!facility.originalName) {
            facility.originalName = oldName;
        }

        // 이름 통일
        facility.name = archiveName;

        if (oldName !== archiveName) {
            console.log(`${idx + 1}. "${oldName}" → "${archiveName}"`);
            updateCount++;
        } else {
            console.log(`${idx + 1}. "${archiveName}" (변경없음)`);
        }
    }
});

console.log(`\n✅ ${updateCount}개 시설명 변경됨`);

// 저장
fs.writeFileSync(DATA_FILE, JSON.stringify(facilities, null, 2));

console.log('\n✅ 저장 완료!');
console.log('브라우저 새로고침 후 확인하세요.');
