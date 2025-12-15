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

        // 1. 차원/규격 정보 추출 (cm, mm, m, x 포함)
        // 예: "76cm x 51.5cm", "150cm x213cm", "60cm x 43cm x"
        // 숫자 + (공백) + cm|mm 패턴 찾기
        // 주의: 3.3m2는 이미 처리했으나, 혹시 남아있으면 제외해야 함. 여기선 cm 위주.

        // 패턴: 숫자 + cm/mm + (x + 숫자 ... 반복)
        // 정규식 설명:
        // (\d+(\.\d+)?\s*(cm|mm|㎝|㎜|m)) : 76cm
        // (\s*[xX]\s*\d+(\.\d+)?\s*(cm|mm|㎝|㎜|m)?)* : x 51.5cm (반복 가능)
        // " x" 로 끝나는 경우도 처리하기 위해 마지막 부분 유연하게
        const dimRegex = /(\d+(\.\d+)?\s*(cm|mm|㎝|㎜|m)(\s*[xX]\s*(\d+(\.\d+)?\s*(cm|mm|㎝|㎜|m)?)?)*)/i;

        const match = itemName.match(dimRegex);
        if (match) {
            // 매칭된 부분이 이름의 끝부분 포함이거나, 적어도 10자 이후에 나온다면 분리
            // "150cm" 가 맨 앞에 나오진 않음.
            // 단, "m" 단위는 잘못 매칭될 수 있음 (예: 3m). cm, mm는 확실.
            const unit = match[3].toLowerCase();
            if (['cm', 'mm', '㎝', '㎜'].includes(unit) || (unit === 'm' && itemName.includes('x'))) {
                let dimPart = match[0];
                let splitIdx = match.index;

                // 해당 부분이 이름의 일부로 쓰이는 짧은 스펙(예: "비석 3자")이 아니라,
                // "76cm x ..." 처럼 긴 치수 정보인지 확인
                // x가 포함되어 있거나 길이가 4자 이상이면 분리 대상
                if (dimPart.toLowerCase().includes('x') || dimPart.length > 5) {

                    const namePart = itemName.substring(0, splitIdx).trim();
                    // 이름 뒷부분에 남은 찌꺼기(예: " x") 제거
                    dimPart = itemName.substring(splitIdx).trim();

                    // dimPart 정제: 끝에 붙은 x, 공백 제거
                    dimPart = dimPart.replace(/[xX\s]+$/, '');

                    itemName = namePart;
                    if (!rawText.includes(dimPart)) {
                        rawText = rawText ? `[규격: ${dimPart}] / ${rawText}` : `[규격: ${dimPart}]`;
                    }
                }
            }
        }

        // 2. 단위 앞 띄어쓰기 (척, 자, 단) - park-0029 등
        // "상석2.5척" -> "상석 2.5척"
        // 한글 + 숫자 + 척|자|단|위
        const spacingRegex = /([가-힣])(\d+(\.\d+)?(척|자|단|위))/;
        if (itemName.match(spacingRegex)) {
            itemName = itemName.replace(spacingRegex, '$1 $2');
        }

        // 3. "단장", "합장", "외장용" 등이 숫자 앞에 붙어있는 경우
        // "단장150cm" -> 이미 1번에서 분리됨.
        // 하지만 "1단묘테 단장" -> "1단묘테" "단장".
        if (itemName.includes('단장') && !itemName.includes(' ' + '단장')) {
            itemName = itemName.replace(/([가-힣])(단장)/, '$1 $2');
        }
        if (itemName.includes('합장') && !itemName.includes(' ' + '합장')) {
            itemName = itemName.replace(/([가-힣])(합장)/, '$1 $2');
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
        console.log(`총 ${fixed}개 항목의 치수 정보(cm, x)를 설명으로 이동하고 띄어쓰기를 교정했습니다.`);
    } else {
        console.log('수정할 항목이 없습니다.');
    }
})();
