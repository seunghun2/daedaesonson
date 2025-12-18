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
        range: '0000!A:B'
    });

    const rows = response.data.values || [];
    const ids = ['park-0022', 'park-0028', 'park-0037', 'park-0038', 'park-0041', 'park-0045', 'park-0049', 'park-0050', 'park-0058', 'park-0065'];

    console.log('=== 시트 ID & 이름 매칭 확인 ===\n');
    ids.forEach(id => {
        const found = rows.find(r => r[0] === id);
        if (found) {
            console.log(`${id}: ${found[1]}`);
        } else {
            console.log(`${id}: (시트에 없음)`);
        }
    });

    // archive5 파일 확인
    console.log('\n=== archive5 파일 확인 ===\n');
    const archive5Dir = path.join(__dirname, '../archive5');
    const nums = [22, 28, 37, 38, 41, 45, 49, 50, 58, 65];

    nums.forEach(num => {
        const files = fs.readdirSync(archive5Dir).filter(f => f.startsWith(`${num}.`));
        if (files.length > 0) {
            console.log(`${num}: ${files[0]}`);
        } else {
            console.log(`${num}: (파일 없음)`);
        }
    });
}
main();
