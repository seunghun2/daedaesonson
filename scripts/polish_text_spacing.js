const fs = require('fs');
const CSV_FILE = 'data/pricing_all.csv';

(async () => {
    if (!fs.existsSync(CSV_FILE)) return;

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

        // 1. "료1", "비1" 등 한글 뒤 숫자 붙은 경우 공백 추가 (park-0074 등)
        if (/[가-힣](료|비)(\d)/.test(itemName)) {
            itemName = itemName.replace(/([가-힣](?:료|비))(\d)/g, '$1 $2');
        }

        // 2. park-0077: RawText "관리비제주자치도" -> "관리비 [자격: 제주자치도...]"
        if (line.includes('park-0077') && rawText.includes('제주자치도')) {
            // "관리비제주자치도..." -> "관리비" 뒤에 공백이나 구분기호가 없음
            if (/관리비제주자치도/.test(rawText)) {
                rawText = rawText.replace('관리비제주자치도', '관리비 / [자격: 제주자치도');
                if (!rawText.endsWith(']')) rawText += ']';
            }
            if (/이용료제주자치도/.test(rawText)) {
                rawText = rawText.replace('이용료제주자치도', '이용료 / [자격: 제주자치도');
                if (!rawText.endsWith(']')) rawText += ']';
            }
        }

        // 3. park-0027/0227 김포: "봉안묘사용료" -> "봉안묘 사용료" (띄어쓰기 개선)
        if (itemName.includes('봉안묘사용료')) itemName = itemName.replace('봉안묘사용료', '봉안묘 사용료');
        if (itemName.includes('매장묘사용료')) itemName = itemName.replace('매장묘사용료', '매장묘 사용료');


        if (itemName !== originalName || rawText !== originalRaw) {
            fixed++;
            cols[3] = `"${itemName.trim()}"`;
            cols[5] = `"${rawText.trim()}"`;
        }

        return cols.join(',');
    });

    if (fixed > 0) {
        fs.writeFileSync(CSV_FILE, newLines.join('\n'));
        console.log(`총 ${fixed}개 항목의 띄어쓰기 및 설명을 다듬었습니다.`);
    } else {
        console.log('수정할 항목이 없습니다.');
    }
})();
