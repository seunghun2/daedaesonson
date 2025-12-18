const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const CREDENTIALS_PATH = path.join(__dirname, '../data/구글 api/sonson-481412-701902a77d89.json');
const SPREADSHEET_ID = '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY';

async function main() {
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
    const auth = new google.auth.GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() });

    // 처음 50행 읽기 (다른 시설 레퍼런스)
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: '0000!A1:I50'
    });

    const rows = response.data.values || [];

    console.log('=== 시트 레퍼런스 (1~50행) ===\n');
    console.log('헤더:', rows[0].join(' | '));
    console.log('');

    rows.slice(1, 50).forEach((row, i) => {
        const rowNum = i + 2;
        const id = row[0] || '';
        const facility = row[1] || '';
        const facilityCategory = row[2] || '';
        const operation = row[3] || '';
        const priceCategory = row[4] || '';
        const name = row[5] || '';
        const desc = row[6] || '';
        const price = row[7] || '';
        console.log(`${rowNum}: [${id}] ${name} | ${desc} | ${price}원 (${priceCategory})`);
    });
}
main();
