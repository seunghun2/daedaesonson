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

        const cols = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
        if (cols.length < 6) return line;

        let itemName = cols[3].replace(/^"|"$/g, '');
        let rawText = cols[5] ? cols[5].replace(/^"|"$/g, '') : '';
        let originalName = itemName;
        let originalRaw = rawText;

        // 1. OCR 오류 수정 (가장 먼저 수행)
        itemName = itemName.replace('2.(5평)', '2.5평');
        itemName = itemName.replace(/\s+/g, ' ').trim(); // 연속 공백 제거

        // 2. 가격 패턴 분리 (숫자,콤마 조합 + ~ 또는 끝)
        // 예: "매장작업비800,000~" -> "매장작업비", "800,000~"
        // 예: "봉안묘(4위 세트)신형19,200,000~" -> "봉안묘(4위 세트) 신형", "19,200,000~"

        // 정규식: (한글/영문/괄호 등)(가격패턴)
        const pricePattern = /([0-9,]+)(~)?$/;
        const match = itemName.match(pricePattern);

        if (match) {
            // 매칭된 가격 부분이 실제 가격 컬럼의 값과 유사하거나, 확실히 가격 형태인 경우
            const priceStr = match[0];
            // 가격 부분이 너무 짧으면(예: 2.5) 제외, 보통 가격은 1000단위 이상이므로 콤마가 있거나 4자리 이상
            if (priceStr.includes(',') || priceStr.replace(/,/g, '').length >= 4) {
                // 이름에서 가격 제거
                let newName = itemName.substring(0, index = itemName.lastIndexOf(priceStr)).trim();

                // 설명에 가격 정보 추가
                const priceDesc = `(금액: ${priceStr.replace('~', '원 부터')})`;
                rawText = rawText ? `${priceDesc} / ${rawText}` : priceDesc;
                itemName = newName;
            }
        }

        // 3. "신형", "구형" 등의 수식어가 이름 끝에 붙어 가격과 붙어있던 경우 처리
        // 위에서 가격을 떼어냈으므로, 이제 이름 끝에 "신형", "구형" 등이 남을 수 있음. 
        // 띄어쓰기 보정
        itemName = itemName.replace(/(신형|구형|세트)$/, ' $1');
        itemName = itemName.replace(/\s+/g, ' ').trim();

        if (itemName !== originalName || rawText !== originalRaw) {
            fixed++;
            cols[3] = `"${itemName}"`;
            cols[5] = `"${rawText}"`;
        }

        return cols.join(',');
    });

    if (fixed > 0) {
        fs.writeFileSync(CSV_FILE, newLines.join('\n'));
        console.log(`총 ${fixed}개 실로암공원묘원 항목을 대대적으로 정리했습니다.`);
    } else {
        console.log('수정할 항목이 없거나 이미 수정되었습니다.');
    }
})();
