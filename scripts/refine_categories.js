const fs = require('fs');
const path = require('path');

const CSV_FILE = 'data/pricing_all.csv';

// 정교한 카테고리 매핑 함수
function refineCategory(itemName) {
    const n = itemName.replace(/\s+/g, '').toLowerCase();

    // 1. 기본비용 (명확한 관리비/사용료)
    // "석 사용료", "묘테 사용료" 같은건 보통 없고, "묘지 사용료", "관리비" 등임
    if ((n.includes('관리비') || n.includes('사용료') || n.includes('임대료')) &&
        !n.includes('석물') && !n.includes('설치')) {
        return '기본비용';
    }

    // 2. 수목장 / 평장 (자연장 계열)
    // "평장"이 포함되면 보통 수목장 카테고리로 봅니다. (평장상석도 수목장 부속품으로 분류)
    if (n.includes('수목') || n.includes('자연장') || n.includes('평장') ||
        n.includes('잔디') || n.includes('화초') || n.includes('정원') || n.includes('공동목')) {
        return '수목장';
    }

    // 3. 봉안당 (실내/벽식)
    if (n.includes('봉안당') || n.includes('납골당') || n.includes('봉안담') ||
        n.includes('부부단') || n.includes('개인단') || n.includes('부부실') || n.includes('개인실') ||
        n.includes('유골함') || n.includes('안치단')) {
        return '봉안당';
    }

    // 4. 봉안묘 (석물 형태의 납골묘)
    if (n.includes('봉안묘') || n.includes('납골묘') || n.includes('가족묘') || n.includes('세대묘')) {
        return '봉안묘';
    }

    // 5. 매장묘 (전통 묘지 및 석물 전체)
    // 석물 이름이 나오면 기본적으로 매장묘의 부속품으로 봅니다 (평장 예외 처리 됨)
    if (n.includes('매장') || n.includes('합장') || n.includes('단장') ||
        n.includes('쌍봉') || n.includes('단봉') || n.includes('봉분') || n.includes('가봉') ||
        n.includes('상석') || n.includes('비석') || n.includes('와비') || n.includes('둘레석') ||
        n.includes('묘테') || n.includes('석관') || n.includes('망두') || n.includes('화병') ||
        n.includes('향로') || n.includes('장대석') || n.includes('표석') || n.includes('좌대')) {
        return '매장묘';
    }

    // 6. 작업비/용역비 (보통 매장묘 관련이 많음)
    if (n.includes('작업비') || n.includes('개장') || n.includes('이장') || n.includes('산역') || n.includes('용역')) {
        return '매장묘';
    }

    // 7. 기타
    return '기타';
}

(async () => {
    if (!fs.existsSync(CSV_FILE)) {
        console.log('CSV 파일이 없습니다.');
        return;
    }

    const content = fs.readFileSync(CSV_FILE, 'utf-8');
    const lines = content.split('\n');

    // 헤더 처리
    const header = lines[0];
    const body = lines.slice(1).filter(l => l.trim().length > 0);

    let changedCount = 0;

    const newBody = body.map(line => {
        // CSV 파싱 (따옴표 고려 안하고 쉼표 기준 - 현재 생성 로직상 단순 분리 가능)
        // 단, 이름에 콤마가 있어서 따옴표로 감싸진 경우를 위해 정규식 사용 권장되지만, 
        // 아까 생성 스크립트에서 "RawText"에만 따옴표를 썼으므로... 
        // 안전하게: 맨 뒤에서부터 쉼표를 찾아서 분리

        // 구조: ID, Name, Category, ItemName, Price, RawText
        const parts = line.split(',');

        // ItemName 찾기: parts가 많으면 중간에 콤마가 있었던 것.
        // ID(0), FName(1), Cat(2) ... Price(-2), Raw(-1)

        /* 
           그러나 아까 생성 로직에서 ItemName에 콤마가 있으면 "..." 로 감쌌음.
           단순 split으로는 깨짐.
           간단하게 regex로 분리: 
           (?:^|,)(?:"([^"]*)"|([^",]*)) 
           하지만 복잡하니, 아까 생성한 방식 역추적.
        */

        // 정교한 CSV 파싱 대신, 아까 내가 만든 파일 구조를 믿고 간단 파싱
        // ID, Facility, Category, Item, Price, Raw
        // ItemName에만 콤마가 있을 수 있음.

        // 뒤에서 2번째 쉼표(Price 앞)와 3번째 쉼표(Name 뒤) 찾기? 위험함.
        // 그냥 Category는 항상 3번째 컬럼(인덱스 2)에 위치함.
        // FacilityName에 쉼표가 없다는 가정 하에... (보통 없음)

        let cols = [];
        let buffer = '';
        let inQuote = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuote = !inQuote;
                buffer += char;
            } else if (char === ',' && !inQuote) {
                cols.push(buffer);
                buffer = '';
            } else {
                buffer += char;
            }
        }
        cols.push(buffer); // 마지막 컬럼

        if (cols.length < 6) return line; // 파싱 에러나면 원본 유지

        const oldCat = cols[2];
        const itemName = cols[3].replace(/^"|"$/g, ''); // 따옴표 제거

        const newCat = refineCategory(itemName);

        if (oldCat !== newCat) {
            changedCount++;
            cols[2] = newCat;
        }

        return cols.join(',');
    });

    const output = [header, ...newBody].join('\n');
    fs.writeFileSync(CSV_FILE, output);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  카테고리 디테일 정리 완료');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`총 ${body.length}개 중 ${changedCount}개 항목의 카테고리가 보정되었습니다.`);

    // 변경 예시 몇 개 출력
    // (메모리상에서 비교 불가하므로 생략)
})();
