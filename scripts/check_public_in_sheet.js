const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const CREDENTIALS_PATH = path.join(__dirname, '../data/구글 api/sonson-481412-701902a77d89.json');
const SPREADSHEET_ID = '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY';

async function main() {
    // facilities.json 로드
    const facilities = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/facilities.json'), 'utf8'));

    // 공설 ID 목록
    const publicIds = new Set(facilities.filter(f => f.isPublic === true).map(f => f.id));
    console.log(`facilities.json 공설 시설: ${publicIds.size}개\n`);

    // 시트 데이터 가져오기
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
    const auth = new google.auth.GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() });

    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: '0000!A:B'
    });

    const rows = response.data.values || [];

    // 시트에 있는 공설 찾기
    const sheetPublic = new Set();
    rows.slice(1).forEach(row => {
        const id = row[0];
        if (publicIds.has(id)) {
            sheetPublic.add(id);
        }
    });

    if (sheetPublic.size > 0) {
        console.log(`⚠️ 0000 시트에 공설이 ${sheetPublic.size}개 있음!\n`);
        console.log('=== 공설 목록 ===');
        Array.from(sheetPublic).sort().forEach(id => {
            const f = facilities.find(f => f.id === id);
            console.log(`${id} - ${f?.name}`);
        });
    } else {
        console.log('✅ 0000 시트에 공설 없음! 모두 사설입니다.');
    }
}
main();
