const fs = require('fs');
const CSV_FILE = 'data/pricing_all.csv';

// 텍스트 중복 제거 함수 (예: "ABCABC" -> "ABC")
function deduplicateStr(str) {
    if (!str || str.length < 4) return str;
    const len = str.length;
    if (len % 2 === 0) {
        const half = len / 2;
        const first = str.slice(0, half);
        const second = str.slice(half);
        if (first === second) return first;
    }
    // 괄호 단위 중복 제거 (예: "(1.5평)(1.5평)" -> "(1.5평)")
    return str.replace(/(\([^)]+\))\1/g, '$1');
}

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

        const originalItemName = itemName;
        const originalRawText = rawText;

        // 1. 중복 텍스트 제거 (김해공원묘원 해결)
        itemName = deduplicateStr(itemName);
        rawText = deduplicateStr(rawText);

        // 2. 제목이 Generic하고 RawText가 Specific하면 승격 (자하연팔당 해결)
        const genericNames = ['묘지사용료', '묘지 관리비', '기본비용', '관리비', '사용료', '분양금', '시설사용료'];
        const isGeneric = genericNames.some(GN => itemName.replace(/\s*\(.*?\)/g, '').trim() === GN);

        if (rawText && isGeneric) {
            const specificKeywords = ['매장묘', '봉안묘', '봉안담', '평장', '자연장', '수목장', '잔디장', '화초장', '가족묘', '부부묘', '납골묘'];

            // RawText가 구체적이고 이름으로 쓸만하다면 승격
            if (specificKeywords.some(kw => rawText.includes(kw)) && rawText.length < 60) {
                itemName = rawText;
                // 승격 후, RawText는 비우거나 조건을 남김 (아래 cleanTitle에서 처리)
            }
        }

        // 3. 제목 내 조건 문구 설명으로 이동 (강릉공원묘원 해결)
        const cleaned = cleanTitle(itemName);
        if (cleaned.name !== itemName) {
            itemName = cleaned.name;
            // 떼어낸 설명을 RawText에 추가 (중복 방지)
            if (!rawText.includes(cleaned.desc)) {
                rawText = rawText ? `${rawText} ${cleaned.desc}` : cleaned.desc;
            }
        }

        // 4. 최종 문맥 중복 정리 (제목과 설명이 너무 같으면 설명 비움)
        const normItem = itemName.replace(/\s/g, '');
        const normRaw = rawText.replace(/\s/g, '');
        if (normRaw && normRaw.includes(normItem) && normRaw.length < normItem.length + 5) {
            rawText = ''; // 완벽 중복
        }

        // 변경사항 적용
        if (itemName !== originalItemName || rawText !== originalRawText) {
            fixedCount++;
            cols[3] = `"${itemName}"`;
            cols[5] = `"${rawText.trim()}"`;
        }

        return cols.join(',');
    });

    const output = [header, ...newBody].join('\n');
    fs.writeFileSync(CSV_FILE, output);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  데이터 최종 연마(Polish) 완료');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`총 ${fixedCount}개 항목의 가독성을 개선하고 중복을 제거했습니다.`);
})();
