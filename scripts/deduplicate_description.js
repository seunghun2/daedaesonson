const fs = require('fs');
const CSV_FILE = 'data/pricing_all.csv';

function isRedundant(name, raw) {
    if (!raw) return true; // 이미 비어있으면 true

    // 단순화: 공백, 특수문자 제거, 소문자화
    const cleanName = name.replace(/[\s\(\)\[\]\{\}\.,\/"]/g, '').toLowerCase();
    const cleanRaw = raw.replace(/[\s\(\)\[\]\{\}\.,\/"]/g, '').toLowerCase();

    // 1. 완전히 같으면 중복
    if (cleanName === cleanRaw) return true;

    // 2. 제목이 설명을 완전히 포함하면 중복 (제목이 더 자세한 경우)
    if (cleanName.includes(cleanRaw)) return true;

    // 3. 설명이 제목을 포함하는데, '군더더기'가 별로 없는 경우
    // 군더더기: 글자수 차이가 5자 미만
    if (cleanRaw.includes(cleanName)) {
        const diff = cleanRaw.length - cleanName.length;
        if (diff < 5) return true; // "기준", "포함" 같은 짧은 단어 정도는 무시하고 삭제
    }

    return false;
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

    let clearedCount = 0;

    const newBody = body.map(line => {
        // CSV 파싱
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

        const itemName = cols[3].replace(/^"|"$/g, '');
        const rawText = cols[5].replace(/^"|"$/g, '');

        if (isRedundant(itemName, rawText)) {
            cols[5] = ''; // 설명 삭제
            clearedCount++;
        }

        return cols.join(',');
    });

    const output = [header, ...newBody].join('\n');
    fs.writeFileSync(CSV_FILE, output);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  중복 설명(RawText) 정리 완료');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`총 ${body.length}개 중 ${clearedCount}개의 중복 설명이 삭제되었습니다.`);
})();
