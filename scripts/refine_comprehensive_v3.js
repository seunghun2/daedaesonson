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
    let categoryFixed = 0;
    let nakwonFixed = 0;

    // 로깅
    const logs = [];

    const newLines = lines.map((line, index) => {
        if (index === 0) return line;

        const cols = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
        if (cols.length < 6) return line;

        const id = cols[0];
        let category = cols[2];
        let itemName = cols[3].replace(/^"|"$/g, '');
        let rawText = cols[5] ? cols[5].replace(/^"|"$/g, '') : '';
        const price = parseInt(cols[4] || '0');
        const originalName = itemName;
        const originalDesc = rawText;
        const originalCat = category;

        // --- 1. 낙원추모공원 (park-0001) 정밀 타격 ---
        if (id === 'park-0001') {
            // "사용료 1평형 기준" -> 기본비용, 이름 표준화
            if (itemName.includes('사용료') && itemName.includes('1평형 기준')) {
                if (category !== '기본비용') category = '기본비용';
                itemName = '묘지사용료 (1평형 기준)'; // 표준화
                // 설명 중복 제거
                if (rawText === '사용료 1평형 기준' || rawText === itemName) rawText = '';
            }

            // "세트" 뒤에 붙은 텍스트 분리 (예: "상석 2.3 세트고흥석")
            // "자" 뒤에 붙은 텍스트 분리 (예: "2.5자걸방석")
            // 단, "자"는 "글자", "의자", "자연" 등 다른 단어일 수 있으니 주의. 여기선 "2.X자" 패턴

            if (itemName.includes('세트') && !itemName.endsWith('세트')) {
                const splitIdx = itemName.indexOf('세트') + 2;
                // 세트 뒤가 공백이 아니면 분리
                if (itemName[splitIdx] && itemName[splitIdx] !== ' ') {
                    const namePart = itemName.substring(0, splitIdx).trim();
                    const descPart = itemName.substring(splitIdx).trim();
                    if (descPart.length > 0) {
                        itemName = namePart;
                        rawText = rawText ? `[옵션: ${descPart}] / ${rawText}` : `[옵션: ${descPart}]`;
                    }
                }
            }

            // "평장상석 2.5자걸방석 제외"
            if (/(\d(\.\d)?자)([^ \)])/.test(itemName)) {
                // "2.5자" 뒤에 공백이나 닫는괄호가 아닌 문자가 오면
                const match = itemName.match(/(\d(\.\d)?자)([^ \)])/);
                if (match) {
                    const splitIdx = match.index + match[1].length;
                    const namePart = itemName.substring(0, splitIdx).trim();
                    const descPart = itemName.substring(splitIdx).trim();
                    itemName = namePart;
                    rawText = rawText ? `[상세: ${descPart}] / ${rawText}` : `[상세: ${descPart}]`;
                }
            }
            nakwonFixed++;
        }

        // --- 2. 전역 카테고리 재확인 (Category Correction) ---
        // "사용료", "관리비" 단독으로 쓰이거나 단위만 붙은 경우 -> 무조건 기본비용
        // "매장묘 사용료" (띄어쓰기 포함) 체크
        if (['매장묘', '봉안묘', '수목장'].includes(category)) {
            const cleanName = itemName.replace(/\s/g, ''); // 공백제거 후 매칭
            if (/^(묘지)?(매장묘|봉안묘|수목|자연장)?(사용료|관리비)(\(.*\))?$/.test(cleanName)) {
                // 가격이 패키지가 아니면 (500만 이하)
                if (price < 5000000) {
                    category = '기본비용';
                }
            }
        }

        // --- 3. 이름/설명 중복 제거 (De-duplication) ---
        // 이름이 설명에 완전히 포함되어 있고, 설명이 이름보다 조금 더 길거나 같을 때
        // => 이름 부분만 제거? 아니면 설명이 이름과 똑같으면 제거.
        // 여기선 "완벽 일치"만 제거. 포함관계 제거는 위험 (맥락 상실)
        if (itemName.replace(/\s/g, '') === rawText.replace(/\s/g, '')) {
            rawText = ''; // 중복이면 설명 날림
        }

        // --- 4. 긴 이름 분리 (Long Title Separation) ---
        // 이름에 괄호로 긴 설명이 있는 경우 분리
        // 예: "상품명(이것은 아주 긴 설명입니다)" -> "상품명", Desc: "이것은..."
        if (itemName.length > 20 && itemName.endsWith(')')) {
            const lastOpenParen = itemName.lastIndexOf('(');
            if (lastOpenParen !== -1) {
                const contentInParen = itemName.substring(lastOpenParen + 1, itemName.length - 1);
                // 괄호 내용 길이가 10자 이상이면 설명으로 간주
                if (contentInParen.length > 10) {
                    itemName = itemName.substring(0, lastOpenParen).trim();
                    rawText = rawText ? `[상세: ${contentInParen}] / ${rawText}` : `[상세: ${contentInParen}]`;
                }
            }
        }

        // --- 5. 띄어쓰기 교정 (Spacing) ---
        // "세트" + 한글 -> "세트 " + 한글 (park-0001 외 전역적으로)
        if (/세트[가-힣]/.test(itemName)) {
            itemName = itemName.replace(/(세트)([가-힣])/g, '$1 $2');
        }
        // "1평" 등 단위 뒤 한글 붙은 경우 (이건 앞선 스크립트에서도 했지만 강화)
        // 1평사용료 -> 1평 사용료
        if (/(\d(평|기|위|자))([가-힣])/.test(itemName)) {
            // 단, "1평형" 처럼 접미사는 제외해야 함. (형, 급, 식 등)
            // "1평형" -> 유지. "1평사용료" -> 분리
            itemName = itemName.replace(/(\d(평|기|위|자))([^형급식\s\)\],.])/g, '$1 $2');
        }

        if (itemName !== originalName || rawText !== originalDesc || category !== originalCat) {
            fixed++;
            cols[2] = category;
            cols[3] = `"${itemName.trim()}"`;
            cols[5] = `"${rawText.trim()}"`;

            if (category !== originalCat) categoryFixed++;
        }

        return cols.join(',');
    });

    if (fixed > 0) {
        fs.writeFileSync(CSV_FILE, newLines.join('\n'));
        console.log(`[종합 정리 완료]`);
        console.log(`총 수정 항목: ${fixed}개`);
        console.log(`- 카테고리 이동: ${categoryFixed}개`);
        console.log(`- 낙원추모공원 및 기타 텍스트 정리 다수 수행`);
    } else {
        console.log('수정 내역이 없습니다.');
    }
})();
