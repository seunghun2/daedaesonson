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

    // CSV 파싱 및 구조 복구 (강화판)
    const newBody = body.map(line => {
        // 정규식으로 따옴표 처리하여 분리 시도
        // 하지만 이미 꼬인 CSV라면 이 정규식도 오작동할 수 있음.
        // 따라서 "단순 쉼표 분리" 후 "뒤에서부터 숫자 찾기" 방식이 가장 강함.

        // 일단 단순히 쉼표로 나눔 (따옴표 무시하고 다 쪼갬 - 나중에 합칠 거니까)
        // 단, Price 식별을 위해...

        const cols = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);

        // 정상적인 6개 컬럼처럼 보여도 내용을 의심해야 함
        let needsFix = false;

        if (cols.length === 6) {
            const priceVal = cols[4].replace(/^"|"$/g, '').replace(/,/g, '');
            // 가격 칸에 숫자가 아니거나, 빈칸이면 의심
            if (isNaN(priceVal) || priceVal.trim() === '') {
                needsFix = true;
            }
        } else {
            needsFix = true; // 컬럼 수가 6개가 아니면 무조건 고침
        }

        if (needsFix) {
            // 구조 재조립 로직
            const allParts = line.split(','); // 그냥 무식하게 다 쪼갬

            // 1. ID는 무조건 첫번째
            const id = allParts[0];

            // 2. FacName (두번째)
            const facName = allParts[1]; // 보통 이름엔 콤마 없다고 가정... 만약 있으면? 일단 스킵

            // 3. Category (세번째) - 보통 '기본비용', '매장묘' 등 한 단어
            const category = allParts[2];

            // 4. 뒤에서부터 탐색하여 Price 찾기
            // RawText가 맨 뒤일 수도 있고, 없을 수도 있음.
            // 하지만 Price는 확실히 숫자임.

            let priceIdx = -1;
            // 뒤에서부터 2번째 안짝에서 숫자를 찾음 (RawText, Price 순이거나 Price 만 있거나)
            // 너무 많이 뒤지면 주소 번지수 같은게 집힐 수 있으니 주의.
            for (let i = allParts.length - 1; i >= 3; i--) {
                const val = allParts[i].replace(/^"|"$/g, '').trim();
                // 1000 이상 숫자이고, 날짜 포맷 등이 아니어야 함.
                if (/^\d+$/.test(val) && val.length > 3) {
                    priceIdx = i;
                    break;
                }
            }

            if (priceIdx !== -1) {
                const price = allParts[priceIdx].replace(/^"|"$/g, '');

                // RawText는 Price 뒤에 있는 모든 것
                let rawText = allParts.slice(priceIdx + 1).join(',').replace(/^"|"$/g, '');

                // ItemName은 Category(2)와 Price(priceIdx) 사이의 모든 것
                // 따옴표 제거 후 합침
                let itemNameParts = allParts.slice(3, priceIdx).map(s => s.replace(/^"|"$/g, ''));
                let itemName = itemNameParts.join(', '); // 콤마로 복원

                // park-0001 (이름 끝에 가격 붙음) 해결
                const weirdNumMatch = itemName.match(/^(.*?)(\d{2,})$/);
                if (weirdNumMatch && price.startsWith(weirdNumMatch[2])) {
                    itemName = weirdNumMatch[1].trim();
                }

                // park-0122 해결: "가족봉안당(12기)관내(6월이상 거주)" 같은 경우
                // 이미 itemName에 잘 들어가 있음.

                fixedCount++;
                // 따옴표 안전하게 감싸기
                return `${id},${facName},${category},"${itemName}",${price},"${rawText}"`;
            }
        }

        return line;
    });

    const output = [header, ...newBody].join('\n');
    fs.writeFileSync(CSV_FILE, output);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  CSV 구조 복구 (강화판) 완료');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`총 ${fixedCount}개 행의 구조가 교정되었습니다.`);
})();
