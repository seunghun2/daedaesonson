const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const CREDENTIALS_PATH = path.join(__dirname, '../data/구글 api/sonson-481412-701902a77d89.json');
const SPREADSHEET_ID = '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY';
const SHEET_NAME = '0000';
const FACILITIES_PATH = path.join(__dirname, '../data/facilities.json');

async function main() {
    console.log('🧪 테스트: park-0001 동기화\n');

    // 1. 시트 읽기
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
    const auth = new google.auth.GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() });

    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A:I`
    });

    const rows = response.data.values || [];

    // 2. park-0001 데이터만 추출
    const targetId = 'park-0001';
    const items = [];

    for (let i = 1; i < rows.length; i++) {
        const [id, name, facilityCategory, operatorType, priceCategory, productName, desc, price, representative] = rows[i];

        if (id === targetId) {
            items.push({
                category: priceCategory || '기타',
                product: productName || '',
                desc: desc || '',
                price: parseInt(price) || 0,
                isRepresentative: representative === 'Y'
            });
        }
    }

    console.log(`시트에서 ${targetId}: ${items.length}개 항목 발견\n`);

    // 3. priceInfo 구조로 변환
    const priceTable = {};

    items.forEach(item => {
        const cat = item.category;
        if (!priceTable[cat]) {
            priceTable[cat] = {
                unit: '원',
                rows: [],
                category: cat
            };
        }

        priceTable[cat].rows.push({
            name: item.product,
            grade: item.desc,
            price: item.price,
            isRepresentative: item.isRepresentative
        });
    });

    console.log('=== 새 priceInfo 구조 ===');
    Object.entries(priceTable).forEach(([cat, data]) => {
        console.log(`[${cat}] ${data.rows.length}개 항목`);
        data.rows.slice(0, 3).forEach(r => {
            console.log(`  - ${r.name}: ${r.price.toLocaleString()}원 ${r.isRepresentative ? '⭐' : ''}`);
        });
    });

    // 4. facilities.json 업데이트
    const facilities = JSON.parse(fs.readFileSync(FACILITIES_PATH, 'utf8'));
    const targetIdx = facilities.findIndex(f => f.id === targetId);

    if (targetIdx === -1) {
        console.log(`❌ ${targetId}를 facilities.json에서 찾을 수 없음`);
        return;
    }

    const oldPriceInfo = facilities[targetIdx].priceInfo;
    console.log(`\n=== 기존 priceInfo ===`);
    if (oldPriceInfo && oldPriceInfo.priceTable) {
        Object.entries(oldPriceInfo.priceTable).forEach(([cat, data]) => {
            console.log(`[${cat}] ${data.rows?.length || 0}개 항목`);
        });
    } else {
        console.log('(없음)');
    }

    // 업데이트
    facilities[targetIdx].priceInfo = {
        priceTable
    };

    // 대표 가격으로 priceRange 계산 (isRepresentative이면서 price > 0인 것 중 min/max)
    const representativePrices = items.filter(i => i.isRepresentative && i.price > 0).map(i => i.price);
    if (representativePrices.length > 0) {
        facilities[targetIdx].priceRange = {
            min: Math.min(...representativePrices),
            max: Math.max(...representativePrices)
        };
        console.log(`\n✅ priceRange 업데이트: ${facilities[targetIdx].priceRange.min.toLocaleString()} ~ ${facilities[targetIdx].priceRange.max.toLocaleString()}원`);
    }

    // 저장
    fs.writeFileSync(FACILITIES_PATH, JSON.stringify(facilities, null, 2), 'utf8');

    console.log(`\n✅ ${targetId} 동기화 완료!`);
    console.log('→ 브라우저에서 (재)낙원추모공원 확인해보세요!');
}

main().catch(e => console.error('Error:', e.message));
