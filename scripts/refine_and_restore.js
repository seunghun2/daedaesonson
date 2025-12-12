const fs = require('fs');
const CSV_FILE = 'data/pricing_all.csv';

// 설명을 제목에서 분리하는 로직
function simplifyName(originalName) {
    let name = originalName;
    let desc = '';

    // 1. ( ... ) 패턴 추출
    // "매장묘역(단장)(최초15년 연장10년)관내 거주자에 한함"
    // -> name: "매장묘역(단장) (관내 거주자)"
    // -> desc: "최초15년 연장10년 관내 거주자에 한함"

    // "년", "거주", "자격", "한함", "포함", "별도" 같은 단어가 들어간 괄호나 문구는 설명으로 뺌
    const conditions = [/(\d+년)/, /거주/, /자격/, /한함/, /포함/, /별도/, /작업비/, /관리비/, /사용료/];

    // 괄호 안의 내용 분석
    name = name.replace(/\(([^)]+)\)/g, (match, content) => {
        // 단장, 합장, 평수 같은건 유지
        if (/단장|합장|쌍봉|가족|부부|개인|문중|평|위/.test(content) && content.length < 10) {
            return match; // 유지
        }

        // 그 외 조건문구면 설명으로 이동
        if (conditions.some(r => r.test(content))) {
            desc += ' ' + match;
            return ''; // 이름에서 삭제
        }

        return match;
    });

    // 괄호 밖의 긴 문구 분석 (이름 뒤에 덕지덕지 붙은 것들)
    // "관내 거주자에 한함" 같은거
    const suffixes = ["관내 거주자에 한함", "관내 거주자", "관외 거주자"];
    // 주의: "관내 거주자"는 우리가 이미 표준화 태그로 붙여놓은 것일 수 있음. "(관내 거주자)"

    // 괄호 없이 붙은 "관내 거주자에 한함" 같은거만 타겟팅
    if (name.includes('관내 거주자에 한함')) {
        name = name.replace('관내 거주자에 한함', '');
        desc += ' 관내 거주자에 한함';
        // 표준 태그 추가
        if (!name.includes('(관내 거주자)')) name += ' (관내 거주자)';
    }

    // 정리
    name = name.trim().replace(/\s+/g, ' ').replace(/\(\s*\)/g, ''); // 빈 괄호 삭제

    return { name, desc: desc.trim() };
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
        // CSV 파싱 (이미 fix_csv_2.js로 구조는 잡혔다고 가정하고, 정규식 등 사용)
        // 하지만 안전하게 쪼갭니다.
        const cols = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);

        if (cols.length < 6) return line; // 비정상

        const id = cols[0];
        let category = cols[2];
        let itemName = cols[3].replace(/^"|"$/g, '');
        let price = cols[4].replace(/^"|"$/g, '');
        let rawText = cols[5] ? cols[5].replace(/^"|"$/g, '') : '';

        let changed = false;

        // 1. 잘못된 이름 복구 (park-0011 로엠 등)
        // "묘지 관리비", "묘지사용료" 인데 가격이 50만원 이상이면 -> RawText에서 이름 가져오기 시도
        const simpleNames = ['묘지 관리비', '묘지사용료', '기본비용', '관리비', '사용료'];
        const numPrice = parseInt(price.replace(/,/g, ''), 10);

        // (단, '개장정리비' 같은건 비쌀 수 있으니 제외)
        // 이름이 너무 단순하고 가격이 비싼 경우
        if (simpleNames.some(n => itemName.replace(/\s*\(.*?\)/g, '') === n) && numPrice > 500000) {
            // RawText가 있고, 길이가 적당하면 그걸 이름으로 복원
            if (rawText && rawText.length > 2 && rawText.length < 50) {
                // "공작3단고급형1세트(사용료및관리비 별도)" -> "공작3단고급형1세트"
                let newName = rawText.split('(')[0].trim();
                if (newName.length > 0) {
                    itemName = newName;
                    // 카테고리도 '기본비용'이면 '매장묘' 등으로 추정 변경
                    if (category === '기본비용') category = '매장묘'; // 일단 매장묘로 퉁침 (안전빵)
                    changed = true;
                }
            }
        }

        // 2. 이름 간소화 (인제종합장묘센터 등)
        const simplified = simplifyName(itemName);
        if (simplified.name !== itemName) {
            itemName = simplified.name;
            // 떼어낸 설명을 RawText에 추가 (중복 방지)
            if (!rawText.includes(simplified.desc)) {
                rawText = rawText ? `${rawText} / ${simplified.desc}` : simplified.desc;
            }
            changed = true;
        }

        if (changed) {
            fixedCount++;
            cols[2] = category;
            cols[3] = `"${itemName}"`;
            cols[5] = `"${rawText}"`;
        }

        return cols.join(',');
    });

    const output = [header, ...newBody].join('\n');
    fs.writeFileSync(CSV_FILE, output);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  항목명 정밀 정제 및 복구 완료');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`총 ${fixedCount}개 항목이 더 깔끔하게 정리되었습니다.`);
})();
