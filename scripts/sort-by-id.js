const { google } = require('googleapis');
const fs = require('fs');

const SPREADSHEET_ID = '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY';
const SHEET_NAME = '시트1_사설';
const creds = JSON.parse(fs.readFileSync('data/구글 api/sonson-481412-701902a77d89.json'));

async function sortById() {
    const auth = new google.auth.GoogleAuth({ credentials: creds, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const sheets = google.sheets({ version: 'v4', auth });

    // 1. 전체 데이터 읽기
    console.log('데이터 읽는 중...');
    const data = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A:Z`
    });

    const rows = data.data.values || [];
    const headers = rows[0];
    const dataRows = rows.slice(1);

    console.log('헤더:', headers);
    console.log('데이터 행:', dataRows.length);

    // 2. ID 기준으로 정렬 (park-0001, park-0002, ...)
    dataRows.sort((a, b) => {
        const idA = a[0] || '';
        const idB = b[0] || '';
        // park-0001 형식에서 숫자 추출
        const numA = parseInt(idA.replace('park-', '')) || 0;
        const numB = parseInt(idB.replace('park-', '')) || 0;
        return numA - numB;
    });

    console.log('정렬 완료');
    console.log('첫 ID:', dataRows[0]?.[0]);
    console.log('마지막 ID:', dataRows[dataRows.length - 1]?.[0]);

    // 3. 시트에 다시 쓰기
    console.log('시트 업데이트 중...');
    const allRows = [headers, ...dataRows];

    await sheets.spreadsheets.values.clear({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A:Z`
    });

    await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A1`,
        valueInputOption: 'RAW',
        resource: { values: allRows }
    });

    console.log('✅ 완료! ID 순서대로 정렬됨');
}

sortById().catch(e => console.error('에러:', e.message));
