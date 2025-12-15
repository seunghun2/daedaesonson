const fs = require('fs');
const path = require('path');

// 1. facilities.json 읽기
const facilitiesPath = path.join(__dirname, '../data/facilities.json');
const facilities = JSON.parse(fs.readFileSync(facilitiesPath, 'utf-8'));

console.log(`📊 총 시설 수: ${facilities.length}\n`);

// 2. ID 패턴 분석
const idPattern = {};
const duplicates = [];
const nonStandard = [];

facilities.forEach((f, index) => {
    const id = f.id;

    // ID 카운트
    if (!idPattern[id]) {
        idPattern[id] = [];
    }
    idPattern[id].push({ index: index + 1, name: f.name });

    // 중복 체크
    if (idPattern[id].length > 1) {
        duplicates.push(id);
    }

    // park-XXXX 패턴이 아닌 경우
    if (!id.match(/^park-\d{4}(-\d+)?$/)) {
        nonStandard.push({ id, name: f.name });
    }
});

// 3. 중복 ID 출력
if (duplicates.length > 0) {
    console.log(`🚨 중복 ID 발견 (${duplicates.length}개):\n`);
    [...new Set(duplicates)].slice(0, 20).forEach(id => {
        console.log(`  ${id}:`);
        idPattern[id].forEach(item => {
            console.log(`    #${item.index}: ${item.name}`);
        });
    });
    console.log();
}

// 4. 비표준 ID 출력
if (nonStandard.length > 0) {
    console.log(`⚠️  비표준 ID 발견 (${nonStandard.length}개):\n`);
    nonStandard.slice(0, 10).forEach(item => {
        console.log(`  ${item.id}: ${item.name}`);
    });
    if (nonStandard.length > 10) {
        console.log(`  ... 외 ${nonStandard.length - 10}개`);
    }
    console.log();
}

// 5. ID 번호 범위 확인
const baseIds = facilities
    .map(f => f.id.replace(/park-/, '').split('-')[0])
    .map(n => parseInt(n))
    .filter(n => !isNaN(n))
    .sort((a, b) => a - b);

const minId = baseIds[0];
const maxId = baseIds[baseIds.length - 1];
const uniqueBaseIds = [...new Set(baseIds)];

console.log(`📋 ID 범위:`);
console.log(`  최소: park-${String(minId).padStart(4, '0')}`);
console.log(`  최대: park-${String(maxId).padStart(4, '0')}`);
console.log(`  고유 기본 ID 수: ${uniqueBaseIds.length}\n`);

// 6. 누락된 번호 확인
const missing = [];
for (let i = minId; i <= maxId; i++) {
    if (!uniqueBaseIds.includes(i)) {
        missing.push(i);
    }
}

if (missing.length > 0) {
    console.log(`❌ 누락된 번호 (${missing.length}개):\n`);
    console.log(`  ${missing.slice(0, 20).map(n => `park-${String(n).padStart(4, '0')}`).join(', ')}`);
    if (missing.length > 20) {
        console.log(`  ... 외 ${missing.length - 20}개`);
    }
    console.log();
}

// 7. 제안: 클린업 전략
console.log(`\n💡 동기화 전략 제안:\n`);
console.log(`1. 중복 ID 제거 (예: park-0002-2 → 별도 시설로 분리)`);
console.log(`2. 누락된 번호 채우기 또는 번호 재정렬`);
console.log(`3. originalName 필드 생성 (archive5_images 파일명과 매칭)`);
console.log(`4. URL 파라미터 (?id=park-XXXX)와 완벽 동기화\n`);
console.log(`✅ 작업 완료!`);
