const fs = require('fs');
const CSV_FILE = 'data/pricing_all.csv';

(async () => {
    if (!fs.existsSync(CSV_FILE)) {
        console.log('CSV 파일이 없습니다.');
        return;
    }

    const content = fs.readFileSync(CSV_FILE, 'utf-8');
    const lines = content.split('\n');
    let fixedRefine = 0;
    let fixedMulmi = 0;

    const newLines = lines.map(line => {
        // 1. park-0021 물미묘원 정리
        if (line.includes('park-0021')) {
            const cols = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
            if (cols.length >= 6) {
                let itemName = cols[3].replace(/^"|"$/g, '');
                let rawText = cols[5] ? cols[5].replace(/^"|"$/g, '') : '';
                let category = cols[2];

                // 조건부 할인 키워드 확인
                const conditionKeywords = ['수급자', '유공자', '주민', '면민', '리민', '감면', '할인'];
                const hasCondition = conditionKeywords.some(kw => rawText.includes(kw) || itemName.includes(kw));

                if (hasCondition) {
                    cols[2] = '기타';
                } else {
                    // 표준 요금인 경우 기본비용으로 설정하고 이름 표준화
                    if (itemName.includes('사용료') || itemName.includes('관리비')) {
                        cols[2] = '기본비용';

                        // 이름 표준화: "단장사용료" -> "묘지사용료 (단장)"
                        if (itemName === '단장사용료') itemName = '묘지사용료 (단장)';
                        else if (itemName === '합장사용료') itemName = '묘지사용료 (합장)';
                        else if (itemName === '단장관리비') itemName = '묘지 관리비 (단장)';
                        else if (itemName === '합장관리비') itemName = '묘지 관리비 (합장)';

                        cols[3] = `"${itemName}"`;
                    }
                }
                fixedMulmi++;
                return cols.join(',');
            }
        }

        // 2. park-0213 상주시공설묘지 설명 개선
        if (line.includes('park-0213') || line.includes('상주시공설묘지')) {
            const cols = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
            if (cols.length >= 6) {
                let rawText = cols[5] ? cols[5].replace(/^"|"$/g, '') : '';
                const originalRaw = rawText;

                // "공설묘지 사용료1기당 3.3m2,1등지:5만원 이하..." -> "1기당 3.3㎡ (1등지 5만원 / 2등지 3만원 / 3등지 2만원 / ...)"
                // 설명 텍스트를 좀 더 자연스럽게 정제

                // 불필요한 접두어 제거
                rawText = rawText.replace(/공설묘지 (사용료|관리비)/g, '').trim();

                // 3.3m2 -> 3.3㎡
                rawText = rawText.replace(/3\.3m2/g, '3.3㎡');

                // 콤마로 연결된 등급 정보 정리
                if (rawText.includes('1등지')) {
                    // "1기당 3.3㎡,1등지:..." -> "규격: 1기당 3.3㎡ / 등급별 요금: 1등지..."
                    // 기존 콤마를 슬래시로 변환하여 가독성 확보
                    rawText = rawText.replace(/,\s*([1-9]등지)/g, ' / $1');
                    rawText = rawText.replace(/^1기당/, '규격: 1기당');
                }

                // "관리비 1기당 ..., 2,000원~3,000원" -> "규격: 1기당 ... / 비용 범위: 2,000원~3,000원"
                if (rawText.includes('2,000원~')) {
                    rawText = rawText.replace(/,\s*([0-9,]+원~)/g, ' / 비용 범위: $1');
                }

                if (rawText !== originalRaw) {
                    cols[5] = `"${rawText}"`;
                    fixedRefine++;
                }
                return cols.join(',');
            }
        }

        return line;
    });

    if (fixedRefine > 0 || fixedMulmi > 0) {
        fs.writeFileSync(CSV_FILE, newLines.join('\n'));
        console.log(`- 물미묘원(park-0021): ${fixedMulmi}개 항목 정리 (조건부->기타, 메인->기본비용/이름표준화)`);
        console.log(`- 상주시공설묘지: ${fixedRefine}개 항목 설명 개선`);
    } else {
        console.log('수정할 항목을 찾지 못했습니다.');
    }
})();
