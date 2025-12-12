const fs = require('fs');
const CSV_FILE = 'data/pricing_all.csv';

function expandComplexName(name, rawText) {
    // 1. 슬래시(/)가 포함된 복합 데이터 처리
    if (name.includes('/') && (name.includes('=') || name.includes('+'))) {
        const parts = name.split('/');
        let mainName = parts[0].trim();
        let details = parts.slice(1).join(' ').trim();

        // 상세 설명 문장화 (암호 해독)
        details = details
            .replace(/\+/g, ', ')
            .replace(/=/g, ' ')
            .replace('안장시', '(안장 시 납부)')
            .replace('계약시', '(계약 시 납부)');

        let condition = '';

        // 이름에서 조건 추출 ((관내 거주자) 등)
        mainName = mainName.replace(/\(([^)]+)\)/g, (match, content) => {
            // 평수나 형(Type) 정보는 이름에 유지
            if (content.includes('평') || content.includes('형') || content.includes('m2')) {
                return match;
            }
            condition += content + ', ';
            return '';
        });

        // 이름 중복 정리 (예: "단장A...A형" -> "단장 A형")
        // "A" 가 있고 뒤에 "A형"이 있으면 앞의 "A" 제거
        if (/([A-Z])/.test(mainName) && mainName.includes(RegExp.$1 + '형')) {
            // 앞의 알파벳만 덩그러니 있는 경우 제거 시도
            // 정규식: 단어 경계에 있는 알파벳 하나
        }
        // 단순히 중복 단어 제거
        const words = mainName.split(' ');
        const uniqueWords = [...new Set(words)];
        mainName = uniqueWords.join(' ');

        // 설명 조합
        let fullDesc = condition + details;
        fullDesc = fullDesc.replace(/,\s*$/g, '').trim();

        // 기존 RawText와 병합
        if (rawText && !rawText.includes(fullDesc)) {
            fullDesc = `${fullDesc} / ${rawText}`;
        }

        return {
            name: mainName.replace(/\s+/g, ' ').trim(),
            desc: fullDesc.replace(/\s+/g, ' ').trim()
        };
    }

    return { name, desc: rawText };
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

    let fixedCount = 0;

    const newBody = body.map(line => {
        const cols = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
        if (cols.length < 6) return line;

        let itemName = cols[3].replace(/^"|"$/g, '');
        let rawText = cols[5] ? cols[5].replace(/^"|"$/g, '') : '';
        const originalName = itemName;
        const originalRaw = rawText;

        const expanded = expandComplexName(itemName, rawText);

        if (expanded.name !== originalName || expanded.desc !== originalRaw) {
            fixedCount++;
            cols[3] = `"${expanded.name}"`;
            cols[5] = `"${expanded.desc}"`;
        }

        return cols.join(',');
    });

    const output = [header, ...newBody].join('\n');
    fs.writeFileSync(CSV_FILE, output);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  복잡한 항목명 풀어서 쓰기(Explain) 완료');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`총 ${fixedCount}개 항목을 읽기 쉽게 풀었습니다.`);
})();
