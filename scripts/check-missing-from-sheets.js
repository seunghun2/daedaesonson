const { google } = require('googleapis');
const fs = require('fs');
const creds = JSON.parse(fs.readFileSync('data/구글 api/sonson-481412-701902a77d89.json'));

async function check() {
    const auth = new google.auth.GoogleAuth({ credentials: creds, scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'] });
    const sheets = google.sheets({ version: 'v4', auth });

    // 시트1_사설 시설ID 수집
    const privData = await sheets.spreadsheets.values.get({
        spreadsheetId: '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY',
        range: '시트1_사설!A:A'
    });
    const privIds = new Set((privData.data.values || []).slice(1).map(r => r[0]).filter(Boolean));

    // 시트1_공설 시설ID 수집
    const pubData = await sheets.spreadsheets.values.get({
        spreadsheetId: '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY',
        range: '시트1_공설!A:A'
    });
    const pubIds = new Set((pubData.data.values || []).slice(1).map(r => r[0]).filter(Boolean));

    console.log('시트1_사설 고유 ID:', privIds.size);
    console.log('시트1_공설 고유 ID:', pubIds.size);

    // facilities.json 로드
    const facilities = JSON.parse(fs.readFileSync('data/facilities.json'));
    console.log('facilities.json 총:', facilities.length);

    // 시트에 없는 시설 찾기
    const missingFromSheets = [];
    for (const f of facilities) {
        const inPriv = privIds.has(f.id);
        const inPub = pubIds.has(f.id);

        if (!inPriv && !inPub) {
            missingFromSheets.push({
                id: f.id,
                name: f.name,
                isPublic: f.isPublic
            });
        }
    }

    console.log('\n=== 두 시트 모두에 없는 시설 ===');
    console.log('개수:', missingFromSheets.length);

    // ID 순으로 정렬해서 처음 30개 출력
    missingFromSheets.sort((a, b) => a.id.localeCompare(b.id));
    missingFromSheets.slice(0, 30).forEach(m => {
        const type = m.isPublic ? '공설' : '사설';
        console.log(`${m.id} - ${m.name} (${type})`);
    });

    if (missingFromSheets.length > 30) {
        console.log(`... 외 ${missingFromSheets.length - 30}개 더`);
    }
}

check().catch(e => console.error('에러:', e.message));
