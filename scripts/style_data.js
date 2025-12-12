const fs = require('fs');
const CSV_FILE = 'data/pricing_all.csv';

function cleanAndFormat(originalItemName, originalRawText) {
    let name = originalItemName;
    let desc = originalRawText;

    // 1. RawText 정제 (불필요한 공백, 이상한 문자 제거)
    desc = desc.replace(/\s+/g, ' ').trim();

    // 2. 제목이 너무 Generic하면 RawText에서 구체적 이름 찾기
    const genericNames = ['묘지 관리비', '묘지관리비', '관리비', '묘지사용료', '사용료', '기본비용', '시설사용료'];
    // 괄호 제거한 순수 이름만 비교
    const pureName = name.split('(')[0].trim();

    if (genericNames.includes(pureName) && desc.length > 0) {
        // RawText에서 후보군 추출
        // 예: "조성분묘 관리비(매5년마다)1제곱미터 당" -> "조성분묘 관리비"
        // 괄호 앞이 진짜 이름일 확률 높음
        let potentialName = desc.split('(')[0].trim();

        // 하지만 "매장묘 1.5평" 처럼 괄호가 없을 수도 있음.
        // desc가 너무 길지 않으면(<30자) 통째로 제목으로 고려
        if (potentialName.length > 1 && potentialName.length < 30) {
            // 기존 제목보다 더 구체적인가? (키워드 체크)
            const specificKeywords = ['매장', '봉안', '조성', '평장', '자연', '수목', '잔디', '부부', '가족', '공동'];
            if (specificKeywords.some(k => potentialName.includes(k)) || potentialName.includes('관리비') || potentialName.includes('사용료')) {
                name = potentialName;
                // 승격 후 desc에서 해당 부분 제거 시도? 아니면 아래 dedupe에서 처리
            }
        }
    }

    // 3. 제목과 설명의 완벽한 역할 분담
    // 주기, 단위, 조건 키워드
    const descKeywords = ['매5년', '매년', '1년', '5년', '기준', '계약', '관내', '관외', '자격', '선정', '부과', '상이', '별도', '포함'];
    const unitKeywords = ['평', '기', '위', '단', '쌍', '제곱미터', 'm2'];

    // 괄호 안의 내용 분석
    name = name.replace(/\((.*?)\)/g, (match, content) => {
        // 단위는 제목에 남김 (예: 1평, 1기)
        if (unitKeywords.some(u => content.includes(u)) && content.length < 10) {
            return match;
        }
        // 주기는 설명으로 (예: 1년, 5년)
        if (descKeywords.some(d => content.includes(d))) {
            desc += ' ' + match;
            return '';
        }
        return match;
    });

    // 4. RawText가 제목을 포함하면 중복 제거
    // 예: 제목="조성분묘 관리비", 설명="조성분묘 관리비(매5년)" -> 설명="(매5년)"
    // 띄어쓰기 무시하고 비교
    const normName = name.replace(/\s/g, '');
    let normDesc = desc.replace(/\s/g, '');

    if (normDesc.startsWith(normName)) {
        // 앞부분이 겹침 -> 제거
        desc = desc.substring(name.length).trim();
        // 찌꺼기 제거 (괄호 닫기 등)
        if (desc.startsWith(')') || desc.startsWith(']')) desc = desc.substring(1).trim();
    }

    // 5. 텍스트 다듬기
    name = name.replace(/\s+/g, ' ').trim();
    desc = desc.replace(/\s+/g, ' ').trim();

    // 설명이 괄호로 시작하지 않으면, 그리고 제목과 이어지는 문장이면 자연스럽게 연결
    // 하지만 "우리 스타일"은 깔끔한 분리이므로, 일단 desc는 부가정보만 남김.

    // 6. 특수 사례 : "1제곱미터 당" -> 제목이나 설명으로 명확히
    if (desc.includes('1제곱미터 당')) {
        desc = desc.replace('1제곱미터 당', '(1㎡ 당)');
    }
    if (name.includes('1제곱미터 당')) {
        name = name.replace('1제곱미터 당', '(1㎡ 당)');
    }

    return { name, desc };
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

        let itemName = cols[3].replace(/^"|"$/g, '');
        let rawText = cols[5] ? cols[5].replace(/^"|"$/g, '') : '';
        const originalName = itemName;
        const originalRaw = rawText;

        const result = cleanAndFormat(itemName, rawText);

        if (result.name !== originalName || result.desc !== originalRaw) {
            fixedCount++;
            cols[3] = `"${result.name}"`;
            cols[5] = `"${result.desc}"`;
        }

        return cols.join(',');
    });

    const output = [header, ...newBody].join('\n');
    fs.writeFileSync(CSV_FILE, output);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  데이터 스타일링 (Our Style) 완료');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`총 ${fixedCount}개 항목을 우리 스타일로 깔끔하게 정리했습니다.`);
})();
