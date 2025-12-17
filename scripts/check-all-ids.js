const { google } = require('googleapis');
const fs = require('fs');

async function check() {
    const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(fs.readFileSync('data/구글 api/sonson-481412-0514ba9d773f.json')),
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    // 공설 ID
    const pub = await sheets.spreadsheets.values.get({
        spreadsheetId: '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY',
        range: '시트1_공설!A:A'
    });
    const pubIds = new Set(pub.data.values.flat().filter(id => id && id.startsWith('park-')));

    // 사설 ID
    const priv = await sheets.spreadsheets.values.get({
        spreadsheetId: '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY',
        range: '시트1_사설!A:A'
    });
    const privIds = new Set(priv.data.values.flat().filter(id => id && id.startsWith('park-')));

    // 합집합
    const allIds = new Set([...pubIds, ...privIds]);

    console.log('공설 고유 ID:', pubIds.size);
    console.log('사설 고유 ID:', privIds.size);
    console.log('합계 고유 ID:', allIds.size);

    // 누락 확인
    const missing = [];
    for (let i = 1; i <= 1498; i++) {
        const id = 'park-' + String(i).padStart(4, '0');
        if (!allIds.has(id)) missing.push(id);
    }
    console.log('누락 ID:', missing.length);
}
check();
