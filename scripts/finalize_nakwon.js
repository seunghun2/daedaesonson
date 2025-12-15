const fs = require('fs');
const CSV_FILE = 'data/pricing_all.csv';

(async () => {
    if (!fs.existsSync(CSV_FILE)) return;

    const content = fs.readFileSync(CSV_FILE, 'utf-8');
    const lines = content.split('\n');
    let fixed = 0;

    const newLines = lines.map((line, index) => {
        if (index === 0) return line;

        const cols = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
        if (cols.length < 6) return line;

        let rawText = cols[5] ? cols[5].replace(/^"|"$/g, '') : '';
        const originalRaw = rawText;

        // park-0001 정리: RawText에 지저분한 원본 데이터가 남아있으면 제거
        if (line.includes('park-0001')) {
            // "... [가격정보: ...] / 프리미엄 부부 매장묘 ..." 패턴에서 뒤의 긴 중복 부분 제거
            // "[가격정보: ...]" 가 있으면 그 뒤에 오는 "한글+숫자+원 부터" 등을 제거

            if (rawText.includes('[가격정보:')) {
                // [가격정보: ...] 뒤에 있는 " / 프리미엄..." 등을 날릴지 결정.
                // 보통 내 스크립트가 앞에 붙였으니, 뒤에 남은건 원본 쓰레기임.
                // 단, [옵션:...] 도 있을 수 있음.
                // 구조화된 태그([...])가 아닌 일반 텍스트가 뒤에 길게 붙어있으면 제거.

                // 태그가 아닌 부분 찾기 (간단히: 태그 닫는 괄호 뒤에 오는 일반 텍스트)
                // 예: "] / 프리미엄..."

                // 전략: RawText를 ' / ' 로 나눈 뒤, 구조화된 태그([]...)가 없는 항목 중
                // 제목과 유사하거나 "원 부터"가 포함된 항목 제거
                const parts = rawText.split(' / ');
                const cleanParts = parts.filter(p => {
                    const isTag = p.trim().startsWith('[') && p.trim().endsWith(']');
                    if (isTag) return true;

                    // 태그가 아닌 경우 체크
                    // 가격 정보 중복이면 제거
                    if (p.includes('원 부터')) return false;
                    // 제목과 비슷하면(길이가 길고) 제거? (여기선 제목 변수가 없으니, 그냥 '프리미엄' '매장묘' 등 키워드 and '원' 포함이면 제거)
                    if (p.length > 10 && /[가-힣]/.test(p) && /[0-9]/.test(p) && p.includes('원')) return false;

                    return true;
                });

                rawText = cleanParts.join(' / ');
            }
        }

        // 추가: 6~(12평)형 -> 6~12평형
        const itemName = cols[3].replace(/^"|"$/g, '');
        let newItemName = itemName.replace(/6~\(12평\)형/, '6~12평형');

        // 괄호 스페이싱 정리 "( 12평 )" -> "(12평)"
        newItemName = newItemName.replace(/\(\s+/g, '(').replace(/\s+\)/g, ')');

        if (rawText !== originalRaw || newItemName !== itemName) {
            fixed++;
            cols[3] = `"${newItemName}"`;
            cols[5] = `"${rawText.trim()}"`;
        }

        return cols.join(',');
    });

    if (fixed > 0) {
        fs.writeFileSync(CSV_FILE, newLines.join('\n'));
        console.log(`총 ${fixed}개 항목의 잔여 쓰레기 텍스트 및 괄호 포맷을 정리했습니다.`);
    } else {
        console.log('수정할 항목이 없습니다.');
    }
})();
