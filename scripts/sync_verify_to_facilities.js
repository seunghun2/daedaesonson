const fs = require('fs');
const path = require('path');

// facilities.json 로드
const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));

// verify_*.json 파일들  찾기
const dataDir = 'data';
const verifyFiles = fs.readdirSync(dataDir)
    .filter(f => f.startsWith('verify_') && f.endsWith('.json'))
    .sort((a, b) => {
        const numA = parseInt(a.match(/\d+/)?.[0] || '0');
        const numB = parseInt(b.match(/\d+/)?.[0] || '0');
        return numA - numB;
    });

console.log(`📁 발견된 verify 파일: ${verifyFiles.length}개`);

let updated = 0;
let skipped = 0;
let missingFacilities = [];

for (const verifyFile of verifyFiles) {
    const verifyPath = path.join(dataDir, verifyFile);
    const verifyData = JSON.parse(fs.readFileSync(verifyPath, 'utf8'));

    const facilityId = verifyData.facilityId;
    if (!facilityId) {
        skipped++;
        continue;
    }

    // facilities.json에서 해당 시설 찾기
    const facility = facilities.find(f => f.id === facilityId);
    if (!facility) {
        missingFacilities.push(facilityId);
        skipped++;
        continue;
    }

    // 주차 정보 추출
    if (verifyData.parking) {
        if (!facility.amenities) facility.amenities = {};
        facility.amenities.parking = verifyData.parking;
    }

    // 총매장능력 추출
    if (verifyData.capacity) {
        facility.capacity = parseInt(verifyData.capacity);
    }

    updated++;
    if (updated % 100 === 0) {
        console.log(`   진행중... ${updated}/${verifyFiles.length}`);
    }
}

// 저장
fs.writeFileSync('data/facilities.json', JSON.stringify(facilities, null, 2), 'utf8');

console.log(`\n✅ 완료!`);
console.log(`   업데이트: ${updated}개`);
console.log(`   건너뜀: ${skipped}개`);
if (missingFacilities.length > 0) {
    console.log(`\n⚠️  facilities.json에 없는 ID: ${missingFacilities.length}개`);
    console.log(missingFacilities.slice(0, 10).join(', '));
    if (missingFacilities.length > 10) {
        console.log(`   ... 외 ${missingFacilities.length - 10}개`);
    }
}
