const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const CREDENTIALS_PATH = path.join(__dirname, '../data/구글 api/sonson-481412-701902a77d89.json');
const SPREADSHEET_ID = '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY';
const SHEET_NAME = '0000';

// 카테고리별 색상 (E열 기준)
const CATEGORY_COLORS = {
    '매장묘': { red: 0.85, green: 0.95, blue: 0.85 },  // 연두색
    '봉안당': { red: 0.85, green: 0.92, blue: 1.0 },   // 연파랑
    '수목장': { red: 1.0, green: 0.97, blue: 0.85 },   // 연노랑
    '옵션': { red: 0.95, green: 0.95, blue: 0.95 },    // 연회색
    '자연장': { red: 0.95, green: 0.9, blue: 0.85 }    // 연살구색
};

async function main() {
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
    const auth = new google.auth.GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() });

    // 시트 ID 가져오기
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const sheet = spreadsheet.data.sheets.find(s => s.properties.title === SHEET_NAME);
    const sheetId = sheet.properties.sheetId;

    // E열 데이터 읽기
    console.log('📖 E열(카테고리) 읽는 중...');

    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!E:E`
    });

    const rows = response.data.values || [];
    console.log(`총 ${rows.length}개 행`);

    // 카테고리별 색상 요청 생성
    const requests = [];

    for (let i = 1; i < rows.length; i++) {
        const category = rows[i]?.[0] || '';
        const color = CATEGORY_COLORS[category];

        if (color) {
            requests.push({
                repeatCell: {
                    range: {
                        sheetId: sheetId,
                        startRowIndex: i,
                        endRowIndex: i + 1,
                        startColumnIndex: 0,
                        endColumnIndex: 9
                    },
                    cell: {
                        userEnteredFormat: {
                            backgroundColor: color
                        }
                    },
                    fields: 'userEnteredFormat.backgroundColor'
                }
            });
        }
    }

    console.log(`🎨 ${requests.length}개 행에 색상 적용 중...`);

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

    console.log(`\n✅ 완료! 카테고리별 배경색 적용됨`);
}

main().catch(e => console.error('Error:', e.message));
