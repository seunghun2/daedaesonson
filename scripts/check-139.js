const { google } = require('googleapis');
const fs = require('fs');
const creds = JSON.parse(fs.readFileSync('data/구글 api/sonson-481412-701902a77d89.json'));

async function check() {
    const auth = new google.auth.GoogleAuth({ credentials: creds, scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'] });
    const sheets = google.sheets({ version: 'v4', auth });

    // 시트1_사설에서 139 검색
    const data = await sheets.spreadsheets.values.get({
        spreadsheetId: '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY',
        range: '시트1_사설!A:B'
    });

    const rows = data.data.values || [];
    const found = rows.filter(r => r[0] && r[0].includes('139'));

    console.log('시트1_사설에서 139 검색 결과:', found.length);
    found.forEach(r => console.log(r));

    // 시트1_공설에서도 확인
    const pubData = await sheets.spreadsheets.values.get({
        spreadsheetId: '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY',
        range: '시트1_공설!A:B'
    });

    const pubRows = pubData.data.values || [];
    const foundPub = pubRows.filter(r => r[0] && r[0].includes('139'));

    console.log('\n시트1_공설에서 139 검색 결과:', foundPub.length);
    foundPub.forEach(r => console.log(r));

    // facilities.json에서 139 확인
    const facilities = JSON.parse(fs.readFileSync('data/facilities.json'));
    const fac139 = facilities.find(f => f.originalName && f.originalName.startsWith('139.'));
    console.log('\nfacilities.json에서 139:');
    if (fac139) {
        console.log('ID:', fac139.id);
        console.log('이름:', fac139.name);
        console.log('isPublic:', fac139.isPublic);
    }
}

check().catch(e => console.error('에러:', e.message));
