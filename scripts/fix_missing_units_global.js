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
        // 헤더 스킵
        if (index === 0) return line;

        const cols = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
        if (cols.length < 6) return line;

        let itemName = cols[3].replace(/^"|"$/g, '');
        let rawText = cols[5] ? cols[5].replace(/^"|"$/g, '') : '';
        const originalName = itemName;

        // "평당" 설명이 있지만 이름에 평/3.3㎡ 정보가 없는 경우
        // 조건: RawText에 '평당' or '3.3㎡당' or '3.3m2당' 포함
        // 제외: ItemName에님이 '평' or '㎡' or 'm2' 포함
        // 제외: ItemName이 '석물' 등 평수와 무관한 것일 수도 있으나, 보통 평당 과금이면 이름에 명시해야 함.

        const hasPyeongDesc = /평당|3\.3(㎡|m2)당|1평/.test(rawText);
        const hasPyeongTitle = /(평|㎡|m2)/.test(itemName);

        if (hasPyeongDesc && !hasPyeongTitle) {
            // "관리비" 혹은 "사용료" 키워드가 있는지 확인 (안전장치)
            if (itemName.includes('관리비') || itemName.includes('사용료')) {
                itemName = `${itemName} (1평)`;
                fixed++;
            }
        }

        if (itemName !== originalName) {
            cols[3] = `"${itemName}"`;
        }

        return cols.join(',');
    });

    if (fixed > 0) {
        fs.writeFileSync(CSV_FILE, newLines.join('\n'));
        console.log(`총 ${fixed}개 항목의 제목 불일치(설명엔 '평당'이 있는데 제목엔 없음)를 수정했습니다. "(1평)" 추가됨.`);
    } else {
        console.log('수정할 항목이 없습니다.');
    }
})();
