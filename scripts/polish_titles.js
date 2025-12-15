const fs = require('fs');
const CSV_FILE = 'data/pricing_all.csv';

// 설명을 제목에서 분리하는 로직 (조건/부연설명 분리)
function cleanTitle(originalName) {
    let name = originalName;
    let desc = '';

    // 설명으로 뺄 키워드들
    const conditions = [/상이/, /별도/, /거주/, /자격/, /한함/, /포함/, /계약/, /년수/, /지구/, /위치/, /선정/, /부과/];

    name = name.replace(/\(([^)]+)\)/g, (match, content) => {
        // 단장, 합장, 평수, 기수 등은 이름의 일부이므로 유지
        if (/단장|합장|쌍봉|가족|부부|개인|문중|평|위|기/.test(content) && content.length < 10) {
            return match;
        }

        // 조건 문구면 설명으로 이동
        if (conditions.some(r => r.test(content))) {
            desc += ' ' + match;
            return '';
        }

        return match;
    });

    // 괄호 밖의 "관내 거주자에 한함" 등 처리
    if (name.includes('관내 거주자에 한함')) { name = name.replace('관내 거주자에 한함', ''); desc += ' 관내 거주자에 한함'; }

    return { name: name.trim().replace(/\s+/g, ' '), desc: desc.trim() };
}

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

        const genericNames = ['묘지사용료', '묘지 관리비', '기본비용', '관리비', '사용료', '분양금'];

        let changed = false;

        // 1. 구체적 이름 복원 (Generic Title -> Specific Title from RawText)
        if (rawText && genericNames.some(GN => itemName.replace(/\s*\(.*?\)/g, '').trim() === GN)) {
            // RawText에 구체적인 상품명 키워드가 있는지 확인
            const specificKeywords = ['매장묘', '봉안묘', '봉안담', '평장', '자연장', '수목장', '잔디장', '화초장', '가족묘', '부부묘'];

            if (specificKeywords.some(kw => rawText.includes(kw))) {
                // RawText를 제목으로 승격! (단, 너무 길면 안됨, 100자 이내)
                if (rawText.length < 100) {
                    // 예: "매장묘, 봉안묘사용료(평당)" -> 이걸 제목으로
                    // 단, 괄호 뒤에 잡다한게 많으면 괄호 앞까지만? 
                    // 아니면 통째로 쓰고 아래에서 cleanTitle로 정리? -> 통째로 쓰고 정리하는게 나음.
                    itemName = rawText;
                    changed = true;
                }
            }
        }

        // 2. 제목 내 군더더기 설명 분리 (Cleanse)
        const cleaned = cleanTitle(itemName);
        if (cleaned.name !== itemName) {
            itemName = cleaned.name;
            // 떼어낸 설명을 RawText에 추가
            if (!rawText.includes(cleaned.desc)) {
                rawText = rawText ? `${rawText} ${cleaned.desc}` : cleaned.desc;
            }
            changed = true;
        }

        // 3. 중복 제거 (제목과 RawText가 거의 같으면 RawText 비움)
        // 띄어쓰기/특수문자 제거 후 비교
        const normalizedItem = itemName.replace(/[\s,()]/g, '');
        const normalizedRaw = rawText.replace(/[\s,()]/g, '');

        if (normalizedRaw.includes(normalizedItem) && normalizedRaw.length < normalizedItem.length + 5) {
            rawText = ''; // 완벽한 중복이면 제거
            changed = true;
        }

        if (changed) {
            fixedCount++;
            cols[3] = `"${itemName}"`;
            cols[5] = `"${rawText.trim()}"`;
        }

        return cols.join(',');
    });

    const output = [header, ...newBody].join('\n');
    fs.writeFileSync(CSV_FILE, output);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  제목/설명 최적화 (Polish) 완료');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`총 ${fixedCount}개 항목을 매끄럽게 다듬었습니다.`);
})();
