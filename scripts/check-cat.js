const { google } = require('googleapis');
const fs = require('fs');
const creds = JSON.parse(fs.readFileSync('data/구글 api/sonson-481412-701902a77d89.json'));

async function check() {
    const auth = new google.auth.GoogleAuth({ credentials: creds, scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'] });
    const sheets = google.sheets({ version: 'v4', auth });

    const data = await sheets.spreadsheets.values.get({
        spreadsheetId: '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY',
        range: '시트1_사설!A:E'
    });

    const rows = data.data.values || [];
    const headers = rows[0];
    console.log('헤더:', headers);

    // 가격카테고리 분포 (E컬럼 = 인덱스 4)
    const cats = {};
    for (let i = 1; i < rows.length; i++) {
        const cat = rows[i][4] || '(비어있음)';
        cats[cat] = (cats[cat] || 0) + 1;
    }
    console.log('\n가격카테고리 분포:');
    Object.entries(cats).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(k + ': ' + v));
}
check().catch(e => console.log('에러:', e.message));
