const { google } = require('googleapis');
const fs = require('fs');

const SPREADSHEET_ID = '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY';
const SHEET_NAME = '시트1_사설';
const creds = JSON.parse(fs.readFileSync('data/구글 api/sonson-481412-701902a77d89.json'));

async function formatNewlyAdded() {
    const auth = new google.auth.GoogleAuth({ credentials: creds, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const sheets = google.sheets({ version: 'v4', auth });

    // 시트 ID 가져오기
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const sheet = spreadsheet.data.sheets.find(s => s.properties.title === SHEET_NAME);
    const sheetId = sheet.properties.sheetId;

    // 데이터 읽기
    console.log('데이터 읽는 중...');
    const data = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A:I`
    });

    const rows = data.data.values || [];
    const headers = rows[0];
    console.log('총 행:', rows.length);

    const priceColIndex = headers.findIndex(h => h && h.includes('가격카테고리'));

    // 은은한 배경색
    const categoryColors = {
        '매장묘': { red: 0.92, green: 0.97, blue: 0.92 },
        '봉안당': { red: 0.92, green: 0.96, blue: 1 },
        '봉안담': { red: 0.92, green: 0.96, blue: 1 },
        '수목장': { red: 0.98, green: 0.96, blue: 0.92 },
        '자연장': { red: 0.98, green: 0.96, blue: 0.92 },
        '기타': { red: 1, green: 0.98, blue: 0.92 },
        '제외됨': { red: 0.95, green: 0.95, blue: 0.95 },
    };

    // 새로 추가된 시설용 색상 (연한 핑크/살구색)
    const newlyAddedColor = { red: 1, green: 0.93, blue: 0.93 };

    const requests = [];
    let currentId = null;
    const colCount = 20;
    let newlyAddedCount = 0;

    for (let i = 1; i < rows.length; i++) {
        const row = rows[i] || [];
        const id = row[0] || '';
        const priceCategory = row[priceColIndex] || '';

        // 가격카테고리가 비어있으면 새로 추가된 시설
        let bgColor;
        if (!priceCategory || priceCategory.trim() === '') {
            bgColor = newlyAddedColor;
            newlyAddedCount++;
        } else {
            // 기존 시설은 카테고리별 색상
            bgColor = null;
            for (const [key, color] of Object.entries(categoryColors)) {
                if (priceCategory.includes(key)) {
                    bgColor = color;
                    break;
                }
            }
        }

        if (bgColor) {
            requests.push({
                repeatCell: {
                    range: { sheetId, startRowIndex: i, endRowIndex: i + 1, startColumnIndex: 0, endColumnIndex: colCount },
                    cell: { userEnteredFormat: { backgroundColor: bgColor } },
                    fields: 'userEnteredFormat.backgroundColor'
                }
            });
        }

        // ID 바뀔 때 구분선
        if (id && id !== currentId && currentId !== null) {
            requests.push({
                updateBorders: {
                    range: { sheetId, startRowIndex: i, endRowIndex: i + 1, startColumnIndex: 0, endColumnIndex: colCount },
                    top: { style: 'SOLID_MEDIUM', width: 2, color: { red: 0.4, green: 0.4, blue: 0.4 } }
                }
            });
        }
        currentId = id;
    }

    console.log('새로 추가된 시설:', newlyAddedCount);
    console.log('서식 요청:', requests.length);

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

    console.log('✅ 완료! 새로 추가된 시설은 연분홍색으로 표시됨');
}

formatNewlyAdded().catch(e => console.error('에러:', e.message));
