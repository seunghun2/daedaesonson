const { google } = require('googleapis');
const fs = require('fs');

const SPREADSHEET_ID = '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY';
const SHEET_NAME = '시트1_사설';
const creds = JSON.parse(fs.readFileSync('data/구글 api/sonson-481412-701902a77d89.json'));

async function resetBorders() {
    const auth = new google.auth.GoogleAuth({ credentials: creds, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const sheets = google.sheets({ version: 'v4', auth });

    // 1. 시트 정보 가져오기
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const sheet = spreadsheet.data.sheets.find(s => s.properties.title === SHEET_NAME);
    const sheetId = sheet.properties.sheetId;

    // 2. 데이터 읽기
    console.log('데이터 읽는 중...');
    const data = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A:A`
    });

    const rows = data.data.values || [];
    console.log('총 행:', rows.length);

    // 3. 모든 테두리 제거
    console.log('기존 테두리 모두 제거 중...');
    await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        resource: {
            requests: [{
                updateBorders: {
                    range: { sheetId, startRowIndex: 0, endRowIndex: rows.length, startColumnIndex: 0, endColumnIndex: 20 },
                    top: { style: 'NONE' },
                    bottom: { style: 'NONE' },
                    left: { style: 'NONE' },
                    right: { style: 'NONE' },
                    innerHorizontal: { style: 'NONE' },
                    innerVertical: { style: 'NONE' }
                }
            }]
        }
    });

    // 4. ID별 구분선 다시 적용
    console.log('ID별 구분선 다시 적용 중...');
    const requests = [];
    let currentId = null;

    for (let i = 1; i < rows.length; i++) {
        const id = (rows[i] && rows[i][0]) ? rows[i][0].toString().trim() : '';

        // ID가 바뀔 때 구분선 추가
        if (id && id !== currentId && currentId !== null) {
            requests.push({
                updateBorders: {
                    range: { sheetId, startRowIndex: i, endRowIndex: i + 1, startColumnIndex: 0, endColumnIndex: 20 },
                    top: { style: 'SOLID_MEDIUM', width: 2, color: { red: 0.3, green: 0.3, blue: 0.3 } }
                }
            });
        }
        currentId = id;
    }

    console.log('구분선 개수:', requests.length);

    // 배치 업데이트
    if (requests.length > 0) {
        for (let i = 0; i < requests.length; i += 500) {
            const batch = requests.slice(i, i + 500);
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId: SPREADSHEET_ID,
                resource: { requests: batch }
            });
            console.log(`적용: ${Math.min(i + 500, requests.length)}/${requests.length}`);
        }
    }

    console.log('✅ 완료!');
}

resetBorders().catch(e => console.error('에러:', e.message));
