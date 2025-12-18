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
        range: '0000!D:D'
    });

    const rows = response.data.values || [];
    const counts = {};

    rows.slice(1).forEach(row => {
        const val = row[0] || '(빈값)';
        counts[val] = (counts[val] || 0) + 1;
    });

    console.log('=== D열 (운영주체) 분포 ===\n');
    Object.entries(counts).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
        console.log(`${k}: ${v}개`);
    });
}
main();
