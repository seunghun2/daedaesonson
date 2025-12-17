const { google } = require('googleapis');
const fs = require('fs');

const creds = JSON.parse(fs.readFileSync('data/구글 api/sonson-481412-0514ba9d773f.json', 'utf8'));
const auth = new google.auth.GoogleAuth({ credentials: creds, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });

async function fixSheet() {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });
    const spreadsheetId = '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY';

    // 현재 데이터 가져오기
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: '시트1!A:J'
    });

    const rows = res.data.values;
    console.log('현재 헤더:', rows[0]);
    console.log('총 행 수:', rows.length);

    // E열(인덱스 4) 제거 - 중복 운영구분
    const fixedRows = rows.map(row => {
        const newRow = [...row];
        if (newRow.length > 4) {
            newRow.splice(4, 1); // E열 삭제
        }
        return newRow;
    });

    console.log('수정된 헤더:', fixedRows[0]);

    // 시트 클리어 후 다시 작성
    await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: '시트1!A:Z'
    });

    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: '시트1!A1',
        valueInputOption: 'RAW',
        resource: { values: fixedRows }
    });

    console.log('✅ E열(중복 운영구분) 삭제 완료!');
}

fixSheet();
