const { google } = require('googleapis');
const fs = require('fs');

const creds = JSON.parse(fs.readFileSync('data/구글 api/sonson-481412-0514ba9d773f.json', 'utf8'));
const auth = new google.auth.GoogleAuth({ credentials: creds, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });

async function addPublicColumnSafe() {
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
    console.log('총 행:', rows.length);

    // 모든 행을 9개 컬럼으로 맞추기
    const normalized = rows.map(r => {
        while (r.length < 9) r.push('');
        return r.slice(0, 9);
    });

    // C열(시설카테고리, index 2) 다음에 운영구분 삽입
    // 새 순서: A, B, C, NEW, D, E, F, G, H, I
    const newRows = normalized.map((r, i) => {
        if (i === 0) {
            // 헤더
            return [r[0], r[1], r[2], '운영구분', r[3], r[4], r[5], r[6], r[7], r[8]];
        }

        const parkId = r[0];
        const publicType = isPublicMap[parkId] || '';

        return [r[0], r[1], r[2], publicType, r[3], r[4], r[5], r[6], r[7], r[8]];
    });

    console.log('새 헤더:', newRows[0]);

    // 샘플 확인
    console.log('');
    console.log('샘플 행:');
    console.log('Row 2:', newRows[1].slice(0, 6));
    console.log('Row 3:', newRows[2].slice(0, 6));

    await sheets.spreadsheets.values.clear({
        spreadsheetId: '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY',
        range: '시트1!A:Z'
    });

    await sheets.spreadsheets.values.update({
        spreadsheetId: '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY',
        range: '시트1!A1',
        valueInputOption: 'RAW',
        resource: { values: newRows }
    });

    console.log('');
    console.log('✅ 운영구분 컬럼 추가 완료!');
}

addPublicColumnSafe();
