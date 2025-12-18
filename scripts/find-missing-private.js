const { google } = require('googleapis');
const fs = require('fs');
const creds = JSON.parse(fs.readFileSync('data/구글 api/sonson-481412-701902a77d89.json'));

async function check() {
    const auth = new google.auth.GoogleAuth({ credentials: creds, scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'] });
    const sheets = google.sheets({ version: 'v4', auth });

    // 시트1_사설에서 시설ID 수집
    const data = await sheets.spreadsheets.values.get({
        spreadsheetId: '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY',
        range: '시트1_사설!A:A'
    });

    const sheetIds = new Set((data.data.values || []).slice(1).map(r => r[0]).filter(Boolean));
    console.log('시트1_사설 고유 시설ID:', sheetIds.size);

    // facilities.json에서 사설 시설 가져오기
    const facilities = JSON.parse(fs.readFileSync('data/facilities.json'));
    const privateFacilities = facilities.filter(f => f.isPublic === false);
    console.log('facilities.json 사설:', privateFacilities.length);

    // 시트에 없는 사설 시설 찾기
    const missing = [];
    for (const f of privateFacilities) {
        if (!sheetIds.has(f.id)) {
            const num = f.originalName ? f.originalName.split('.')[0] : '';
            missing.push({ id: f.id, num, name: f.name });
        }
    }

    console.log('\n=== 시트1_사설에 없는 사설 시설 ===');
    console.log('개수:', missing.length);
    console.log('\n번호 목록:');
    missing.sort((a, b) => parseInt(a.num) - parseInt(b.num));
    missing.forEach(m => console.log(m.num));
}

check().catch(e => console.error('에러:', e.message));
