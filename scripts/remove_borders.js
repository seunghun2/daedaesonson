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

    // 시트 ID 찾기
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const sheet = spreadsheet.data.sheets.find(s => s.properties.title === SHEET_NAME);

    if (!sheet) {
        console.log(`❌ 시트 "${SHEET_NAME}"를 찾을 수 없습니다.`);
        return;
    }

    const sheetId = sheet.properties.sheetId;
    console.log(`✅ 시트 찾음: ${SHEET_NAME}`);

    // 모든 테두리 제거
    console.log('📝 구분선 제거 중...');

    await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        resource: {
            requests: [{
                updateBorders: {
                    range: {
                        sheetId: sheetId,
                        startRowIndex: 0,
                        endRowIndex: 3000,
                        startColumnIndex: 0,
                        endColumnIndex: 20
                    },
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

    console.log('✅ 구분선 제거 완료!');
}

main().catch(e => console.error('Error:', e.message));
