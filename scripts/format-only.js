const { google } = require('googleapis');
const fs = require('fs');

const SPREADSHEET_ID = '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY';
const SHEET_NAME = '시트1_사설';
const creds = JSON.parse(fs.readFileSync('data/구글 api/sonson-481412-701902a77d89.json'));

async function applyFormatOnly() {
    const auth = new google.auth.GoogleAuth({ credentials: creds, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const sheets = google.sheets({ version: 'v4', auth });

    // 시트 ID 가져오기
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const sheet = spreadsheet.data.sheets.find(s => s.properties.title === SHEET_NAME);
    const sheetId = sheet.properties.sheetId;

    // 데이터 읽기 (수정 안 함!)
    console.log('데이터 읽는 중 (수정 안 함)...');
    const data = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A:Z`
    });

    const rows = data.data.values || [];
    const headers = rows[0];
    console.log('총 행:', rows.length);
    console.log('헤더:', headers);

    // 가격카테고리 컬럼 찾기
    const priceColIndex = headers.findIndex(h => h && h.includes('가격카테고리'));
    console.log('가격카테고리 컬럼:', priceColIndex, '-', headers[priceColIndex]);

    // 은은한 배경색 (0.91~0.98 범위)
    const categoryColors = {
        '매장묘': { red: 0.92, green: 0.97, blue: 0.92 },     // 은은한 초록
        '봉안당': { red: 0.92, green: 0.96, blue: 1 },        // 은은한 파랑
        '봉안담': { red: 0.92, green: 0.96, blue: 1 },        // 은은한 파랑
        '수목장': { red: 0.98, green: 0.96, blue: 0.92 },     // 은은한 베이지
        '자연장': { red: 0.98, green: 0.96, blue: 0.92 },     // 은은한 베이지
        '기타': { red: 1, green: 0.98, blue: 0.92 },          // 은은한 노랑
        '제외됨': { red: 0.95, green: 0.95, blue: 0.95 },     // 은은한 회색
        '제외함': { red: 0.95, green: 0.95, blue: 0.95 },     // 은은한 회색
    };

    const requests = [];
    let currentId = null;
    const colCount = Math.max(...rows.map(r => r ? r.length : 0), 20);

    for (let i = 1; i < rows.length; i++) {
        const row = rows[i] || [];
        const id = row[0] || '';
        const category = row[priceColIndex] || '';

        // 배경색 적용
        let bgColor = null;
        for (const [key, color] of Object.entries(categoryColors)) {
            if (key && category.includes(key)) {
                bgColor = color;
                break;
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

    console.log('서식 요청:', requests.length);

    // 배치 업데이트 (서식만!)
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

    console.log('✅ 서식만 적용 완료! (데이터 수정 없음)');
}

applyFormatOnly().catch(e => console.error('에러:', e.message));
