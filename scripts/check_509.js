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
        range: '시트1_사설!A:Z'
    });

    const rows = response.data.values || [];
    const header = rows[0];
    console.log('=== 헤더 ===');
    header.forEach((h, i) => console.log(`${i}: ${h}`));

    console.log('\n=== ID 509 데이터 ===');
    const id509Rows = rows.filter(row => row[0] && row[0].includes('509'));
    console.log('발견된 행 수:', id509Rows.length);

    id509Rows.forEach((row, idx) => {
        console.log(`\n--- 항목 ${idx + 1} ---`);
        row.forEach((cell, i) => {
            if (cell && cell.toString().trim()) {
                console.log(`[${header[i] || 'col' + i}]: ${cell}`);
            }
        });
    });
}

main().catch(e => console.error('Error:', e.message));
