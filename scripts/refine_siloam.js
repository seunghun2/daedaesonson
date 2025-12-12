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

    const newLines = lines.map(line => {
        if (!line.includes('park-0002')) return line;

        // CSV 컬럼 분리 (따옴표 처리 고려)
        const cols = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
        if (cols.length < 6) return line;

        let itemName = cols[3].replace(/^"|"$/g, '');
        let rawText = cols[5] ? cols[5].replace(/^"|"$/g, '') : '';
        let originalName = itemName;
        let originalRaw = rawText;

        // 1. "금액~" 패턴 처리 (예: 상석애석(2.3)500,500~)
        // 숫자, 콤마, 물결표로 끝나는 패턴 찾기
        const priceMatch = itemName.match(/([0-9,]+~)$/);
        if (priceMatch) {
            const priceStr = priceMatch[1]; // "500,500~"
            itemName = itemName.replace(priceMatch[1], '').trim();

            const priceDesc = `(금액: ${priceStr.replace('~', '원 부터')})`;
            rawText = rawText ? `${priceDesc} / ${rawText}` : priceDesc;
        }

        // 2. 복잡한 포함내역 리스트 처리 (예: 매장묘(2.(5평)/단봉)사용료, 5년관리비...)
        if (itemName.includes('총계') || (itemName.includes(',') && itemName.length > 50)) {
            // 이름 정제 로직
            // "매장묘(2.(5평)/단봉)..." -> "매장묘 합장/단장" 등 추출 시도
            // 여기서는 괄호 안의 핵심 키워드(평수, 단봉/쌍봉)를 추출하여 이름으로 구성

            let simpleName = "매장묘"; // 기본값
            if (itemName.includes("2.(5평)")) simpleName += " (2.5평)";
            else if (itemName.includes("4평형")) simpleName += " (4평형)";
            else {
                // 평수 추출 시도 regex
                const pyeongMatch = itemName.match(/\([0-9.]+(?:평|평형)\)/);
                if (pyeongMatch) simpleName += ` ${pyeongMatch[0]}`;
            }

            if (itemName.includes("단봉")) simpleName += " 단봉";
            else if (itemName.includes("쌍봉")) simpleName += " 쌍봉";
            else if (itemName.includes("합장")) simpleName += " 합장";

            // 기존 ItemName 전체를 RawText로 이동 (설명으로 전환)
            // 단, "2.(5평)" 같은 OCR 오류 수정
            let desc = itemName.replace('2.(5평)', '2.5평');
            desc = desc.replace(/, /g, ', '); // 공백 정리

            rawText = rawText ? `[상세구성] ${desc} / ${rawText}` : `[상세구성] ${desc}`;
            itemName = simpleName;
        }

        // 3. OCR 오류 수정 "2.(5평)" -> "2.5평" (일반적인 경우)
        itemName = itemName.replace('2.(5평)', '2.5평');

        if (itemName !== originalName || rawText !== originalRaw) {
            fixed++;
            cols[3] = `"${itemName}"`;
            cols[5] = `"${rawText}"`;
        }

        return cols.join(',');
    });

    if (fixed > 0) {
        fs.writeFileSync(CSV_FILE, newLines.join('\n'));
        console.log(`총 ${fixed}개 실로암공원묘원 항목을 정리했습니다.`);
        console.log('- 가격 표시(~로 끝나는 것)를 설명으로 이동');
        console.log('- 복잡한 구성 내역을 설명으로 이동하고 이름을 단순화');
    } else {
        console.log('수정할 항목이 없거나 이미 수정되었습니다.');
    }
})();
