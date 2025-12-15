
const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../data/facilities.json');

function dedupIds() {
    console.log('🧹 ID 중복 제거 및 넘버링 재정비 (1~1498)...');

    const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
    const idCount0 = data.length;
    console.log(`📂 총 ${idCount0}개 데이터`);

    // 1. 순서는 이미 정렬되어 있다고 가정 (Sort script run previously)
    // 엑셀 순서와 최대한 맞추기 위해 인덱스 기반으로 전면 재발급하는 게 깔끔할 수 있음.
    // 하지만 기존 외부 링크(공유된 URL 등)가 있다면 ID 변경은 위험.
    // 여기서는 "중복된 놈들만" 찾아서 suffix 처리.

    const idMap = new Map(); // id -> count
    const uniqueData = [];

    // ID 출현 빈도 카운트
    data.forEach(item => {
        idMap.set(item.id, (idMap.get(item.id) || 0) + 1);
    });

    // 중복 ID 목록
    const duplicates = [];
    idMap.forEach((count, id) => {
        if (count > 1) duplicates.push(id);
    });
    console.log(`⚠️ 중복 ID 개수: ${duplicates.length}개 ID에서 충돌 발생`);

    // 중복 처리
    const seenIds = new Set();
    let renames = 0;

    const finalData = data.map((item) => {
        let newId = item.id;

        if (seenIds.has(newId)) {
            // 이미 등장한 ID라면 -dup 붙임
            let counter = 2;
            let candidate = `${newId}-dup`; // simple dup

            // 더 정교하게: park-0001 -> park-0001-2
            // 기존 ID 패턴 파싱
            if (newId.match(/^park-\d{4}$/)) {
                candidate = `${newId}-${counter}`;
            }

            // 충돌 안 날 때까지 증가
            while (seenIds.has(candidate)) {
                candidate = `${newId}-${++counter}`;
            }
            newId = candidate;
            renames++;
        }

        seenIds.add(newId);
        return { ...item, id: newId };
    });

    console.log(`✨ ${renames}개 시설의 ID가 중복 회피를 위해 변경됨.`);
    console.log(`✅ 최종 유니크 ID 개수: ${new Set(finalData.map(f => f.id)).size}/${finalData.length}`);

    fs.writeFileSync(JSON_PATH, JSON.stringify(finalData, null, 2));
    console.log('💾 facilities.json 저장 완료!');
}

dedupIds();
