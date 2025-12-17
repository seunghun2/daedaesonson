const { google } = require('googleapis');
const fs = require('fs');

async function check() {
    const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(fs.readFileSync('data/구글 api/sonson-481412-0514ba9d773f.json')),
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    const data = await sheets.spreadsheets.values.get({
        spreadsheetId: '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY',
        range: '시트1!A:A'
    });

    const ids = data.data.values.flat().filter(id => id && id.startsWith('park-'));
    const uniqueIds = [...new Set(ids)];

    console.log('시트1 총 행:', data.data.values.length);
    console.log('park-ID 수:', ids.length);
    console.log('고유 ID 수:', uniqueIds.length);

    // ID 범위 확인
    const nums = uniqueIds.map(id => parseInt(id.replace('park-', ''))).sort((a, b) => a - b);
    console.log('ID 범위:', nums[0], '~', nums[nums.length - 1]);

    // 누락된 ID 확인
    const missing = [];
    for (let i = 1; i <= 1498; i++) {
        const id = 'park-' + String(i).padStart(4, '0');
        if (!uniqueIds.includes(id)) missing.push(id);
    }
    console.log('누락 ID 수:', missing.length);
    if (missing.length > 0) {
        console.log('누락 예시:', missing.slice(0, 10).join(' '));
    }
}
check();
