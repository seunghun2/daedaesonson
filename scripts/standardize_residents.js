const fs = require('fs');
const CSV_FILE = 'data/pricing_all.csv';

function normalizeResidentType(text) {
    if (/타지역|관외|외지|타지|타시|타군/.test(text)) return '관외 거주자';
    if (/관내|지역내|지역주민|군민|시민|해당지역/.test(text)) return '관내 거주자';
    return null;
}

(async () => {
    if (!fs.existsSync(CSV_FILE)) {
        console.log('CSV 파일이 없습니다.');
        return;
    }

    const content = fs.readFileSync(CSV_FILE, 'utf-8');
    const lines = content.split('\n');
    const header = lines[0];
    const body = lines.slice(1).filter(l => l.trim().length > 0);

    let changedCount = 0;

    const newBody = body.map(line => {
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
        cols.push(buffer);

        if (cols.length < 6) return line;

        let itemName = cols[3].replace(/^"|"$/g, '');
        const rawText = cols[5].replace(/^"|"$/g, '');

        // 1. 거주자 구분 감지 (RawText 기준)
        const type = normalizeResidentType(rawText);

        if (type) {
            // 이미 이름에 거주자 정보가 있는지 체크 (중복 방지)
            if (itemName.includes(type)) {
                // 이미 통일된 이름이 있음 -> 패스
            } else {
                // 기존의 지저분한 표현들 제거 (관내, 관외, 타지역 등...)
                // 너무 위험하므로 제거보다는 "뒤에 표준 명칭 붙이기"가 안전

                // 다만 "관내" 같은 짧은 단어가 이름 중간에 있으면 제거하기 애매함.
                // 괄호를 쳐서 표준화된 것을 명시

                itemName = `${itemName} (${type})`;
                changedCount++;
            }
            cols[3] = itemName;
        }

        return cols.join(',');
    });

    const output = [header, ...newBody].join('\n');
    fs.writeFileSync(CSV_FILE, output);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  거주자 구분 표준화 완료');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`총 ${changedCount}개 항목에 거주자 정보가 통일되었습니다.`);
})();
