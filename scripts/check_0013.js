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
        range: '0000!A119:I145'
    });

    const rows = response.data.values || [];
    console.log('=== 0013 데이터 (119~145) ===\n');
    rows.forEach((row, i) => {
        const rowNum = 119 + i;
        const category = row[4] || '';
        const name = row[5] || '';
        const desc = row[6] || '';
        const price = row[7] || '';
        console.log(`${rowNum}: [${category}] ${name} | ${desc} | ${price}원`);
    });
}
main();
