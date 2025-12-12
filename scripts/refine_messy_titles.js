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
        const cols = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
        if (cols.length < 6) return line;

        let itemName = cols[3].replace(/^"|"$/g, '');
        let rawText = cols[5] ? cols[5].replace(/^"|"$/g, '') : '';
        const originalName = itemName;
        const originalRaw = rawText;

        // 1. 가격 범위가 이름에 포함된 경우 (예: "... 3,000,000원~4,000,000원")
        // park-0074 등
        const priceRangeMatch = itemName.match(/([0-9,]+원\s?~\s?[0-9,]+원?)/);
        if (priceRangeMatch) {
            const rangeStr = priceRangeMatch[0];
            itemName = itemName.replace(rangeStr, '').trim();
            // 끝에 남은 '작업비' 등의 찌꺼기 제거
            if (itemName.endsWith('작업비')) itemName = itemName.slice(0, -3).trim();

            rawText = rawText ? `[가격범위: ${rangeStr}] / ${rawText}` : `[가격범위: ${rangeStr}]`;
        }

        // 2. 슬래시(/)나 쉼표(,)가 많고 이름이 너무 긴 경우 -> 분리
        // park-0074: 봉안묘사용료/관리비1년/석물일체...
        if (itemName.length > 30 && itemName.includes('/')) {
            const parts = itemName.split('/');
            itemName = parts[0].trim(); // 첫 번째 항목만 제목으로
            const desc = parts.slice(1).join(', ');
            rawText = rawText ? `[포함: ${desc}] / ${rawText}` : `[포함: ${desc}]`;
        }

        // 3. park-0077 애향묘지: "이용료" 뒤에 긴 설명 붙음
        // "재외동포묘역 (평장) 이용료제주자치도에서..."
        if (line.includes('park-0077') && itemName.includes('이용료')) {
            const splitIdx = itemName.indexOf('이용료');
            if (splitIdx !== -1 && itemName.length > splitIdx + 5) {
                const namePart = itemName.substring(0, splitIdx + 3); // "이용료"까지
                const descPart = itemName.substring(splitIdx + 3).trim();
                itemName = namePart;
                rawText = rawText ? `[자격: ${descPart}] / ${rawText}` : `[자격: ${descPart}]`;
            }
        }

        // 4. park-0080 평창군 공설묘지: "사용료분묘" 등 중복 연결
        if (line.includes('park-0080') && itemName.includes('사용료분묘')) {
            itemName = itemName.replace('공설묘원 사용료분묘', '분묘').replace('공설묘지 사용료분묘', '분묘');
            // "분묘 단장 사용료" 처럼 정리
        }

        // 5. 숫자로 시작되는 리스트형 이름 (park-0078 등: "1. 부부 ...") 또는 "석물1."
        if (/석물\d+\./.test(itemName)) {
            const match = itemName.match(/석물(\d+\..*)/);
            if (match) {
                itemName = itemName.replace(match[1], '').trim();
                rawText = rawText ? `[구성: ${match[1]}] / ${rawText}` : `[구성: ${match[1]}]`;
            }
        }

        // 6. park-0087 서라벌공원묘원: 괄호 뒤에 설명 나열
        // "매장묘(일반 개인형/(3평)형)둘레석..."
        if (line.includes('park-0087') && itemName.includes(')')) {
            const lastParen = itemName.lastIndexOf(')');
            if (lastParen !== -1 && lastParen < itemName.length - 2) {
                const namePart = itemName.substring(0, lastParen + 1);
                const descPart = itemName.substring(lastParen + 1).trim();
                // descPart가 특수문자로 시작하면 정리
                if (/^[.,]/.test(descPart)) {
                    itemName = namePart;
                    const cleanDesc = descPart.replace(/^[.,\s]+/, '');
                    rawText = rawText ? `[구성: ${cleanDesc}] / ${rawText}` : `[구성: ${cleanDesc}]`;
                }
            }
        }

        if (itemName !== originalName || rawText !== originalRaw) {
            fixed++;
            cols[3] = `"${itemName.trim()}"`;
            cols[5] = `"${rawText.trim()}"`;
        }

        return cols.join(',');
    });

    if (fixed > 0) {
        fs.writeFileSync(CSV_FILE, newLines.join('\n'));
        console.log(`총 ${fixed}개 지저분한 항목 이름(가격포함, 긴 설명 등)을 정리했습니다.`);
    } else {
        console.log('수정할 항목이 없습니다.');
    }
})();
