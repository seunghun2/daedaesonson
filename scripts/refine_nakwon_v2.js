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

    const newLines = lines.map((line, index) => {
        if (index === 0) return line;

        const cols = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
        if (cols.length < 6) return line;

        let itemName = cols[3].replace(/^"|"$/g, '');
        let rawText = cols[5] ? cols[5].replace(/^"|"$/g, '') : '';
        const originalName = itemName;
        const originalRaw = rawText;

        // --- park-0001 (낙원추모공원) 제목 정리 ---
        if (line.includes('park-0001')) {
            // 1. 가격 정보 제거 (예: "31, 150, 000원 부터 ~")
            // 숫자, 쉼표, 공백 포함된 가격 패턴 찾기
            const pricePattern = /[\d, ]+원\s*부터\s*~?/;
            const match = itemName.match(pricePattern);
            if (match) {
                const priceStr = match[0];
                itemName = itemName.replace(priceStr, '').trim();
                // RawText에 가격 정보 추가 (중복 아니면)
                if (!rawText.includes(priceStr)) {
                    rawText = rawText ? `[가격정보: ${priceStr}] / ${rawText}` : `[가격정보: ${priceStr}]`;
                }
            }

            // 2. 괄호로 묶인 설명 이동 (예: "( 담장시설 )", "(담장시설)")
            // 단, "(3평형)" 같은 규격 정보는 제목에 남겨둬야 함.
            // "평형", "위형", "기형", "신형", "구형" 등이 포함되지 않은 괄호를 대상으로 함.
            const parenPattern = /\(\s*([^)\d]*?)\s*\)/g; // 숫자가 포함되지 않은 괄호 (담장시설 등)
            // 혹은 "담장시설" 특정 키워드
            if (itemName.includes('담장시설')) {
                itemName = itemName.replace(/\(?\s*담장시설\s*\)?/g, '').trim();
                rawText = rawText ? `[옵션: 담장시설] / ${rawText}` : `[옵션: 담장시설]`;
            }

            // 3. 중복 제거
            if (itemName === rawText || rawText.startsWith(itemName)) {
                // 설명이 제목으로 시작하면 제목 부분 제거
                if (rawText.startsWith(itemName)) {
                    rawText = rawText.substring(itemName.length).trim();
                    // 앞의 특수문자 제거 (/ , 등)
                    rawText = rawText.replace(/^[\/,\s]+/, '');
                }
            }
        }

        // --- 전역적용: "원 부터" 패턴이 있으면 무조건 제거 (다른 시설도 있을 수 있음) ---
        if (itemName.endsWith('원 부터 ~') || itemName.endsWith('원 부터')) {
            const pricePattern = /[\d, ]+원\s*부터\s*~?/;
            const match = itemName.match(pricePattern);
            if (match) {
                const priceStr = match[0];
                itemName = itemName.replace(priceStr, '').trim();
                if (!rawText.includes(priceStr)) {
                    rawText = rawText ? `[가격정보: ${priceStr}] / ${rawText}` : `[가격정보: ${priceStr}]`;
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
        console.log(`총 ${fixed}개 항목의 제목에서 가격 정보를 분리하고 설명을 정리했습니다.`);
    } else {
        console.log('수정할 항목이 없습니다.');
    }
})();
