const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const CREDENTIALS_PATH = path.join(__dirname, '../data/구글 api/sonson-481412-701902a77d89.json');
const SPREADSHEET_ID = '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY';
const SHEET_NAME = '0000';

async function main() {
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
    const auth = new google.auth.GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() });

    console.log('📖 시트 정보 가져오는 중...');

    // 시트 ID 가져오기
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const sheet = spreadsheet.data.sheets.find(s => s.properties.title === SHEET_NAME);
    const sheetId = sheet.properties.sheetId;

    // 데이터 읽기
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A:A`
    });

    const rows = response.data.values || [];
    console.log(`총 ${rows.length}개 행`);

    // ID가 바뀌는 행 찾기
    const borderRows = [];
    let prevId = '';

    for (let i = 1; i < rows.length; i++) {
        const currentId = rows[i][0] || '';
        if (currentId !== prevId && currentId) {
            borderRows.push(i); // 0-indexed
            prevId = currentId;
        }
    }

    console.log(`🔄 ${borderRows.length}개 ID 구분선 추가 중...`);

    // 배치로 border 요청 생성
    const requests = borderRows.map(rowIndex => ({
        updateBorders: {
            range: {
                sheetId: sheetId,
                startRowIndex: rowIndex,
                endRowIndex: rowIndex + 1,
                startColumnIndex: 0,
                endColumnIndex: 9
            },
            top: {
                style: 'SOLID_MEDIUM',
                color: { red: 0.3, green: 0.3, blue: 0.3 }
            }
        }
    }));

    // 100개씩 배치 처리
    const batchSize = 100;
    for (let i = 0; i < requests.length; i += batchSize) {
        const batch = requests.slice(i, i + batchSize);
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: SPREADSHEET_ID,
            resource: { requests: batch }
        });
        console.log(`  ${Math.min(i + batchSize, requests.length)}/${requests.length} 처리됨`);
    }

    console.log(`\n✅ 완료! ${borderRows.length}개 ID 구분선이 추가되었습니다.`);
}

main().catch(e => console.error('Error:', e.message));
