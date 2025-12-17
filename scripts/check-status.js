const { google } = require('googleapis');
const fs = require('fs');

const creds = JSON.parse(fs.readFileSync('data/구글 api/sonson-481412-0514ba9d773f.json', 'utf8'));
const auth = new google.auth.GoogleAuth({ credentials: creds, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });

async function check() {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY',
        range: '시트1!D:D'
    });

    const stats = {};
    res.data.values.slice(1).forEach(r => {
        const val = r[0] || 'empty';
        stats[val] = (stats[val] || 0) + 1;
    });

    console.log('=== 운영구분 통계 ===');
    Object.entries(stats).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
        console.log(k, ':', v);
    });
}
check();
