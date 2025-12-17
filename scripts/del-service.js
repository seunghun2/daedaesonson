const { google } = require('googleapis');
const fs = require('fs');

const SPREADSHEET_ID = '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY';
const SHEET_NAME = '시트1_사설';
const creds = JSON.parse(fs.readFileSync('data/구글 api/sonson-481412-701902a77d89.json'));

async function main() {
    const auth = new google.auth.GoogleAuth({
        credentials: creds,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    const sheets = google.sheets({ version: 'v4', auth });

    // 1. 데이터 읽기
    console.log('읽는 중...');
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A:Z`
    });

    const rows = res.data.values || [];
    console.log(`총 ${rows.length} 행`);

    // 2. 헤더에서 가격카테고리 컬럼 찾기
    const headers = rows[0];
    let catIdx = -1;
    for (let i = 0; i < headers.length; i++) {
        if (headers[i] && headers[i].includes('가격카테고리')) {
            catIdx = i;
            break;
        }
    }
    console.log(`가격카테고리 컬럼: ${catIdx} (${headers[catIdx]})`);

    // 3. 서비스 항목 제외하고 필터링
    const newRows = [headers];
    let deleted = 0;

    for (let i = 1; i < rows.length; i++) {
        const cat = (rows[i][catIdx] || '').trim();
        if (cat === '서비스 항목') {
            deleted++;
        } else {
            newRows.push(rows[i]);
        }
    }

    console.log(`삭제: ${deleted} 행`);
    console.log(`남음: ${newRows.length - 1} 행`);

    // 4. 시트 클리어 후 새 데이터 쓰기
    console.log('업데이트 중...');
    await sheets.spreadsheets.values.clear({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A:Z`
    });

    await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A1`,
        valueInputOption: 'RAW',
        resource: { values: newRows }
    });

    console.log('완료!');
}

main().catch(e => console.error(e.message));
