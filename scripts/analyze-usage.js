const { google } = require('googleapis');
const fs = require('fs');

const creds = JSON.parse(fs.readFileSync('data/구글 api/sonson-481412-0514ba9d773f.json', 'utf8'));
const auth = new google.auth.GoogleAuth({ credentials: creds, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });

async function analyze() {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY',
        range: '시트1!A:I'
    });

    const rows = res.data.values.slice(1);

    // 공원묘지 + 사용료 포함 항목
    const items = rows.filter(r => r[2] === '공원묘지' && (r[4] || '').includes('사용료'));

    const patterns = {};
    items.forEach(r => {
        const name = (r[4] || '').slice(0, 30);
        patterns[name] = (patterns[name] || 0) + 1;
    });

    console.log('=== 공원묘지 + 사용료 상품명 패턴 ===');
    console.log('총:', items.length, '개');
    console.log('');
    Object.entries(patterns)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .forEach(([k, v]) => console.log(v, '개 |', k));
}
analyze();
