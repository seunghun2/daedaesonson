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

        const id = cols[0];
        let category = cols[2];
        let itemName = cols[3].replace(/^"|"$/g, '');
        let price = cols[4].replace(/^"|"$/g, '');
        let rawText = cols[5] ? cols[5].replace(/^"|"$/g, '') : '';

        // 가격 숫자로 변환
        const numPrice = parseInt(price.replace(/,/g, ''), 10);

        // 타겟: 이름이 "관리비", "사용료" 류로 단순한데 가격이 50만원 이상인 경우
        const simpleNames = ['묘지 관리비', '묘지사용료', '기본비용', '관리비', '사용료', '묘지 관리비 (개인)', '묘지 관리비 (부부)'];
        // (괄호 제거하고 비교)
        const cleanName = itemName.replace(/\s*\(.*?\)/g, '').trim();

        // "묘지 관리비" 등이고 가격이 50만원 넘으면 -> 복구 대상
        if (simpleNames.some(n => cleanName === n || cleanName.includes('관리비')) && numPrice > 500000) {

            // RawText가 존재하면 무조건 시도 (길이 제한 150자로 대폭 완화)
            if (rawText && rawText.length > 1 && rawText.length < 150) {
                // 1. 괄호 앞부분만 추출 (가장 깔끔한 이름일 확률 높음)
                // 예: "봉안담 개인단(1단)사용료..." -> "봉안담 개인단"
                let candidate = rawText.split('(')[0].trim();

                // 만약 괄호가 없다면? 그냥 전체 사용
                if (!rawText.includes('(')) {
                    candidate = rawText;
                }

                // 2. 만약 추출한 이름이 너무 짧으면(2글자 이하), 괄호 포함해서 조금 더 가져와본다?
                // 아니면 사용료/관리비 단어가 들어간 곳까지?

                // park-0014 특화: "봉안담 개인단(1단)사용료..."
                if (candidate.length > 2) {
                    itemName = candidate;

                    // 카테고리 보정: 관리비 -> 봉안당/매장묘
                    if (itemName.includes('봉안')) category = '봉안당';
                    else if (itemName.includes('매장') || itemName.includes('평장') || itemName.includes('자연장')) category = '매장묘';
                    else category = '기본비용'; // 애매하면

                    fixedCount++;
                }
            }
        }

        // 안전하게 따옴표 처리
        cols[2] = category;
        cols[3] = `"${itemName}"`;
        // RawText는 건드리지 않음 (이미 fix_spacing 처리됨)

        return cols.join(',');
    });

    const output = [header, ...newBody].join('\n');
    fs.writeFileSync(CSV_FILE, output);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  고가 항목 이름 복구 (2차, 강력모드) 완료');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`총 ${fixedCount}개 항목의 이름을 RawText에서 되살렸습니다.`);
})();
