
const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../data/facilities.json');

function sortFacilitiesStrictly() {
    console.log('📏 ID 번호 순서대로 줄 세우기 (데이터 변경 없음)...');

    const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
    console.log(`📂 총 ${data.length}개 로드됨`);

    // 현재 늘푸른목장(park-1208) 위치 확인
    const beforeIdx = data.findIndex(f => f.id === 'park-1208');
    console.log(`🧩 [정렬 전] park-1208 위치: ${beforeIdx + 1}번째`);

    // 정렬 ( park-0001 -> park-0002 -> ... -> park-1498 )
    data.sort((a, b) => {
        // 숫자 부분만 추출해서 비교
        const numA = parseInt(a.id.replace(/[^0-9]/g, '')) || 99999;
        const numB = parseInt(b.id.replace(/[^0-9]/g, '')) || 99999;

        if (numA !== numB) return numA - numB;

        // 숫자가 같으면(park-0001 vs park-0001-2) 문자열 길이로 비교 (짧은게 원조)
        return a.id.length - b.id.length || a.id.localeCompare(b.id);
    });

    // 정렬 후 확인
    const afterIdx = data.findIndex(f => f.id === 'park-1208');
    console.log(`✨ [정렬 후] park-1208 위치: ${afterIdx + 1}번째`);
    console.log(`   첫번째: ${data[0].id} (${data[0].name})`);
    console.log(`   마지막: ${data[data.length - 1].id} (${data[data.length - 1].name})`);

    fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2));
    console.log('💾 facilities.json 저장 완료!');
}

sortFacilitiesStrictly();
