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

    const newLines = lines.map(line => {
        // park-0020 목련공원묘원 타겟팅
        if (!line.includes('park-0020')) return line;

        // 쉼표로 단순 분리 (따옴표 고려 안 함, 왜냐하면 이미 깨져있을 확률이 높음)
        // 하지만 이미 따옴표로 감싸져 있는데 내용물에 쉼표가 있어서 깨진 것일 수도 있음.
        // 일단 단순 분리 후 숫자 위치를 찾음.
        const cols = line.split(',');

        if (cols.length <= 6) return line; // 정상일 가능성 있음

        // 구조: ID, Name, Category, [ItemName Fragments...], Price, [RawText Fragments...]
        // Price는 보통 6자리 이상의 숫자임 (10500000 등)

        // 뒤에서부터 탐색하여 Price로 추정되는 숫자 찾기
        let priceIndex = -1;
        for (let i = cols.length - 1; i >= 3; i--) {
            const val = cols[i].replace(/"/g, '').trim();
            // 순수 숫자로 이루어져 있고, 길이가 4 이상인 경우 (가격)
            if (/^\d+$/.test(val) && val.length >= 4) {
                // 단, 5년, 30년 같은 년도는 제외해야 함. 보통 년도는 '년'이 붙거나 작은 숫자임.
                // 여기서는 순수 숫자만 검사하므로 '5년'은 걸러짐. 
                // 혹시 년도가 숫자로만 되어있을 수 있으니 값의 크기도 고려 (예: > 1000)
                if (parseInt(val) > 1000) {
                    priceIndex = i;
                    break;
                }
            }
        }

        if (priceIndex !== -1) {
            const facilityId = cols[0];
            const facilityName = cols[1];
            const category = cols[2];
            const price = cols[priceIndex];

            // Name: Category(idx 2) 이후부터 PriceIndex 전까지
            const nameParts = cols.slice(3, priceIndex);
            let itemName = nameParts.join(', ').replace(/"/g, '').trim(); // 쉼표 복원 및 따옴표 제거

            // RawText: PriceIndex 이후부터 끝까지
            const rawParts = cols.slice(priceIndex + 1);
            let rawText = rawParts.join(', ').replace(/"/g, '').trim();

            fixed++;
            // CSV 포맷으로 재조립
            return `${facilityId},${facilityName},${category},"${itemName}",${price},"${rawText}"`;
        }

        return line;
    });

    if (fixed > 0) {
        fs.writeFileSync(CSV_FILE, newLines.join('\n'));
        console.log(`총 ${fixed}개 목련공원묘원(park-0020) 깨진 데이터를 복구했습니다.`);
    } else {
        console.log('수정할 항목을 찾지 못했습니다.');
    }
})();
