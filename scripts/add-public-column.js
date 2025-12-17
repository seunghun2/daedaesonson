const { google } = require('googleapis');
const fs = require('fs');

const creds = JSON.parse(fs.readFileSync('data/구글 api/sonson-481412-0514ba9d773f.json', 'utf8'));
const auth = new google.auth.GoogleAuth({ credentials: creds, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });

async function addPublicColumn() {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    // facilities.json에서 isPublic 정보 가져오기
    const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
    const isPublicMap = {};
    facilities.forEach(f => {
        isPublicMap[f.id] = f.isPublic ? '공설' : '민간';
    });

    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY',
        range: '시트1!A:I'
    });

    const rows = res.data.values;
    console.log('현재 헤더:', rows[0]);

    // C열(시설카테고리) 다음에 운영구분 삽입
    const newRows = rows.map((r, i) => {
        if (i === 0) {
            // 헤더
            return [r[0], r[1], r[2], '운영구분', r[3], r[4], r[5], r[6], r[7], r[8]];
        }

        const parkId = r[0];
        const publicType = isPublicMap[parkId] || '';

        return [r[0], r[1], r[2], publicType, r[3], r[4], r[5], r[6], r[7], r[8]];
    });

    console.log('새 헤더:', newRows[0]);

    await sheets.spreadsheets.values.clear({
        spreadsheetId: '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY',
        range: '시트1!A:J'
    });

    await sheets.spreadsheets.values.update({
        spreadsheetId: '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY',
        range: '시트1!A1',
        valueInputOption: 'RAW',
        resource: { values: newRows }
    });

    // 통계
    let publicCount = 0, privateCount = 0;
    newRows.slice(1).forEach(r => {
        if (r[3] === '공설') publicCount++;
        else if (r[3] === '민간') privateCount++;
    });

    console.log('');
    console.log('✅ 운영구분 컬럼 추가 완료!');
    console.log('공설:', publicCount, '개');
    console.log('민간:', privateCount, '개');
}

addPublicColumn();
