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

        // park-0007 (예산군추모공원) 확인
        if (!line.includes('park-0007')) return line; // 여기만 집중 수정

        let category = cols[2];
        let itemName = cols[3].replace(/^"|"$/g, '');
        let rawText = cols[5] ? cols[5].replace(/^"|"$/g, '') : '';
        const originalName = itemName;
        const originalRaw = rawText;
        const originalCat = category;

        // 1. 이름에서 "예산군..." 같은 긴 조건 분리
        // 예: "단장묘 조경비예산군에 계속 3년이상..."
        // 패턴: (상품명)(예산군...)
        const stuckPattern = /([가-힣a-zA-Z0-9\s]+?)(예산군.*)/;
        const match = itemName.match(stuckPattern);

        // 주의: "예산군추모공원" 자체는 시설명이므로 제외해야함.. 하지만 itemName에는 시설명 안들어감.
        if (match) {
            const namePart = match[1].trim(); // "단장묘 조경비"
            const descPart = match[2].trim(); // "예산군..."

            itemName = namePart;
            // 설명 통합
            // 조건을 태그로 변환
            let tag = descPart;
            if (descPart.includes('3년이상')) tag = '[자격: 관내(3년이상)]';
            else if (descPart.includes('6월이상')) tag = '[자격: 관내(6월~3년)]'; // 단순화
            else if (descPart.includes('이외 사용자')) tag = '[자격: 관외]';
            else tag = `[자격: ${descPart}]`;

            if (!rawText.includes(tag)) {
                rawText = rawText ? `${tag} / ${rawText}` : tag;
            }
        }

        // 2. 상품명 정제 및 카테고리 이동

        // 2.1 단장묘 -> 묘지사용료 (단장) 등
        // 규격 추출
        let spec = '';
        if (itemName.includes('단장묘')) spec = '단장';
        else if (itemName.includes('합장묘')) spec = '합장'; // 없을 수도
        else if (itemName.includes('가족봉안묘')) spec = '가족봉안묘'; // 이건 상품 자체가 가족봉안묘
        else if (itemName.includes('1회차1구')) spec = '1회차 1구';
        else if (itemName.includes('1회차2구')) spec = '1회차 2구';
        else if (itemName.includes('2회차')) spec = '2회차';

        // 비용 타입 추출
        let type = '';
        if (itemName.includes('사용료')) type = '묘지사용료';
        else if (itemName.includes('관리비')) type = '묘지관리비';
        else if (itemName.includes('조경비')) type = '조경비';
        else if (itemName.includes('기타비용')) type = '기타비용';

        // 이름 재구성: "비용명 (규격)"
        if (type && spec) {
            itemName = `${type} (${spec})`;
            // 카테고리 조정
            // 묘지사용료, 묘지관리비 -> 기본비용
            // 조경비, 기타비용 -> 기타? or 기본비용?
            // 사용자 요청: "Fees" -> Basic Cost.
            // 조경비는 Maintenance 성격이므로 기본비용 가능.
            if (type === '묘지사용료' || type === '묘지관리비') category = '기본비용';
            if (type === '조경비') category = '기타';
        } else if (spec === '가족봉안묘') {
            // 그냥 가족봉안묘만 있으면? (가격만 있는 경우) -> 매장묘?
        }

        // "1회차1구" 같은거 띄어쓰기 교정 (위에서 spec으로 처리됨)

        // 3. 설명란 정리
        // 중복 제거
        if (rawText.startsWith(itemName)) {
            rawText = rawText.substring(itemName.length).trim().replace(/^[\/,\s]+/, '');
        }
        // "단장묘 사용료..." 등 옛날 이름이 설명에 남아있으면 제거
        rawText = rawText.replace(/단장묘 사용료|가족봉안묘 사용료|1회차.*사용료/g, '').trim();
        rawText = rawText.replace(/예산군.*주민등록.*/g, (m) => ''); // 이미 태그로 뺐다면 원문 제거 (위험?)
        // 아까 태그 분리는 이름에서 한것. 설명에 있는건?
        // 설명에 있는 긴 텍스트도 태그로 치환
        if (rawText.includes('예산군에 계속 3년이상')) {
            if (!rawText.includes('[자격:')) rawText = `[자격: 관내(3년이상)] / ${rawText}`;
            rawText = rawText.replace(/예산군에 계속 3년이상[^,]*,?/, '');
        }
        // (너무 복잡해지니 일단 이름 분리 위주로)

        // Clean up
        rawText = rawText.replace(/^\/|\/$/g, '').trim();

        if (itemName !== originalName || rawText !== originalRaw || category !== originalCat) {
            fixed++;
            cols[2] = category;
            cols[3] = `"${itemName.trim()}"`;
            cols[5] = `"${rawText.trim()}"`;
        }

        return cols.join(',');
    });

    if (fixed > 0) {
        fs.writeFileSync(CSV_FILE, newLines.join('\n'));
        console.log(`총 ${fixed}개 예산추모공원(park-0007) 항목을 대대적으로 정비했습니다.`);
    } else {
        console.log('수정할 항목이 없습니다.');
    }
})();
