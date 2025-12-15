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
        if (index === 0) return line;

        const cols = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
        if (cols.length < 6) return line;

        let itemName = cols[3].replace(/^"|"$/g, '');
        let rawText = cols[5] ? cols[5].replace(/^"|"$/g, '') : '';
        const originalName = itemName;
        const originalRaw = rawText;

        // 차원 정보 추출 강화 (cm, m, 척, 자 등 + x, * 구분자)
        // 패턴: 숫자 + (단위)? + 구분자(*, x) + 숫자 + (단위)? ...
        // 예: 67 * 36 * 12 cm, 5.0尺x7.2尺

        // 단위 목록
        const units = 'cm|mm|m|km|尺|척|자|㎝|㎜';
        // 구분자
        const sep = '[*xX]';

        // 정규식 구성:
        // (숫자) (단위)? (separator) (숫자) (단위)? ... 반복
        // 최소한 "숫자+Sep+숫자" 구조여야 함.
        // 그리고 맨 뒤에 단위가 올 수도 있음.

        // 정규식: [\d\.]+ \s* (단위)? \s* [x*] \s* [\d\.]+ ...
        const dimRegex = new RegExp(`(([\\d\\.]+)\\s*(${units})?\\s*${sep}\\s*([\\d\\.]+)(\\s*(${units})?(\\s*${sep}\\s*([\\d\\.]+))?)?(\\s*(${units}))?)`, 'i');

        const match = itemName.match(dimRegex);
        if (match) {
            let dimPart = match[0];
            let splitIdx = match.index;

            // 검증: "비석 3자" 처럼 단순한 건 제외하기 위해, separator가 포함되어 있는지 확신
            // 정규식이 separator를 포함하므로 OK.
            // 단, "Model X 3" 같은 경우? 드묾.

            // 분리 위치: 매칭된 문자열의 시작점.
            // 이름과 붙어있는 경우 (예: "묘테석5.0...") -> 5 앞에서 자름.

            const namePart = itemName.substring(0, splitIdx).trim();
            // 뒷부분에 남은 찌꺼기가 있는지 확인
            // dimPart 뒤에 또 문자가 있으면? 예: "50x50 입니다" -> 설명으로 다 보냄.
            let residue = itemName.substring(splitIdx + dimPart.length).trim();

            // 전체 디멘션 부분 = dimPart + residue
            let fullDesc = dimPart + (residue ? ' ' + residue : '');

            itemName = namePart;
            // 설명에 추가
            // 중복 체크: 공백/특수문자 제외하고 비교
            const cleanRaw = rawText.replace(/[\s\[\]]/g, '');
            const cleanDim = fullDesc.replace(/[\s]/g, '');

            if (!cleanRaw.includes(cleanDim)) {
                rawText = rawText ? `[규격: ${fullDesc}] / ${rawText}` : `[규격: ${fullDesc}]`;
            }
        }

        // park-0043 등에서 보이는 "기본비석70" 처럼 띄어쓰기 없는 경우, 위 로직이 70부터 잘라주므로 해결됨.
        // 단, "70" 앞의 글자가 한글이면 띄어쓰기가 없었던 것.

        // park-0049: 1단 단장 묘테석(한글) + 5.0(숫자) -> 위 로직이 5.0 앞에서 자름. 해결.

        if (itemName !== originalName || rawText !== originalRaw) {
            fixed++;
            cols[3] = `"${itemName.trim()}"`;
            cols[5] = `"${rawText.trim()}"`;
        }

        return cols.join(',');
    });

    if (fixed > 0) {
        fs.writeFileSync(CSV_FILE, newLines.join('\n'));
        console.log(`총 ${fixed}개 항목의 복합 치수 정보(*, x, 척 등)를 설명으로 이동했습니다.`);
    } else {
        console.log('수정할 항목이 없습니다.');
    }
})();
