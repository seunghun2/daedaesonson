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
        const cols = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
        if (cols.length < 6) return line;

        let itemName = cols[3].replace(/^"|"$/g, '');
        let rawText = cols[5] ? cols[5].replace(/^"|"$/g, '') : '';
        const originalName = itemName;
        const originalRaw = rawText;

        // 1. 끝에 남은 '원', '작업비원', '/' 정리
        if (itemName.endsWith('원')) itemName = itemName.slice(0, -1).trim();
        if (itemName.endsWith('작업비')) itemName = itemName.slice(0, -3).trim();
        if (itemName.endsWith('/')) itemName = itemName.slice(0, -1).trim();

        // 2. 슬래시(/)가 포함된 복합 상품 분리 강화
        // 예: "매장묘사용료/관리비1년/석물일체" -> "매장묘사용료" + 설명으로 이동
        // 조건: 슬래시가 있고, "사용료" 또는 "관리비"가 포함되어 있을 때
        if (itemName.includes('/') && (itemName.includes('사용료') || itemName.includes('관리비'))) {
            const parts = itemName.split('/');
            // 첫 번째 파트가 너무 짧으면(2글자 등) 안 자를 수도 있지만, "매장묘사용료"는 충분히 김.
            if (parts[0].length > 2) {
                itemName = parts[0].trim();
                const desc = parts.slice(1).join(', ');
                if (desc) {
                    rawText = rawText ? `[포함: ${desc}] / ${rawText}` : `[포함: ${desc}]`;
                }
            }
        }

        // 3. park-0078 등 중복 패턴 재확인 "1. ... "
        if (/^\d+\.\s/.test(itemName)) {
            // "1. 이름" 형태면 놔둠? 아니면 정리? 보통 리스트의 일부.
            // 여기서는 패스.
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
        console.log(`총 ${fixed}개 복합/잔여 텍스트 항목을 추가 정리했습니다.`);
    } else {
        console.log('수정할 항목이 없습니다.');
    }
})();
