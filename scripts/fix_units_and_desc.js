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

    let fixedCount = 0;

    const newBody = body.map(line => {
        const cols = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
        if (cols.length < 6) return line;

        const id = cols[0].replace(/^"|"$/g, '');
        let itemName = cols[3].replace(/^"|"$/g, '');
        let rawText = cols[5] ? cols[5].replace(/^"|"$/g, '') : '';
        const originalName = itemName;
        const originalRaw = rawText;

        // 파주하늘나라공원 (park-0063) 및 유사 패턴 수정
        // 오인식된 단위 '1' -> '자'
        const unitMap = {
            '2.31': '2.3자',
            '2.51': '2.5자',
            '3.01': '3.0자',
            '3.51': '3.5자'
        };

        // 1. 단위 수정
        Object.keys(unitMap).forEach(key => {
            if (itemName.includes(key)) {
                itemName = itemName.replace(key, unitMap[key]);
            }
        });

        // 2. 설명 분리 (괄호 안에 '별도', '포함' 등이 있으면 무조건 설명으로)
        if (itemName.includes('(')) {
            itemName = itemName.replace(/\(([^)]+)\)/g, (match, content) => {
                // '자' 단위나 짧은 규격은 제목에 유지
                if (content.includes('자') || content.trim().length <= 3) {
                    return match;
                }

                // '별도', '포함', '바닥', '활개' 등 설명 키워드가 있으면 이동
                if (/별도|포함|바닥|활개|전지/.test(content)) {
                    // RawText에 없으면 추가
                    if (!rawText.includes(match)) {
                        rawText += ` ${match}`;
                    }
                    return ''; // 제목에서 제거
                }
                return match;
            });
        }

        itemName = itemName.replace(/\s+/g, ' ').trim();
        rawText = rawText.replace(/\s+/g, ' ').trim();

        if (itemName !== originalName || rawText !== originalRaw) {
            fixedCount++;
            cols[3] = `"${itemName}"`;
            cols[5] = `"${rawText}"`;
        }

        return cols.join(',');
    });

    const output = [header, ...newBody].join('\n');
    fs.writeFileSync(CSV_FILE, output);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  단위 오인식 수정 및 설명 분리 완료');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`총 ${fixedCount}개 항목을 수정했습니다.`);
})();
