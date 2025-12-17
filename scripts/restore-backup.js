const { google } = require('googleapis');
const fs = require('fs');
const creds = JSON.parse(fs.readFileSync('data/구글 api/sonson-481412-701902a77d89.json'));

async function restore() {
    const auth = new google.auth.GoogleAuth({ credentials: creds, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const sheets = google.sheets({ version: 'v4', auth });
    const SPREADSHEET_ID = '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY';

    console.log('백업에서 데이터 읽는 중...');
    const backup = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: '시트1_사설bk!A:Z'
    });

    const rows = backup.data.values || [];
    console.log('백업 데이터:', rows.length, '행');

    console.log('시트1_사설 복원 중...');
    await sheets.spreadsheets.values.clear({
        spreadsheetId: SPREADSHEET_ID,
        range: '시트1_사설!A:Z'
    });

    await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: '시트1_사설!A1',
        valueInputOption: 'RAW',
        resource: { values: rows }
    });

    console.log('복원 완료!');
}

restore().catch(e => console.error('에러:', e.message));
