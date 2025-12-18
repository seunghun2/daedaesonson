const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const CREDENTIALS_PATH = path.join(__dirname, '../data/구글 api/sonson-481412-701902a77d89.json');
const SPREADSHEET_ID = '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY';
const SHEET_NAME = '0000';

async function main() {
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
    const auth = new google.auth.GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() });

    console.log('📖 시트 데이터 읽는 중...');

    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A:I`
    });

    const rows = response.data.values || [];
    let changed = 0;

    // 상품명(F열, index 5)에서 변환
    for (let i = 1; i < rows.length; i++) {
        const product = rows[i][5] || '';

        // 시설 사용료, 시설이용료 → 시설사용료
        if (product.includes('시설 사용료') || product.includes('시설이용료')) {
            const newProduct = product
                .replace(/시설 사용료/g, '시설사용료')
                .replace(/시설이용료/g, '시설사용료');

            if (newProduct !== product) {
                rows[i][5] = newProduct;
                changed++;
                console.log(`  ${rows[i][0]}: "${product}" → "${newProduct}"`);
            }
        }
    }

    console.log(`\n🔄 ${changed}개 변경됨`);

    if (changed > 0) {
        console.log('📝 시트 업데이트 중...');

        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!A1`,
            valueInputOption: 'RAW',
            resource: { values: rows }
        });

        console.log('✅ 완료!');
    }
}

main().catch(e => console.error('Error:', e.message));
