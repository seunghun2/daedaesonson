const { google } = require('googleapis');
const fs = require('fs');
const creds = JSON.parse(fs.readFileSync('data/구글 api/sonson-481412-701902a77d89.json'));

// 30초 타임아웃
setTimeout(() => {
    console.log('❌ 30초 타임아웃');
    process.exit(1);
}, 30000);

async function test() {
    console.log('구글시트 연결 테스트...');
    const auth = new google.auth.GoogleAuth({ credentials: creds, scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'] });
    const sheets = google.sheets({ version: 'v4', auth });

    const data = await sheets.spreadsheets.values.get({
        spreadsheetId: '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY',
        range: '시트1_사설!A1:A5'
    });

    console.log('✅ 연결 성공!');
    console.log('데이터:', data.data.values);
    process.exit(0);
}

test().catch(e => {
    console.log('❌ 에러:', e.message);
    process.exit(1);
});
