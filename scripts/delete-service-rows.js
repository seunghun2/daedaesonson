const { google } = require('googleapis');
const fs = require('fs');

const SPREADSHEET_ID = '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY';
const creds = JSON.parse(fs.readFileSync('data/구글 api/sonson-481412-701902a77d89.json'));

async function deleteServiceRows() {
    const auth = new google.auth.GoogleAuth({ credentials: creds, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    console.log('데이터 읽는 중...');
    const data = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: '시트1_사설!A:Z'
    });

    const rows = data.data.values || [];
    const headers = rows[0];
    const priceColIndex = headers.findIndex(h => h && h.includes('가격카테고리'));
    console.log('원본 행 수:', rows.length);
    console.log('가격카테고리 컬럼:', priceColIndex);

    const filteredRows = [headers];
    let deletedCount = 0;

    for (let i = 1; i < rows.length; i++) {
        const row = rows[i] || [];
        const category = row[priceColIndex] || '';

        // "서비스 항목" 카테고리만 삭제
        if (category === '서비스 항목' || category.includes('서비스')) {
            deletedCount++;
            console.log(`삭제: ${row[0]} - ${row[3]} (${category})`);
        } else {
            filteredRows.push(row);
        }
    }

    console.log('\n삭제된 행:', deletedCount);
    console.log('남은 행:', filteredRows.length - 1);

    console.log('\n시트 업데이트 중...');
    await sheets.spreadsheets.values.clear({
        spreadsheetId: SPREADSHEET_ID,
        range: '시트1_사설!A:Z'
    });

    await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: '시트1_사설!A1',
        valueInputOption: 'RAW',
        resource: { values: filteredRows }
    });

    console.log('완료!');
}

deleteServiceRows().catch(console.error);
