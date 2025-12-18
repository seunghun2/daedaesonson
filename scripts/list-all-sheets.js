const { google } = require('googleapis');
const fs = require('fs');
const creds = JSON.parse(fs.readFileSync('data/구글 api/sonson-481412-701902a77d89.json'));

async function check() {
    const auth = new google.auth.GoogleAuth({ credentials: creds, scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'] });
    const sheets = google.sheets({ version: 'v4', auth });

    const res = await sheets.spreadsheets.get({ spreadsheetId: '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY' });

    console.log('=== 모든 시트 ===');
    for (const s of res.data.sheets) {
        const title = s.properties.title;
        try {
            const data = await sheets.spreadsheets.values.get({
                spreadsheetId: '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY',
                range: title + '!A:A'
            });
            const count = (data.data.values || []).length;
            console.log(title + ': ' + count + '행');
        } catch (e) {
            console.log(title + ': 읽기 실패');
        }
    }
}

check().catch(e => console.error('에러:', e.message));
