const fs = require('fs');
const CSV_FILE = 'data/pricing_all.csv';

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

        let itemName = cols[3].replace(/^"|"$/g, '');
        const rawText = cols[5].replace(/^"|"$/g, '');

        // 1. "평" 괄호 통일
        // (1평) 처럼 이미 괄호가 있는 경우는 제외하고, 1평, 3.3평 등 괄호 없는 평수를 찾아서 괄호 씌움
        // 단, "1평형" 이렇게 붙어있는 경우는 "1평"으로 줄이고 괄호

        // 정규식: 괄호 없이 숫자+평(형) 이 있는 패턴 찾기
        // 예: "묘지사용료 1평" -> "묘지사용료 (1평)"
        // 예: "상석 2.5평" -> "상석 (2.5평)"

        // 주의: 이미 (1평) 인 것을 ((1평))으로 만들면 안됨.
        // lookbehind가 JS에서 제한적일 수 있으므로 심플한 로직 사용.

        // " 숫자평 " 패턴이 있다면 교체.
        const pyRegex = /([^(\d]|^)(\d+(\.\d+)?)평(형)?([^)\d]|$)/g;
        // 설명: [^(\d] (괄호나 숫자 아님) + 숫자 + 평 + (괄호나 숫자 아님)

        if (itemName.match(pyRegex)) {
            itemName = itemName.replace(pyRegex, '$1($2평)$5');
        } else if (itemName.includes('평') && !itemName.includes('(')) {
            // 괄호가 아예 없는데 평은 있는 경우 (단순 무식하게 뒤에 붙은 경우 등)
            itemName = itemName.replace(/(\d+(\.\d+)?)평(형)?/g, '($1평)');
        }

        // 2. 단장/합장/쌍봉 복구 (묘지사용료, 관리비인 경우만)
        if (itemName.startsWith('묘지') || itemName.startsWith('봉안')) {
            const keywords = ['단장', '합장', '쌍봉', '가족', '부부', '개인', '문중'];
            for (const kw of keywords) {
                // RawText에는 있는데, 이미 정제된 ItemName에는 없는 경우
                if (rawText.includes(kw) && !itemName.includes(kw)) {
                    itemName += ` (${kw})`;
                }
            }
        }

        // 괄호 정리: ((1평)) 같은 이중 괄호 방지
        itemName = itemName.replace(/\(\(/g, '(').replace(/\)\)/g, ')');

        // CSV 컬럼 업데이트
        if (cols[3].replace(/^"|"$/g, '') !== itemName) {
            itemName = itemName.replace(/"/g, ''); // 내부 따옴표 제거 (안전상)
            cols[3] = itemName;
            changedCount++;
        }

        return cols.join(',');
    });

    const output = [header, ...newBody].join('\n');
    fs.writeFileSync(CSV_FILE, output);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  항목명 정밀 보정 완료');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`총 ${changedCount}개 항목이 수정되었습니다.`);
    console.log('(평수 괄호 통일 + 단장/합장 구분 정보 복구)');
})();
