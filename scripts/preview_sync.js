const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const CREDENTIALS_PATH = path.join(__dirname, '../data/구글 api/sonson-481412-701902a77d89.json');
const SPREADSHEET_ID = '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY';
const SHEET_NAME = '0000';

async function main() {
    console.log('📖 0000 시트 읽는 중...\n');

    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
    const auth = new google.auth.GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() });

    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A:I`
    });

    const rows = response.data.values || [];
    const header = rows[0];

    console.log('헤더:', header);
    console.log(`총 ${rows.length - 1}개 행 (헤더 제외)\n`);

    // 시설별로 그룹화
    const facilitiesMap = {};

    for (let i = 1; i < rows.length; i++) {
        const [id, name, facilityCategory, operatorType, priceCategory, productName, desc, price, representative] = rows[i];

        if (!id) continue;

        if (!facilitiesMap[id]) {
            facilitiesMap[id] = {
                name,
                facilityCategory,
                items: []
            };
        }

        facilitiesMap[id].items.push({
            category: priceCategory,
            product: productName,
            desc: desc || '',
            price: parseInt(price) || 0,
            isRepresentative: representative === 'Y'
        });
    }

    const facilityIds = Object.keys(facilitiesMap);
    const totalItems = Object.values(facilitiesMap).reduce((sum, f) => sum + f.items.length, 0);

    console.log('=== 시트 데이터 요약 ===');
    console.log(`시설 수: ${facilityIds.length}개`);
    console.log(`총 가격 항목: ${totalItems}개\n`);

    // 카테고리 분포
    const categoryCount = {};
    Object.values(facilitiesMap).forEach(f => {
        f.items.forEach(item => {
            categoryCount[item.category] = (categoryCount[item.category] || 0) + 1;
        });
    });

    console.log('=== 카테고리 분포 ===');
    Object.entries(categoryCount).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
        console.log(`${cat}: ${count}개`);
    });

    // 샘플 시설 출력
    console.log('\n=== 샘플 시설 (park-0001) ===');
    const sample = facilitiesMap['park-0001'];
    if (sample) {
        console.log(`이름: ${sample.name}`);
        console.log(`항목 수: ${sample.items.length}`);
        sample.items.slice(0, 5).forEach(item => {
            console.log(`  - [${item.category}] ${item.product}: ${item.price.toLocaleString()}원 ${item.isRepresentative ? '⭐대표' : ''}`);
        });
        if (sample.items.length > 5) {
            console.log(`  ... 외 ${sample.items.length - 5}개`);
        }
    }
}

main().catch(e => console.error('Error:', e.message));
