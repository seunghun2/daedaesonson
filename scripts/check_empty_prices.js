const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const CREDENTIALS_PATH = path.join(__dirname, '../data/구글 api/sonson-481412-701902a77d89.json');
const SPREADSHEET_ID = '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY';

async function main() {
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
    const auth = new google.auth.GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() });

    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: '0000!A:H'
    });

    const rows = response.data.values || [];

    // 가격 분류
    const stats = {
        empty: [],    // 진짜 빈값
        dash: [],     // "-"
        zero: [],     // "0"
        hasValue: 0   // 숫자 있음
    };

    for (let i = 1; i < rows.length; i++) {
        const price = (rows[i][7] || '').toString().trim();

        if (price === '' || price === 'undefined') {
            stats.empty.push({ row: i + 1, id: rows[i][0], product: rows[i][5] });
        } else if (price === '-') {
            stats.dash.push({ row: i + 1, id: rows[i][0], product: rows[i][5] });
        } else if (price === '0') {
            stats.zero.push({ row: i + 1, id: rows[i][0], product: rows[i][5] });
        } else {
            stats.hasValue++;
        }
    }

    console.log('=== 가격 상태 ===');
    console.log(`✅ 숫자 있음: ${stats.hasValue}개`);
    console.log(`⚪ - 표시: ${stats.dash.length}개`);
    console.log(`⚪ 0 표시: ${stats.zero.length}개`);
    console.log(`❌ 진짜 빈값: ${stats.empty.length}개`);

    if (stats.empty.length > 0) {
        console.log('\n=== 진짜 빈값 목록 ===');
        stats.empty.forEach(e => {
            console.log(`${e.row}행: ${e.id} - ${e.product}`);
        });
    }
}
main();
