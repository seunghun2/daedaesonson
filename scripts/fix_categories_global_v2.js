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
    const changes = [];

    const newLines = lines.map((line, index) => {
        if (index === 0) return line;
        const cols = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
        if (cols.length < 6) return line;

        const id = cols[0];
        let category = cols[2];
        let itemName = cols[3].replace(/^"|"$/g, '');
        const price = parseInt(cols[4] || '0');
        const originalCategory = category;

        // 1. [기본비용 -> 상품] 재검사
        // "단장", "합장", "부부", "가족", "평장", "봉안", "수목" 이 포함되어 있는데
        // "사용료", "관리비" 단어가 "전혀" 없고, 가격이 100만 원 이상인 경우
        // 예: "12위 부부단" (기본비용 X) -> 봉안묘/매장묘
        if (category === '기본비용') {
            const isProductLike = /단장|합장|부부|가족|평장|봉안|추모|수목/.test(itemName);
            const isFeeLike = /사용료|관리비|화장비|안치비/.test(itemName);

            if (isProductLike && !isFeeLike && price > 1000000) {
                if (itemName.includes('수목') || itemName.includes('평장')) category = '수목장';
                else if (itemName.includes('봉안')) category = '봉안묘';
                else category = '매장묘'; // 기본값
            }
        }

        // 2. [상품 -> 기본비용] 재검사 (확장된 로직)
        // 이름이 "~사용료", "~관리비" 로 끝나거나, "~비용" 등 명확한 수수료 인데
        // 가격이 1,000만 원 이하 (패키지가 아님)
        else if (['매장묘', '봉안묘', '봉안당', '수목장'].includes(category)) {
            // 주의: "봉안묘 사용료"는 900만원일 수 있음(패키지). 따라서 가격 체크 필수.
            // 하지만 "신장 관리비" (150만원) -> 기본비용 가능.
            // "관리비"가 붙으면 99% 기본비용임. (단, "관리비 포함" 텍스트가 아니라 이름 자체가 관리비일 때)

            // 이름 끝이 "사용료", "관리비"로 끝나거나 괄호 뒤에 끝남.
            const nameEndsWithFee = /(사용료|관리비)(\s*\(.*\))?$/.test(itemName);
            // 또는 "묘지사용료", "석물관리비"(?)

            if (nameEndsWithFee) {
                // "석물"이 포함되어 있으면 기본비용 아님 (예: 석물 사용료? 드묾).
                // 보통 "석물"이 있으면 상품이나 기타.
                if (!itemName.includes('석물')) {
                    // 가격이 너무 비싸면(500만 이상) 패키지로 의심하여 유지, 아니면 이동
                    if (price < 5000000) {
                        category = '기본비용';
                    }
                }
            }
        }

        if (category !== originalCategory) {
            fixed++;
            changes.push(`[${id}] ${itemName}: ${originalCategory} -> ${category}`);
            cols[2] = category;
        }

        return cols.join(',');
    });

    if (fixed > 0) {
        fs.writeFileSync(CSV_FILE, newLines.join('\n'));
        console.log(`총 ${fixed}개 카테고리를 추가로 보정했습니다.`);
        changes.slice(0, 10).forEach(c => console.log(c));
    } else {
        console.log('추가로 수정할 카테고리가 없습니다.');
    }
})();
