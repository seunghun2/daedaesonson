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
        // 이미 구조는 복구되었으므로 정규식 분해
        const cols = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
        if (cols.length < 6) return line;

        let rawText = cols[5].replace(/^"|"$/g, '');
        const originalRawText = rawText;

        // 1. "한글+숫자" 사이에 공백 추가 (예: 관리비30년 -> 관리비 30년)
        rawText = rawText.replace(/([가-힣])(\d+)/g, '$1 $2');

        // 2. "숫자+한글(특정단어)" 사이에 공백 추가 (예: 30년분 -> 30년 분, 이건 케바케라 조심)
        // 일단 패스. "관리비 30년분"은 위 1번 규칙으로 해결됨.

        // 3. 붙어있는 명사 분리 (무식하지만 효과적인 리스트 기반)
        const keywords = ['사용료', '사용기간', '관리비', '년분', '년', '거주자', '관내', '관외', '포함', '신청인', '가족', '추가', '별도'];

        keywords.forEach(key => {
            // "사용료사용기간" -> "사용료 사용기간"
            // key가 뒤에 붙은 경우
            const regexSuffix = new RegExp(`([^\\s])(${key})`, 'g');
            rawText = rawText.replace(regexSuffix, "$1 $2");

            // key가 앞에 붙은 경우 (이건 위에서 처리되지만 확실히)
            // const regexPrefix = new RegExp(`(${key})([^\\s])`, 'g');
            // rawText = rawText.replace(regexPrefix, "$1 $2");
        });

        // 4. 불필요한 공백 중복 제거
        rawText = rawText.replace(/\s+/g, ' ').trim();

        if (rawText !== originalRawText) {
            fixedCount++;
            cols[5] = `"${rawText}"`;
        }

        return cols.join(',');
    });

    const output = [header, ...newBody].join('\n');
    fs.writeFileSync(CSV_FILE, output);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  띄어쓰기 및 가독성 교정 완료');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`총 ${fixedCount}개 항목의 설명(RawText)을 다듬었습니다.`);
})();
