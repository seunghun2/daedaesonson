const fs = require('fs');
const CSV_FILE = 'data/pricing_all.csv';

// m2 -> 평 변환 (반올림)
function convertArea(text) {
    // 3.3m2, 3.3㎡ 패턴 찾기
    const regex = /([\d.]+)\s*(m2|㎡|M2)/i;
    const match = text.match(regex);
    if (match) {
        const val = parseFloat(match[1]);
        const pyeong = Math.round((val / 3.3058) * 10) / 10; // 소수점 첫째자리
        const pyeongStr = (pyeong % 1 === 0) ? String(pyeong) : pyeong.toFixed(1);
        return { val: pyeongStr, found: true };
    }

    // 이미 '평'이 있는 경우
    const regexPy = /([\d.]+)\s*(평|평형)/;
    const matchPy = text.match(regexPy);
    if (matchPy) {
        return { val: matchPy[1], found: true };
    }

    return { val: null, found: false };
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

        const category = cols[2];
        let itemName = cols[3].replace(/^"|"$/g, '');
        const rawText = cols[5].replace(/^"|"$/g, '');

        // 1. RawText에서 평수 정보 추출
        const areaInfo = convertArea(rawText);

        if (areaInfo.found) {
            const sizeStr = `(${areaInfo.val}평)`;

            // 기본비용인 경우: 표준 이름 뒤에 평수 붙이기
            if (category === '기본비용') {
                // "묘지 사용료" -> "묘지사용료 (1평)"
                // 이미 (1평)이 있는지 체크
                if (!itemName.includes('평')) {
                    itemName = `${itemName} ${sizeStr}`;
                }
            }
            // 그 외 카테고리 (매장묘 등): 이름 내의 m2를 평으로 치환하거나, 없으면 뒤에 붙이기
            else {
                // m2 제거하고 (N평)으로 대체
                if (/m2|㎡|M2/i.test(itemName)) {
                    itemName = itemName.replace(/([\d.]+)\s*(m2|㎡|M2)/i, `${areaInfo.val}평`);
                } else if (!itemName.includes('평')) {
                    // 이름에 평수가 없으면 뒤에 추가 (선택사항 - 너무 지저분해질 수 있으니 조심)
                    // itemName += ` ${sizeStr}`; 
                    // 사용자가 "평으로 수정"을 원했으므로 m2가 있을 때만 바꾸는게 안전해 보임.
                    // RawText에만 있고 ItemName에는 없는 경우... 일단 둡니다.
                }
            }
            cols[3] = itemName;
            changedCount++;
        }

        return cols.join(',');
    });

    const output = [header, ...newBody].join('\n');
    fs.writeFileSync(CSV_FILE, output);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  평수 단위 표준화 완료');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`총 ${changedCount}개 항목에 평수 정보가 적용되었습니다.`);
})();
