const fs = require('fs');
const path = require('path');

const JSON_FILE = path.join(__dirname, '..', 'data', 'deep_crawled_data.json');
const CSV_FILE = path.join(__dirname, '..', 'data', 'deep_crawled_preview.csv');

function convertToCSV() {
    if (!fs.existsSync(JSON_FILE)) {
        console.error('JSON 파일이 없습니다.');
        return;
    }

    const data = JSON.parse(fs.readFileSync(JSON_FILE, 'utf-8'));
    const rows = [];

    // 헤더 (가독성 중심 재배치)
    const headers = ['ID', '시설명', '종교', '카테고리', '상품명칭', '가격(만원)', '가격(원)', '가격유형', '주변문구(요약)'];
    rows.push(headers.join(','));

    data.forEach(facility => {
        const prices = facility.allPrices || [];

        if (prices.length > 0) {
            prices.forEach(p => {
                // 상품명칭 정제 (없으면 컨텍스트에서 유추)
                let pName = p.productName || '일반상품';
                if (pName === '일반상품' && p.context) {
                    // 컨텍스트 앞부분에서 짧게 추출
                    pName = p.context.split('\n')[0].substring(0, 15).trim() || '일반상품';
                }

                const row = [
                    facility.no,
                    `"${facility.name}"`,
                    facility.religion || '일반',
                    p.category,
                    `"${pName}"`,
                    `"${p.priceText}"`,
                    p.price,
                    p.type,
                    `"${p.context.replace(/"/g, '""').replace(/\s+/g, ' ').substring(0, 50)}..."` // 50자 요약
                ];
                rows.push(row.join(','));
            });
        } else {
            rows.push([facility.no, `"${facility.name}"`, facility.religion || '일반', '-', '정보 없음', '-', '0', '-', '텍스트 없음'].join(','));
        }
    });

    fs.writeFileSync(CSV_FILE, '\ufeff' + rows.join('\n'));
    console.log(`✅ CSV 변환 완료: ${CSV_FILE}`);
}

convertToCSV();
