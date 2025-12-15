const fs = require('fs');
const CSV_FILE = 'data/pricing_all.csv';

(async () => {
    if (!fs.existsSync(CSV_FILE)) {
        console.log('CSV 파일이 없습니다.');
        return;
    }

    let content = fs.readFileSync(CSV_FILE, 'utf-8');
    const lines = content.split('\n');
    let fixed = 0;

    const newLines = lines.map(line => {
        // park-0198 삼계공설묘지 묘지 관리비 2000원 건
        if (line.includes('park-0198') && line.includes('묘지 관리비') && line.includes(',2000,')) {
            // 이미 평수가 있으면 패스
            if (!line.includes('(1평)')) {
                fixed++;
                // 이름에 (1평) 추가, RawText에 (1평 당) 추가 (있는 경우 유지)
                return line.replace('묘지 관리비', '묘지 관리비 (1평)')
                    .replace(/,$/, ',"(1평 당)"'); // 빈 RawText 채우기
            }
        }

        // park-0201 죽변화성리공설묘지 2000원 건 (유사 사례)
        if (line.includes('park-0201') && line.includes('묘지 관리비') && line.includes(',2000,')) {
            if (!line.includes('(1평)')) {
                fixed++;
                return line.replace('묘지 관리비', '묘지 관리비 (1평)');
            }
        }

        // park-0213 상주시공설묘지 2000원 건 (유사 사례) - 이미 (1평)이 있는지 확인 필요
        // Line 797: 묘지 관리비 (1평) -> 되어있음.

        return line;
    });

    if (fixed > 0) {
        fs.writeFileSync(CSV_FILE, newLines.join('\n'));
        console.log(`총 ${fixed}개 항목의 2,000원 짜리 관리비에 평수(1평)를 명시했습니다.`);
    } else {
        console.log('수정할 항목을 찾지 못했습니다.');
    }
})();
