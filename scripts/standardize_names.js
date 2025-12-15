const fs = require('fs');
const CSV_FILE = 'data/pricing_all.csv';

function refineItemName(itemName, category) {
    // 이미 정제된 카테고리를 참고하여, '기본비용' 카테고리인 경우에만 이름을 표준화합니다.
    if (category !== '기본비용') return itemName;

    // 1. 관리비 통일
    if (itemName.includes('관리비')) {
        return '묘지 관리비';
    }

    // 2. 사용료 통일
    if (itemName.includes('사용료') || itemName.includes('분양금')) {
        return '묘지사용료';
    }

    return itemName;
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
        // 간단 CSV 파싱 (가정: 쉼표 분리)
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

        const category = cols[2];
        const oldName = cols[3].replace(/^"|"$/g, ''); // 따옴표 제거

        const newName = refineItemName(oldName, category);

        if (oldName !== newName) {
            changedCount++;
            // 이름에 콤마가 있을까봐 따옴표 처리하려 했으나, 
            // 표준화된 이름(묘지사용료, 묘지 관리비)은 콤마가 없으므로 
            // 그냥 덮어써도 안전합니다.
            cols[3] = newName;
        }

        return cols.join(',');
    });

    const output = [header, ...newBody].join('\n');
    fs.writeFileSync(CSV_FILE, output);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  항목명 표준화 완료');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`총 ${body.length}개 중 ${changedCount}개 항목의 이름이 표준화되었습니다.`);
})();
