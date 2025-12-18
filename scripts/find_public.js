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
        range: '0000!A:D'
    });

    const rows = response.data.values || [];

    console.log('=== 공설 시설 목록 ===\n');

    const seen = new Set();
    rows.slice(1).forEach((row, i) => {
        if (row[3] === '공설') {
            const id = row[0];
            if (!seen.has(id)) {
                seen.add(id);
                console.log(`${id} - ${row[1]}`);
            }
        }
    });

    console.log(`\n총 ${seen.size}개 시설`);
}
main();
