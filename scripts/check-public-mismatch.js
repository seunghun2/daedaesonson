const { google } = require('googleapis');
const fs = require('fs');
const creds = JSON.parse(fs.readFileSync('data/구글 api/sonson-481412-701902a77d89.json'));

async function check() {
    const auth = new google.auth.GoogleAuth({ credentials: creds, scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'] });
    const sheets = google.sheets({ version: 'v4', auth });

    console.log('시트 데이터 읽는 중...');
    const data = await sheets.spreadsheets.values.get({
        spreadsheetId: '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY',
        range: '시트1_사설!A:D'
    });

    const rows = data.data.values || [];
    console.log('시트1_사설 헤더:', rows[0]);
    console.log('총 행:', rows.length - 1);

    // 시설ID들 수집 (unique)
    const sheetIds = new Set();
    for (let i = 1; i < rows.length; i++) {
        const id = rows[i][0];
        if (id) sheetIds.add(id.toString().trim());
    }
    console.log('고유 시설 수:', sheetIds.size);

    // facilities.json과 비교
    const facilities = JSON.parse(fs.readFileSync('data/facilities.json'));

    // 시트에 있는 시설 중 isPublic=true인 것 찾기
    let mismatch = [];
    for (const sheetId of sheetIds) {
        const fac = facilities.find(f => {
            const origNum = f.originalName ? f.originalName.split('.')[0] : '';
            return origNum === sheetId || f.id === sheetId;
        });
        if (fac && fac.isPublic === true) {
            mismatch.push({ id: sheetId, name: fac.name });
        }
    }

    console.log('\n=== 문제: 시트1_사설에 있는데 isPublic=true인 시설 ===');
    console.log('개수:', mismatch.length);
    mismatch.forEach(m => console.log(m.id, '-', m.name));
}

check().catch(e => console.error('에러:', e.message));
