const { google } = require('googleapis');
const fs = require('fs');

const creds = JSON.parse(fs.readFileSync('data/구글 api/sonson-481412-0514ba9d773f.json', 'utf8'));
const auth = new google.auth.GoogleAuth({ credentials: creds, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });

async function revert() {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    // 복사본에서 데이터 가져오기
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY',
        range: '복사본!A:I'
    });

    const rows = res.data.values;
    console.log('복사본 행 수:', rows.length);

    // 시트1에 복원
    await sheets.spreadsheets.values.clear({
        spreadsheetId: '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY',
        range: '시트1!A:Z'
    });

    await sheets.spreadsheets.values.update({
        spreadsheetId: '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY',
        range: '시트1!A1',
        valueInputOption: 'RAW',
        resource: { values: rows }
    });

    console.log('✅ 복사본으로 복원 완료!');
}

revert();
