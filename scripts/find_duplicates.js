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
        range: '0000!A:I'
    });

    const rows = response.data.values || [];
    console.log(`총 ${rows.length - 1}개 행 검사 중...\n`);

    // 중복 찾기 (전체 행 내용 비교)
    const seen = {};
    const duplicates = [];

    for (let i = 1; i < rows.length; i++) {
        const key = rows[i].join('|||');
        if (seen[key]) {
            duplicates.push({
                row: i + 1,
                original: seen[key],
                content: `${rows[i][0]} | ${rows[i][5]} | ${rows[i][7]}`
            });
        } else {
            seen[key] = i + 1;
        }
    }

    if (duplicates.length > 0) {
        console.log(`⚠️ 중복 행 ${duplicates.length}개 발견!\n`);
        duplicates.slice(0, 20).forEach(d => {
            console.log(`  ${d.row}행 = ${d.original}행 (${d.content})`);
        });
        if (duplicates.length > 20) {
            console.log(`  ... 외 ${duplicates.length - 20}개`);
        }
    } else {
        console.log('✅ 중복 없음!');
    }
}
main();
