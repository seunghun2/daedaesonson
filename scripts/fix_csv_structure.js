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

    // 안전한 파싱 및 보정 로직
    const newBody = body.map(line => {
        // 뒤에서부터 파싱하여 구조적 문제 해결
        // 예상 구조: ID, FacName, Cat, [ItemName(콤마가능)], Price, [RawText(콤마가능)]

        // 정규식으로 안전하게 분리하기 어려우므로, 
        // 1. 맨 앞 3개(ID, Name, Cat)는 콤마가 없을 것이라 가정 (ID는 확실, Cat은 한단어, FacName은... 가끔 있을수도?)
        // 2. 맨 뒤 2개(Price, RawText)를 식별

        // 하지만 이미 꼬여있는(밀린) 상태라면 Price가 숫자가 아닐 수도 있음.
        // 따라서 "숫자인 필드"를 Price라고 확신하고 기준점을 잡아야 함.

        // 전략: 라인 전체에서 "숫자만 있는 필드" 중 가장 뒤쪽에 있는 것을 Price로 간주.
        // 그리고 그 뒤는 RawText, 그 앞은 ItemName...

        // 콤마로 단순 분리 (따옴표 안에 있는 콤마는 무시해야 하지만, 이미 꼬였을 수도 있으니 일단 정규식 분리 시도)
        // CSV 정규식: ,(?=(?:[^"]*"[^"]*")*[^"]*$)
        const cols = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);

        // 컬럼 개수가 부족하거나 넘치면 꼬인 것
        // 정상: 6개.

        if (cols.length === 6) {
            // 정상 구조일 확률 높음. 하지만 park-0001 같은 "이름에 가격 붙음" 문제는 여기서 해결해야 함.
            let itemName = cols[3].replace(/^"|"$/g, '');
            let price = cols[4];

            // park-0001 문제: "개인 매장묘 (3평형)20" 처럼 끝에 숫자가 이상하게 붙은 경우
            // 그리고 실제 Price 컬럼도 확인.

            // 이름 끝이 숫자로 끝나고, 그 숫자가 20이거나 31 등 (가격의 앞부분)인 경우 잘라내기
            const weirdNumMatch = itemName.match(/^(.*?)(\d{2,})$/);
            if (weirdNumMatch) {
                // 가격이랑 비교해보기
                // 예: 이름끝=20, 가격=20275000 -> 20이 가격의 앞자리와 일치하면 이름에서 제거
                if (price.startsWith(weirdNumMatch[2])) {
                    itemName = weirdNumMatch[1].trim();
                    cols[3] = `"${itemName}"`; // 안전하게 따옴표
                    fixedCount++;
                }
            }

            return cols.join(',');
        }

        // 컬럼이 6개가 아니라면 (밀렸거나 합쳐진 경우) -> 대수술 필요
        // park-0108, park-0010 처럼 콤마 때문에 7개 이상으로 늘어난 경우 등

        // 1. ID (cols[0])
        const id = cols[0];

        // 2. 맨 뒤 RawText (cols[last])
        const raw = cols[cols.length - 1];

        // 3. 뒤에서 두번째 Price (숫자여야 함)
        let priceIdx = -1;
        for (let i = cols.length - 2; i >= 2; i--) {
            if (/^\d+$/.test(cols[i].replace(/^"|"$/g, ''))) {
                priceIdx = i;
                break;
            }
        }

        if (priceIdx !== -1) {
            const price = cols[priceIdx];

            // FacilityName, Category, ItemName 재조립
            // 보통 ID(0) 다음은 FacName(1), 그 다음은 Category(2)
            // 그리고 나머지(3 ~ priceIdx-1)가 다 ItemName

            const facName = cols[1];
            const category = cols[2];

            // 나머지를 합쳐서 ItemName으로
            let itemParts = cols.slice(3, priceIdx);
            let itemName = itemParts.join(', ').replace(/^"|"$/g, '');

            // park-0001 문제 보정 (위와 동일 로직)
            const weirdNumMatch = itemName.match(/^(.*?)(\d{2,})$/);
            if (weirdNumMatch && price.startsWith(weirdNumMatch[2])) {
                itemName = weirdNumMatch[1].trim();
            }

            console.log(`복구됨: ${id} / ${itemName}`);
            fixedCount++;

            // 따옴표로 감싸서 안전하게 반환
            return `${id},${facName},${category},"${itemName}",${price},${raw}`;
        }

        return line; // 해결 불가하면 일단 유지
    });

    const output = [header, ...newBody].join('\n');
    fs.writeFileSync(CSV_FILE, output);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  CSV 구조 및 이름 오류 복구 완료');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`총 ${fixedCount}개 항목이 복구되었습니다.`);
})();
