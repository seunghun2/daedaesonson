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

        // --- 1. 비용 명칭 대통합 (Aggressive Unification) ---
        // "묘원 사용료", "공설묘지 사용료", "공동묘지 사용료" -> "묘지사용료"
        if (/(묘원|공설묘지|공동묘지|분묘)\s*사용료/.test(itemName)) {
            itemName = itemName.replace(/(묘원|공설묘지|공동묘지|분묘)\s*사용료/, '묘지사용료');
        }
        if (/(묘원|공설묘지|공동묘지|분묘)\s*관리비/.test(itemName)) {
            itemName = itemName.replace(/(묘원|공설묘지|공동묘지|분묘)\s*관리비/, '묘지관리비');
        }
        // "토지대" 관련 통합
        if (itemName.includes('토지대') && !itemName.startsWith('토지대')) {
            // "기본토지대" 등은 유지하되, "묘지 토지대" 등은 "토지대"로?
            // 일단 놔둠.
        }

        // --- 2. 단위 및 포맷 정리 ---
        // "1기 기" -> "(1기)"
        itemName = itemName.replace(/1기\s*기/, '(1기)');

        // 단위 괄호화: 1기, 1구, 1위 가 단독으로 있거나 공백 뒤에 있으면 괄호 씌움
        // 예: "묘지사용료 1기" -> "묘지사용료 (1기)"
        // 정규식: (공백|^)(1기|1구|1위)(공백|$)
        itemName = itemName.replace(/(\s|^)(1기|1구|1위)(\s|$)/g, '$1($2)$3');

        // 이중 괄호 제거: "((2평))" -> "(2평)"
        itemName = itemName.replace(/\(\(/g, '(').replace(/\)\)/g, ')');
        rawText = rawText.replace(/\(\(/g, '(').replace(/\)\)/g, ')');

        // "묘 지" -> "묘지"
        rawText = rawText.replace(/묘 지/g, '묘지');


        // --- 3. 설명란(RawText) 태그화 및 정리 ---

        // 이용자격: ... -> [자격: ...]
        // 정규식: "이용자격\s*[:\s]*" -> "[자격: " (뒤에 닫는 대괄호는 어디??)
        // 문장 구조상 "이용자격: ~" 뒤에 콤마나 슬래시, 또는 줄 끝에서 끊어야 함.
        // 복잡하므로, 일단 키워드 치환만. ([자격] 태그로 시작하게)

        if (/이용자격\s*[:\s]*/.test(rawText)) {
            rawText = rawText.replace(/이용자격\s*[:\s]*/g, '[자격: ');
            // 닫는 괄호 처리: 다음 콤마(,)나 슬래시(/) 앞에서 닫아줘야 하는데...
            // 간단히: 문장에 ']'가 없다면 끝에 붙이거나, 다음 구분자 앞에 붙임.
            // 여기선 정규식 한계로 "[자격: " 로만 바꾸고 뒤에 텍스트가 옴.
            // 추후 정리 필요. 일단 "[자격: ... " 형태라도 가독성은 좋아짐.
            // 더 안전하게: "이용자격: A" -> "[자격: A]"
        }

        // 사용기간: ... -> [기간: ...]
        if (/사용기간\s*[:\s]*/.test(rawText)) {
            rawText = rawText.replace(/사용기간\s*[:\s]*/g, '[기간: ');
        }

        // 관내/관외 거주자 태그
        if (rawText.includes('( 관내 거주자)') || rawText.includes('(관내 거주자)')) {
            rawText = rawText.replace(/\(?\s*관내\s*거주자\s*\)?/g, '[자격: 관내]');
        }
        if (rawText.includes('( 관외 거주자)') || rawText.includes('(관외 거주자)')) {
            rawText = rawText.replace(/\(?\s*관외\s*거주자\s*\)?/g, '[자격: 관외]');
        }

        // 중복 제목 제거 (한번 더)
        // "묘지사용료" / "묘지 사용료 1기당..." -> "묘지 사용료" 제거
        // 띄어쓰기 달라도 제거
        const compactItem = itemName.replace(/\s/g, '');
        const compactRawStart = rawText.replace(/\s/g, '').substring(0, compactItem.length);
        if (compactItem === compactRawStart) {
            // 원본 rawText에서 해당 길이만큼 제거하되, 공백 고려하여 대략적 위치 찾기
            // 너무 위험하니, "단순 string match" 재시도
            // "묘지사용료" vs "묘지 사용료"
            // 정규식으로 itemName의 각 글자 사이에 \s* 넣어서 매칭?
            const loosePattern = itemName.split('').join('\\s*');
            const regex = new RegExp(`^${loosePattern}\\s*`);
            rawText = rawText.replace(regex, '').replace(/^[\/,\s]+/, '');
        }


        if (itemName !== originalName || rawText !== originalRaw) {
            fixed++;
            cols[3] = `"${itemName.trim()}"`;
            cols[5] = `"${rawText.trim()}"`;
        }

        return cols.join(',');
    });

    if (fixed > 0) {
        fs.writeFileSync(CSV_FILE, newLines.join('\n'));
        console.log(`총 ${fixed}개 항목의 명칭 표준화(묘원->묘지) 및 설명을 정리했습니다.`);
    } else {
        console.log('수정할 항목이 없습니다.');
    }
})();
