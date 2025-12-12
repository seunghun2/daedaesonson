const fs = require('fs');
const CSV_FILE = 'data/pricing_all.csv';

(async () => {
    if (!fs.existsSync(CSV_FILE)) {
        console.log('CSV 파일이 없습니다.');
        return;
    }

    const content = fs.readFileSync(CSV_FILE, 'utf-8');
    const lines = content.split('\n');
    let catFixed = 0;
    let unitFixed = 0;

    // 평수 변환 함수
    function convertToPyeong(match, numberStr, unit) {
        const value = parseFloat(numberStr);
        if (isNaN(value)) return match;

        let pyeong = value / 3.305785;
        // 소수점 처리: 정수에 가까우면 정수로, 아니면 소수점 1자리
        if (Math.abs(pyeong - Math.round(pyeong)) < 0.1) {
            pyeong = Math.round(pyeong);
        } else {
            pyeong = parseFloat(pyeong.toFixed(1));
        }

        return `(${pyeong}평)`;
    }

    const newLines = lines.map((line, index) => {
        if (index === 0) return line;

        const cols = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
        if (cols.length < 6) return line;

        let category = cols[2];
        let itemName = cols[3].replace(/^"|"$/g, '');
        let rawText = cols[5] ? cols[5].replace(/^"|"$/g, '') : '';
        const originalName = itemName;
        const originalRaw = rawText;
        const originalCat = category;

        // 1. 카테고리 수정: "묘지 사용료" 가 포함되면 무조건 기본비용
        // (사용자 요청: 묘지 사용료 -> 기본비용)
        // 띄어쓰기 유무 상관 없이 체크
        if (itemName.replace(/\s/g, '').includes('묘지사용료')) {
            if (category !== '기본비용') {
                category = '기본비용';
            }
        }

        // 2. 단위 변환 (m2, ㎡ -> 평)
        // Regex: 숫자 + (공백) + 단위
        const unitPattern = /(\d+(\.\d+)?)\s*(?:m2|㎡|제곱미터)/gi;

        // 제목 변환
        if (itemName.match(unitPattern)) {
            itemName = itemName.replace(unitPattern, (match, num) => convertToPyeong(match, num));
        }

        // 설명 변환
        if (rawText.match(unitPattern)) {
            rawText = rawText.replace(unitPattern, (match, num) => convertToPyeong(match, num));
        }

        // "3.3 (1평)" 처럼 중복된 경우 정리 (변환 후 (1평)이 되었는데 원래 텍스트에 (1평)이 또 있을 수도.. 이건 일단 무시)

        // 3. 괄호 포맷 정리 (혹시 변환으로 ((1평)) 이 되거나 띄어쓰기 꼬인 경우)
        itemName = itemName.replace(/\(\s*\(/g, '(').replace(/\)\s*\)/g, ')');
        // 묘지사용료(1평) -> 묘지사용료 (1평)
        // 이미 괄호가 있으면 띄어쓰기
        if (/[가-힣]\(/.test(itemName)) {
            itemName = itemName.replace(/([가-힣])\(/g, '$1 (');
        }

        if (itemName !== originalName || rawText !== originalRaw || category !== originalCat) {
            if (category !== originalCat) catFixed++;
            if (itemName !== originalName || rawText !== originalRaw) unitFixed++;

            cols[2] = category;
            cols[3] = `"${itemName.trim()}"`;
            cols[5] = `"${rawText.trim()}"`;
        }

        return cols.join(',');
    });

    if (catFixed > 0 || unitFixed > 0) {
        fs.writeFileSync(CSV_FILE, newLines.join('\n'));
        console.log(`[작업 완료]`);
        console.log(`- "묘지 사용료" 카테고리 수정: ${catFixed}개`);
        console.log(`- m2 -> 평 단위 변환: ${unitFixed}개`);
    } else {
        console.log('수정할 항목이 없습니다.');
    }
})();
