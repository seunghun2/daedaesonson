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

        // 조건: 이름이 15자 이상인 경우
        if (itemName.length >= 15) {
            // 1. 괄호 '(', '[' 감지
            const firstParen = itemName.indexOf('(');
            const firstBracket = itemName.indexOf('[');

            // 가장 먼저 나오는 분리자 찾기
            let splitIdx = -1;
            if (firstParen !== -1 && firstBracket !== -1) splitIdx = Math.min(firstParen, firstBracket);
            else if (firstParen !== -1) splitIdx = firstParen;
            else if (firstBracket !== -1) splitIdx = firstBracket;

            // 2. 특수문자 '-', '/', ',' 도 분리자로 고려 (단 괄호가 없을 때, 또는 괄호보다 뒤에 있으면 괄호 우선? 아니면 먼저 나오는거?)
            // 보통 괄호나 대괄호가 설명의 시작임.
            // 콤마나 슬래시가 10자 이후에 나온다면 분리
            if (splitIdx === -1) {
                const match = itemName.match(/[\/,]/);
                // 하이픈(-)은 이름에 쓰일 수도 있으니 주의 (e.g. A-Type). 슬래시/콤마가 안전.
                if (match && match.index > 5) { // 너무 앞에서 자르면 안됨
                    splitIdx = match.index;
                }
            }

            // 분리 수행
            if (splitIdx !== -1) {
                // 분리된 앞부분(새 제목)의 길이가 너무 짧아지면(2글자 미만) 안 자름
                // 예: "A(타입)" -> "A" (너무 짧음)
                if (splitIdx >= 2) {
                    const namePart = itemName.substring(0, splitIdx).trim();
                    const descPart = itemName.substring(splitIdx).trim();

                    // 제목에 남길지, 설명으로 보낼지 결정
                    // 사용자 요청: "15자 이상이면 설명란으로 들어가는 내용이 있다"
                    // => 과감하게 이동. (단, 식별을 위해 남겨야 할 수도 있지만 사용자가 분리를 원함)

                    // 단, 숫자로 시작하는 규격정보(예: (12평형)) 가 포함된 경우, 그게 제품 식별자라면?
                    // 일단 분리 후, 설명에 추가.

                    // 정제된 DescPart: 괄호만 남기지 않기 위해, 분리자가 특수문자면 제거할 수도 있지만
                    // 괄호는 그대로 두는게 읽기 좋음. 콤마/슬래시는 구분자로 변환.
                    let cleanDesc = descPart;
                    if (cleanDesc.startsWith('/') || cleanDesc.startsWith(',')) {
                        cleanDesc = cleanDesc.substring(1).trim();
                    }

                    itemName = namePart;
                    // 중복 방지 체크 후 추가
                    if (!rawText.includes(cleanDesc)) {
                        // 기존 설명이 있으면 ' / ' 로 연결
                        // cleanDesc가 괄호로 싸여있지 않고 그냥 텍스트면 대괄호 씌우기? 
                        // 그냥 둔다.
                        rawText = rawText ? `${cleanDesc} / ${rawText}` : cleanDesc;
                    }
                }
            }
        }

        if (itemName !== originalName || rawText !== originalRaw) {
            fixed++;
            cols[3] = `"${itemName.trim()}"`;
            cols[5] = `"${rawText.replace(/^"|"$/g, '').trim()}"`; // rawText 따옴표 중복 방지
        }

        return cols.join(',');
    });

    if (fixed > 0) {
        fs.writeFileSync(CSV_FILE, newLines.join('\n'));
        console.log(`총 ${fixed}개 긴 항목 이름(15자 이상)을 분리하여 설명으로 이동했습니다.`);
    } else {
        console.log('수정할 항목이 없습니다.');
    }
})();
