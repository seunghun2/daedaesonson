const fs = require('fs');
const CSV_FILE = 'data/pricing_all.csv';

(async () => {
    if (!fs.existsSync(CSV_FILE)) {
        console.log('CSV 파일이 없습니다.');
        return;
    }

    const content = fs.readFileSync(CSV_FILE, 'utf-8');
    const lines = content.split('\n');
    let fixed = 0;

    // 로깅용
    const changes = [];

    const newLines = lines.map((line, index) => {
        if (index === 0) return line; // 헤더
        const cols = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
        if (cols.length < 6) return line;

        const id = cols[0];
        let category = cols[2];
        const itemName = cols[3].replace(/^"|"$/g, '');
        const price = parseInt(cols[4] || '0');
        const originalCategory = category;

        // 1. [기본비용 -> 기타/상품] 이동 로직
        if (category === '기본비용') {
            // 명백한 석물/용품/서비스 -> 기타 or 매장묘
            if (/석물|비석|상석|둘레석|테두리|화병|향로|식대|운구|제사|벌초|안치비|철거|이장|개장|화장/.test(itemName)) {
                // 식대, 제사, 운구 등은 '기타'
                if (/식대|제사|운구|상차림/.test(itemName)) {
                    category = '기타';
                }
                // 비석, 상석 등 석물류는 보통 '기타'로 잡거나 원래 묘지 유형을 따라가야 하나,
                // 안전하게 '기타'로 변경 (기본비용은 아니므로)
                else {
                    category = '기타';
                }
            }
            // 이름에 "묘"가 들어가고 가격이 비룸(200만 이상) -> 상품일 확률 높음 (예: "가족 평장묘")
            // 단, "사용료"라는 단어가 없어야 함. "묘지사용료"는 비싸도 기본비용일 수 있음(30년치).
            else if (price >= 2000000 && !/사용료|관리비/.test(itemName)) {
                // 원래 이름에 힌트가 있으면 그쪽으로 보냄
                if (itemName.includes('수목장') || itemName.includes('평장')) category = '수목장';
                else if (itemName.includes('봉안')) category = '봉안묘'; // 봉안당일수도 있지만 봉안묘가 더 흔함 (야외)
                else if (itemName.includes('매장') || itemName.includes('단장') || itemName.includes('합장')) category = '매장묘';
                // 힌트 없으면 일단 둠 (위험)
            }
        }

        // 2. [상품 -> 기본비용] 이동 로직
        // "사용료", "관리비"만 딱 있는 경우 (제품명 없이)
        else if (['매장묘', '봉안묘', '봉안당', '수목장'].includes(category)) {
            // 이름이 정확히 "묘지사용료", "묘지 관리비" 패턴이거나
            // "(1평)" 같은 단위만 붙어있는 경우
            const cleanName = itemName.replace(/\(.*\)|\[.*\]|\d+평|\d+년|\s/g, ''); // 괄호, 숫자평, 공백 제거
            if (/^(묘지)?(사용료|관리비|토지사용료)$/.test(cleanName)) {
                category = '기본비용';
            }
            // "단장사용료", "합장사용료" 등도 기본비용으로 보는게 맞음 (위에서 물미묘원 사례 참고)
            else if (/^(단장|합장|쌍분|부부)(사용료|관리비)$/.test(cleanName)) {
                category = '기본비용';
            }
        }

        if (category !== originalCategory) {
            fixed++;
            cols[2] = category;
            changes.push(`[${id}] ${itemName}: ${originalCategory} -> ${category}`);
        }

        return cols.join(',');
    });

    if (fixed > 0) {
        fs.writeFileSync(CSV_FILE, newLines.join('\n'));
        console.log(`총 ${fixed}개 잘못된 카테고리를 자동으로 수정했습니다.`);
        console.log("변경 예시 (상위 5개):");
        changes.slice(0, 5).forEach(c => console.log(c));
    } else {
        console.log('수정할 카테고리를 찾지 못했습니다.');
    }
})();
