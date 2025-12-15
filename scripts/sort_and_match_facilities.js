const fs = require('fs');
const path = require('path');

// 1. facilities.json 읽기
const facilitiesPath = path.join(__dirname, '../data/facilities.json');
const facilities = JSON.parse(fs.readFileSync(facilitiesPath, 'utf-8'));

console.log(`✅ 총 시설 수: ${facilities.length}`);

// 2. ID 순서로 정렬 (park-0001 ~ park-1497)
const sorted = facilities.sort((a, b) => {
    const numA = parseInt(a.id.replace('park-', ''));
    const numB = parseInt(b.id.replace('park-', ''));
    return numA - numB;
});

console.log(`✅ ID 정렬 완료 (${sorted[0].id} ~ ${sorted[sorted.length - 1].id})`);

// 3. 정렬된 JSON 저장
fs.writeFileSync(facilitiesPath, JSON.stringify(sorted, null, 2), 'utf-8');
console.log(`✅ facilities.json 저장 완료\n`);

// 4. archive5_images 파일 목록 읽기
const archivePath = path.join(__dirname, '../archive5_images');
const files = fs.readdirSync(archivePath)
    .filter(f => f.includes('.') && !f.startsWith('.'))
    .filter(f => f.match(/^\d+\./)); // 숫자로 시작하는 파일만

// 5. 앞번호 추출
const archiveNumbers = files.map(f => parseInt(f.split('.')[0])).sort((a, b) => a - b);

console.log(`📁 archive5_images 파일 수: ${files.length}`);
console.log(`📁 앞번호 범위: ${archiveNumbers[0]} ~ ${archiveNumbers[archiveNumbers.length - 1]}\n`);

// 6. originalName과 매칭 확인
let matchCount = 0;
let mismatchCount = 0;
const mismatches = [];

sorted.forEach((facility, index) => {
    const expectedNum = index + 1; // 1-based index
    const originalName = facility.originalName;

    if (!originalName) {
        mismatchCount++;
        mismatches.push({
            index: index + 1,
            id: facility.id,
            name: facility.name,
            issue: 'originalName 없음'
        });
        return;
    }

    const actualNum = parseInt(originalName.split('.')[0]);

    if (actualNum === expectedNum) {
        matchCount++;
    } else {
        mismatchCount++;
        mismatches.push({
            index: expectedNum,
            id: facility.id,
            name: facility.name,
            originalName,
            expected: expectedNum,
            actual: actualNum,
            issue: '순서 불일치'
        });
    }
});

console.log(`\n=== 매칭 결과 ===`);
console.log(`✅ 일치: ${matchCount}`);
console.log(`❌ 불일치: ${mismatchCount}\n`);

if (mismatches.length > 0) {
    console.log(`\n🚨 불일치 목록 (최대 20개):\n`);
    mismatches.slice(0, 20).forEach(m => {
        console.log(`#${m.index} | ${m.id} | ${m.name}`);
        console.log(`   originalName: ${m.originalName}`);
        console.log(`   기대값: ${m.expected}, 실제값: ${m.actual || 'N/A'}`);
        console.log(`   문제: ${m.issue}\n`);
    });

    if (mismatches.length > 20) {
        console.log(`... 외 ${mismatches.length - 20}개\n`);
    }

    // 불일치 결과를 파일로 저장
    const mismatchPath = path.join(__dirname, '../mismatch_report.json');
    fs.writeFileSync(mismatchPath, JSON.stringify(mismatches, null, 2), 'utf-8');
    console.log(`📄 전체 불일치 목록 저장: mismatch_report.json\n`);
}

console.log(`\n✅ 작업 완료!`);
