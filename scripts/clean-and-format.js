const { google } = require('googleapis');
const fs = require('fs');

const SPREADSHEET_ID = '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY';
const SHEET_NAME = '시트1_사설';
const creds = JSON.parse(fs.readFileSync('data/구글 api/sonson-481412-701902a77d89.json'));

async function cleanAndFormat() {
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
        range: `${SHEET_NAME}!A:Z`
    });

    const rows = data.data.values || [];
    const headers = rows[0];
    console.log('원본 행:', rows.length);

    // 3. 빈 행 제거 (첫 컬럼이 비어있는 행)
    const cleanedRows = [headers];
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        // 첫 컬럼(시설ID)이 있고 빈 행이 아닌 경우만 포함
        if (row && row[0] && row[0].toString().trim() !== '') {
            cleanedRows.push(row);
        }
    }
    console.log('빈 행 제거 후:', cleanedRows.length);
    console.log('제거된 행:', rows.length - cleanedRows.length);

    // 4. 시트 클리어 후 새 데이터 쓰기
    console.log('시트 업데이트 중...');
    await sheets.spreadsheets.values.clear({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A:Z`
    });

    await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A1`,
        valueInputOption: 'RAW',
        resource: { values: cleanedRows }
    });

    // 5. 서식 적용 (색상 0.91 + ID 구분선)
    console.log('서식 적용 중...');
    const priceColIndex = headers.findIndex(h => h && h.includes('가격카테고리'));

    const categoryColors = {
        '매장묘': { red: 0.91, green: 0.96, blue: 0.91 },
        '봉안당': { red: 0.91, green: 0.95, blue: 1 },
        '봉안담': { red: 0.91, green: 0.95, blue: 1 },
        '수목장': { red: 0.98, green: 0.96, blue: 0.91 },
        '자연장': { red: 0.98, green: 0.96, blue: 0.91 },
        '기타': { red: 1, green: 0.99, blue: 0.91 },
        '제외됨': { red: 0.95, green: 0.95, blue: 0.95 },
        '제외함': { red: 0.95, green: 0.95, blue: 0.95 },
        '': { red: 1, green: 1, blue: 1 }
    };

    const requests = [];
    let currentId = null;
    const colCount = Math.max(...cleanedRows.map(r => r ? r.length : 0), 10);

    for (let i = 1; i < cleanedRows.length; i++) {
        const row = cleanedRows[i] || [];
        const id = row[0] || '';
        const category = row[priceColIndex] || '';

        // 배경색
        let bgColor = categoryColors[''];
        for (const [key, color] of Object.entries(categoryColors)) {
            if (key && category.includes(key)) {
                bgColor = color;
                break;
            }
        }

        requests.push({
            repeatCell: {
                range: { sheetId, startRowIndex: i, endRowIndex: i + 1, startColumnIndex: 0, endColumnIndex: colCount },
                cell: { userEnteredFormat: { backgroundColor: bgColor } },
                fields: 'userEnteredFormat.backgroundColor'
            }
        });

        // ID 바뀔 때 굵은 상단 구분선
        if (id && id !== currentId && currentId !== null) {
            requests.push({
                updateBorders: {
                    range: { sheetId, startRowIndex: i, endRowIndex: i + 1, startColumnIndex: 0, endColumnIndex: colCount },
                    top: { style: 'SOLID_MEDIUM', width: 2, color: { red: 0.3, green: 0.3, blue: 0.3 } }
                }
            });
        }
        currentId = id;
    }

    console.log('서식 요청:', requests.length);

    // 배치 업데이트
    for (let i = 0; i < requests.length; i += 500) {
        const batch = requests.slice(i, i + 500);
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: SPREADSHEET_ID,
            resource: { requests: batch }
        });
        console.log(`적용: ${Math.min(i + 500, requests.length)}/${requests.length}`);
    }

    console.log('✅ 완료!');
}

cleanAndFormat().catch(e => console.error('에러:', e.message));
