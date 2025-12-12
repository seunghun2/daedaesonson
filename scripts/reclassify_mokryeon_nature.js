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

        // CSV 파싱
        const cols = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
        if (cols.length < 6) return line;

        const category = cols[2];
        const rawText = cols[5] ? cols[5].replace(/^"|"$/g, '') : '';
        const itemName = cols[3].replace(/^"|"$/g, '');

        // 조건: 카테고리가 '기본비용'이면서, 설명이나 이름에 '수목장'이 포함된 경우
        // 또는 가격이 비싼데(100만 이상) 이름이 '묘지 관리비'인 경우 (목련공원 특성상)
        if (category === '기본비용' && (rawText.includes('수목장') || itemName.includes('수목장'))) {
            fixed++;
            cols[2] = '수목장'; // 카테고리 변경

            // 추가 개선: 이름이 단순히 '묘지 관리비'라면 좀 더 명확하게 변경
            if (itemName.includes('묘지 관리비')) {
                // 설명에서 "수목장 개인묘", "수목장 부부묘" 등을 찾아서 이름으로 승격시키면 좋음
                if (rawText.includes('수목장 개인묘')) {
                    cols[3] = '"수목장 (개인)"';
                } else if (rawText.includes('수목장 부부묘')) {
                    cols[3] = '"수목장 (부부)"';
                } else if (rawText.includes('수목장 가족묘')) {
                    cols[3] = '"수목장 (가족)"';
                } else {
                    // 구체적인 타입이 없으면 그냥 수목장으로 변경하되, 기존 괄호(개인 등)가 있으면 유지
                    cols[3] = `"${itemName.replace('묘지 관리비', '수목장')}"`;
                }
            }
        }

        return cols.join(',');
    });

    if (fixed > 0) {
        fs.writeFileSync(CSV_FILE, newLines.join('\n'));
        console.log(`총 ${fixed}개 목련공원묘원 항목을 '기본비용'에서 '수목장'으로 변경했습니다.`);
    } else {
        console.log('수정할 항목을 찾지 못했습니다.');
    }
})();
