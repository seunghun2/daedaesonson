const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const CREDENTIALS_PATH = path.join(__dirname, '../data/구글 api/sonson-481412-701902a77d89.json');
const SPREADSHEET_ID = '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY';
const SHEET_NAME = '0000';
const FACILITIES_PATH = path.join(__dirname, '../data/facilities.json');

async function main() {
    console.log('🚀 전체 동기화 시작!\n');

    // 1. 시트 읽기
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
    const auth = new google.auth.GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() });

    console.log('📖 시트 읽는 중...');
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A:I`
    });

    const rows = response.data.values || [];
    console.log(`시트: ${rows.length - 1}개 행\n`);

    // 2. 시설별로 그룹화
    const sheetData = {};

    for (let i = 1; i < rows.length; i++) {
        const [id, name, facilityCategory, operatorType, priceCategory, productName, desc, price, representative] = rows[i];

        if (!id) continue;

        if (!sheetData[id]) {
            sheetData[id] = {
                name,
                items: []
            };
        }

        sheetData[id].items.push({
            category: priceCategory || '기타',
            product: productName || '',
            desc: desc || '',
            price: parseInt(price) || 0,
            isRepresentative: representative === 'Y'
        });
    }

    const sheetFacilityIds = Object.keys(sheetData);
    console.log(`시트 시설 수: ${sheetFacilityIds.length}개\n`);

    // 3. facilities.json 읽기
    console.log('📂 facilities.json 읽는 중...');
    const facilities = JSON.parse(fs.readFileSync(FACILITIES_PATH, 'utf8'));
    console.log(`facilities.json: ${facilities.length}개 시설\n`);

    // 4. 동기화
    let updatedCount = 0;
    let notFoundCount = 0;

    for (const facilityId of sheetFacilityIds) {
        const targetIdx = facilities.findIndex(f => f.id === facilityId);

        if (targetIdx === -1) {
            notFoundCount++;
            continue;
        }

        const items = sheetData[facilityId].items;

        // priceInfo 구조로 변환
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

        // 업데이트
        facilities[targetIdx].priceInfo = { priceTable };

        // 대표 가격으로 priceRange 계산 (기타, 기타/공통, 제외됨 제외)
        const excludeCategories = ['기타', '기타/공통', '제외됨', 'ETC'];
        const representativePrices = items
            .filter(i => i.isRepresentative && i.price > 0 && !excludeCategories.includes(i.category))
            .map(i => i.price);

        if (representativePrices.length > 0) {
            facilities[targetIdx].priceRange = {
                min: Math.round(Math.min(...representativePrices) / 10000),
                max: Math.round(Math.max(...representativePrices) / 10000)
            };
        } else {
            // 유효한 카테고리에 대표가격 없으면 0원
            facilities[targetIdx].priceRange = { min: 0, max: 0 };
        }

        updatedCount++;

        if (updatedCount % 100 === 0) {
            console.log(`  ${updatedCount}개 처리됨...`);
        }
    }

    console.log(`\n✅ 업데이트: ${updatedCount}개`);
    console.log(`⚠️ 시트에는 있지만 JSON에 없음: ${notFoundCount}개\n`);

    // 5. 저장
    console.log('💾 저장 중...');
    fs.writeFileSync(FACILITIES_PATH, JSON.stringify(facilities, null, 2), 'utf8');

    console.log('\n🎉 완료!');
}

main().catch(e => console.error('Error:', e.message));
