
const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../data/facilities.json');

function sortFacilitiesById() {
    console.log('🔄 facilities.json ID 기준 오름차순 정렬 시작...');

    const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
    console.log(`📂 총 ${data.length}개 로드됨`);

    // 정렬 (숫자 기준)
    data.sort((a, b) => {
        const numA = parseInt(a.id.replace(/[^0-9]/g, '')) || 0;
        const numB = parseInt(b.id.replace(/[^0-9]/g, '')) || 0;

        // 숫자가 같으면 (예: park-0001 vs park-dup-0001), 문자열 길이로 2차 정렬 (짧은 게 원본일 가능성)
        if (numA === numB) {
            return a.id.length - b.id.length || a.id.localeCompare(b.id);
        }
        return numA - numB;
    });

    fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2));
    console.log('💾 정렬 후 저장 완료!');

    // 검증
    console.log('👀 상위 5개 ID:', data.slice(0, 5).map(f => f.id));
    console.log('👀 하위 5개 ID:', data.slice(-5).map(f => f.id));
}

sortFacilitiesById();
