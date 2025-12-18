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
    const header = rows[0];

    console.log(`총 ${rows.length - 1}개 행`);

    // 각 시설ID + 카테고리 조합에서 첫 번째 항목 찾기
    const seenCombos = new Set();
    let markedCount = 0;

    for (let i = 1; i < rows.length; i++) {
        const facilityId = rows[i][0] || '';
        const category = rows[i][4] || '';
        const combo = `${facilityId}|${category}`;

        if (!seenCombos.has(combo) && facilityId && category) {
            // 첫 번째! Y 표시
            rows[i][8] = 'Y';
            seenCombos.add(combo);
            markedCount++;
        } else {
            // 나머지는 빈값
            rows[i][8] = '';
        }
    }

    console.log(`✅ ${markedCount}개 대표가격 표시`);

    // 시트 업데이트
    console.log('📝 시트 업데이트 중...');

    await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A1`,
        valueInputOption: 'RAW',
        resource: { values: rows }
    });

    console.log('\n✅ 완료!');
}

main().catch(e => console.error('Error:', e.message));
