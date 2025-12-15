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

    const newLines = lines.map(line => {
        if (!line.includes('park-0020')) return line;

        // CSV 파싱 (따옴표 고려)
        const cols = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
        if (cols.length < 6) return line;

        let itemName = cols[3].replace(/^"|"$/g, '');
        let rawText = cols[5] ? cols[5].replace(/^"|"$/g, '') : '';
        let originalName = itemName;
        let originalRaw = rawText;

        // 구분자 * 또는 ^ 찾기
        // 예: "표준 평장묘* 석물, 석물설치비..."
        const separatorRegex = /[*^]/;
        const splitIndex = itemName.search(separatorRegex);

        if (splitIndex !== -1) {
            const namePart = itemName.substring(0, splitIndex).trim();
            const descPart = itemName.substring(splitIndex + 1).trim();

            if (namePart && descPart) {
                itemName = namePart;
                // 기존 RawText가 있으면 앞에 덧붙임 (상세 구성이 더 중요하므로)
                const newDesc = `[포함내역] ${descPart}`;
                rawText = rawText ? `${newDesc} / ${rawText}` : newDesc;
            }
        }

        // 불필요한 공백 및 특수문자 정리
        itemName = itemName.replace(/\s+/g, ' ').trim();
        rawText = rawText.replace(/\s+/g, ' ').trim();

        if (itemName !== originalName || rawText !== originalRaw) {
            fixed++;
            cols[3] = `"${itemName}"`;
            cols[5] = `"${rawText}"`;
        }

        return cols.join(',');
    });

    if (fixed > 0) {
        fs.writeFileSync(CSV_FILE, newLines.join('\n'));
        console.log(`총 ${fixed}개 목련공원묘원 항목의 제목과 설명을 분리했습니다.`);
    } else {
        console.log('목련공원묘원 수정 대상이 없습니다. (이미 처리되었거나 패턴 불일치)');
    }
})();
