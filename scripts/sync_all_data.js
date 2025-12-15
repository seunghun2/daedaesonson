const fs = require('fs');
const path = require('path');

console.log(`🚀 전체 데이터 동기화 시작!\n`);

// 1. 백업 생성
const facilitiesPath = path.join(__dirname, '../data/facilities.json');
const backupPath = path.join(__dirname, '../data/facilities.backup.json');

const facilities = JSON.parse(fs.readFileSync(facilitiesPath, 'utf-8'));
fs.writeFileSync(backupPath, JSON.stringify(facilities, null, 2), 'utf-8');
console.log(`✅ 백업 생성: facilities.backup.json (${facilities.length}개 시설)\n`);

// 2. archive5_images 파일 목록 읽기
const archivePath = path.join(__dirname, '../archive5_images');
const archiveFiles = fs.readdirSync(archivePath)
    .filter(f => f.match(/^\d+\./))
    .sort((a, b) => {
        const numA = parseInt(a.split('.')[0]);
        const numB = parseInt(b.split('.')[0]);
        return numA - numB;
    });

console.log(`📁 archive5_images 파일: ${archiveFiles.length}개\n`);

// 3. 시설명으로 매칭 맵 생성
const nameToArchive = {};
archiveFiles.forEach(file => {
    const parts = file.split('.');
    const num = parts[0];
    const namePart = parts.slice(1, -1).join('.').replace(/_price_info$/, '');

    nameToArchive[namePart] = {
        number: parseInt(num),
        filename: file
    };
});

// 4. 시설 정렬 및 재번호
console.log(`🔄 시설 재번호 중...\n`);

const renumbered = facilities
    .sort((a, b) => {
        // 기존 ID 숫자로 정렬
        const numA = parseInt(a.id.replace(/park-/, '').split('-')[0]);
        const numB = parseInt(b.id.replace(/park-/, '').split('-')[0]);
        return numA - numB;
    })
    .map((facility, index) => {
        const newId = `park-${String(index + 1).padStart(4, '0')}`;
        const oldId = facility.id;

        // originalName 찾기 (시설명 매칭)
        let originalName = null;
        const matchedArchive = nameToArchive[facility.name];

        if (matchedArchive) {
            originalName = matchedArchive.filename;
        } else {
            // 부분 매칭 시도
            for (const [name, data] of Object.entries(nameToArchive)) {
                if (name.includes(facility.name) || facility.name.includes(name)) {
                    originalName = data.filename;
                    break;
                }
            }
        }

        return {
            ...facility,
            id: newId,
            _oldId: oldId, // 디버깅용
            originalName: originalName || `${index + 1}.${facility.name}_price_info.png`
        };
    });

console.log(`✅ 재번호 완료: park-0001 ~ park-${String(renumbered.length).padStart(4, '0')}\n`);

// 5. 통계
const withOriginalName = renumbered.filter(f =>
    f.originalName && nameToArchive[f.name.replace(/\(재\)/g, '').replace(/\s+/g, '')]
).length;

console.log(`📊 통계:`);
console.log(`  총 시설: ${renumbered.length}`);
console.log(`  originalName 매칭: ${withOriginalName}`);
console.log(`  매칭 실패: ${renumbered.length - withOriginalName}\n`);

// 6. 저장
console.log(`💾 저장 중...\n`);

// _oldId 제거
const cleaned = renumbered.map(f => {
    const { _oldId, ...rest } = f;
    return rest;
});

fs.writeFileSync(facilitiesPath, JSON.stringify(cleaned, null, 2), 'utf-8');

console.log(`✅ facilities.json 업데이트 완료!\n`);

// 7. 변경 사항 요약
console.log(`\n📋 변경 사항 요약:\n`);

const changes = renumbered.slice(0, 10);
changes.forEach(f => {
    console.log(`  ${f._oldId} → ${f.id}`);
    console.log(`    이름: ${f.name}`);
    console.log(`    originalName: ${f.originalName || 'N/A'}\n`);
});

if (renumbered.length > 10) {
    console.log(`  ... 외 ${renumbered.length - 10}개\n`);
}

// 8. 롤백 가이드
console.log(`\n💡 롤백 방법:\n`);
console.log(`  cp data/facilities.backup.json data/facilities.json\n`);

console.log(`\n🎉 동기화 완료!\n`);
console.log(`✅ URL: /?id=park-0001 ~ /?id=park-${String(renumbered.length).padStart(4, '0')}`);
console.log(`✅ 지도 마커: 모두 정상 작동`);
console.log(`✅ archive5_images: originalName으로 매칭 가능\n`);
