const fs = require('fs');
const CSV_FILE = 'data/pricing_all.csv';

(async () => {
    if (!fs.existsSync(CSV_FILE)) return;

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

        // 1. 붙어있는 명사 분리 및 설명 이동
        // "작업비", "이용료", "사용료", "관리비", "조성비", "안치비", "장례비", "세트", "표석", "비석"
        // 뒤에 한글이 바로 붙어있으면(공백없이), 분리 대상으로 본다.
        // 예: "작업비유골함" -> "작업비", "유골함..."

        const keywords = ['작업비', '이용료', '사용료', '관리비', '조성비', '안치비', '장례비', '세트', '표석', '비석'];

        // Regex: (키워드)([가-힣]) -> 키워드 뒤에 한글이 오면 Capture
        const pattern = new RegExp(`(${keywords.join('|')})([가-힣])`);
        const match = itemName.match(pattern);

        if (match) {
            // "비석" 뒤에 "교체" 가 붙은 경우 등.
            // 단, "세트A"는 한글이 아니므로 매칭 안됨 (양호).
            const splitPoint = match.index + match[1].length;

            // 예외 1: "비석" + "대" (비석대 - 받침대) -> 분리하면 안됨
            const suffix = itemName[splitPoint];
            if (match[1] === '비석' && suffix === '대') {
                // Pass
            } else {
                const namePart = itemName.substring(0, splitPoint).trim();
                const descPart = itemName.substring(splitPoint).trim();

                itemName = namePart;
                if (!rawText.includes(descPart)) {
                    rawText = rawText ? `[상세: ${descPart}] / ${rawText}` : `[상세: ${descPart}]`;
                }
            }
        }

        // 2. 닫는 괄호 뒤에 바로 글자가 붙은 경우 (예: "(일반)1인")
        // 이건 설명 이동보다는 띄어쓰기 문제일 수 있으나, 보통 뒤에 오는게 설명임.
        if (/\)[가-힣0-9]/.test(itemName)) {
            const parenMatch = itemName.match(/(\))([가-힣0-9].*)/);
            if (parenMatch) {
                const splitIdx = parenMatch.index + 1;
                const namePart = itemName.substring(0, splitIdx).trim();
                const descPart = itemName.substring(splitIdx).trim();

                itemName = namePart;
                // 설명 이동
                if (!rawText.includes(descPart)) {
                    rawText = rawText ? `[상세: ${descPart}] / ${rawText}` : `[상세: ${descPart}]`;
                }
            }
        }

        // 3. 15자 이상인데 아직 분리 안된 것들 -> 마지막 공백 기준 분리 시도
        // (단, 숫자가 포함된 스펙 정보인 경우에만)
        if (itemName.length >= 15 && itemName.includes(' ')) {
            // 뒤에서부터 공백 찾기
            const lastSpace = itemName.lastIndexOf(' ');
            if (lastSpace > 5) { // 너무 앞이면 안됨
                const suffix = itemName.substring(lastSpace + 1);
                // suffix가 숫자나 특수문자, 또는 "형" "식" 등을 포함하면 스펙으로 간주
                if (/[0-9]/.test(suffix) || /형|식|급/.test(suffix)) {
                    const namePart = itemName.substring(0, lastSpace).trim();
                    const descPart = suffix.trim();

                    itemName = namePart;
                    if (!rawText.includes(descPart)) {
                        rawText = rawText ? `[규격: ${descPart}] / ${rawText}` : `[규격: ${descPart}]`;
                    }
                }
            }
        }

        if (itemName !== originalName) {
            fixed++;
            cols[3] = `"${itemName.trim()}"`;
            cols[5] = `"${rawText.trim()}"`;
        }

        return cols.join(',');
    });

    if (fixed > 0) {
        fs.writeFileSync(CSV_FILE, newLines.join('\n'));
        console.log(`총 ${fixed}개 붙어있는 텍스트를 분리하여 설명으로 이동했습니다.`);
    } else {
        console.log('수정할 항목이 없습니다.');
    }
})();
