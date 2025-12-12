const fs = require('fs');
const CSV_FILE = 'data/pricing_all.csv';

(async () => {
    if (!fs.existsSync(CSV_FILE)) {
        console.log('CSV 파일이 없습니다.');
        return;
    }

    const content = fs.readFileSync(CSV_FILE, 'utf-8');
    const lines = content.split('\n');
    let fixedAnseong = 0;
    let fixedPublic = 0;

    const newLines = lines.map(line => {
        // CSV 파싱
        const cols = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
        if (cols.length < 6) return line;

        let itemName = cols[3].replace(/^"|"$/g, '');
        let rawText = cols[5] ? cols[5].replace(/^"|"$/g, '') : '';
        const originalName = itemName;
        const originalRaw = rawText;

        // 1. 천주교안성추모공원 및 유사 패턴 처리 (중국산, 별도 비용)
        if (line.includes('천주교안성추모공원') || itemName.includes(', 중국') || itemName.includes('비용 별도')) {
            // ", 중국" 처리
            if (itemName.includes(', 중국')) {
                itemName = itemName.replace(', 중국', '');
                rawText = rawText ? `[원산지: 중국] / ${rawText}` : `[원산지: 중국]`;
            }

            // "비용 별도" 처리 (예: 매장(단장)봉분설치비용 별도)
            if (itemName.includes('봉분설치비용 별도')) {
                itemName = itemName.replace('봉분설치비용 별도', '').trim();
                const desc = '봉분설치비용 별도';
                rawText = rawText ? `${desc} / ${rawText}` : desc;
            }
        }

        // 2. 공설묘지 긴 설명 줄이기 (양주시 등)
        if (rawText.includes('공설묘지 사용료이용자격') || rawText.includes('공설묘지 관리비이용자격')) {
            // 접두어 단순화
            rawText = rawText.replace(/공설묘지 (사용료|관리비)이용자격:/g, '[자격] ').trim();

            // "1년이상 양주시에 거주한 시민, 사용기간..." -> "1년 이상 거주, 사용기간..." (너무 많이 줄이면 정보 손실 우려 있으므로 적당히)
            // 반복되는 "양주시에 거주한 시민"을 조금 깔끔하게
            rawText = rawText.replace(/양주시에 거주한 시민/g, '관내 거주자');

            // 쉼표 뒤 공백 확보
            rawText = rawText.replace(/,(\S)/g, ', $1');
        }

        // 공설묘지 설명 추가 정리 (일반적인 패턴)
        if (rawText.includes('사용료1기당')) {
            rawText = rawText.replace(/사용료1기당/g, '1기당');
        }
        if (rawText.includes('관리비1기당')) {
            rawText = rawText.replace(/관리비1기당/g, '1기당');
        }

        // 변경 사항 적용
        if (itemName !== originalName || rawText !== originalRaw) {
            cols[3] = `"${itemName.trim()}"`;
            cols[5] = `"${rawText.trim()}"`;

            if (line.includes('천주교안성추모공원')) fixedAnseong++;
            else fixedPublic++;
        }

        return cols.join(',');
    });

    if (fixedAnseong > 0 || fixedPublic > 0) {
        fs.writeFileSync(CSV_FILE, newLines.join('\n'));
        console.log(`- 천주교안성추모공원 등 원산지/비용별도 정리: ${fixedAnseong}개`);
        console.log(`- 공설묘지 설명(자격 요건 등) 단순화: ${fixedPublic}개`);
    } else {
        console.log('수정할 항목을 찾지 못했습니다.');
    }
})();
