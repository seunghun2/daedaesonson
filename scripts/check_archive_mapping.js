const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/facilities.json');
const ARCHIVE_DIR = path.join(__dirname, '../archive');

console.log('=== archive 1~10번 시설 제자리 업데이트 ===\n');

const facilities = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
const archiveFolders = fs.readdirSync(ARCHIVE_DIR).filter(f => !f.startsWith('.'));

// archive 1~10번 폴더명
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

console.log('archive 1~10번:');
top10Folders.forEach(f => console.log(`  ${f}`));
console.log('');

// 각 폴더와 매칭되는 시설 찾아서 제자리 업데이트
top10Folders.forEach((folder, idx) => {
    const folderName = folder.split('.').slice(1).join('.'); // "1.(재)낙원추모공원" -> "(재)낙원추모공원"

    // facilities에서 찾기
    const facilityIndex = facilities.findIndex(f => {
        const name = f.originalName || f.name;
        return name.includes(folderName) || f.name.includes(folderName);
    });

    if (facilityIndex !== -1) {
        const facility = facilities[facilityIndex];
        console.log(`✅ ${idx + 1}. ${folder} → facilities[${facilityIndex}] ${facility.name}`);

        // 여기서 priceTable 업데이트
        // (이미 표준화된 데이터가 있다면 그대로 유지)
    } else {
        console.log(`❌ ${idx + 1}. ${folder} → 매칭 안 됨`);
    }
});

console.log('\n✅ 확인 완료!');
console.log('관리자 페이지 번호가 맞는지 확인하세요.');
