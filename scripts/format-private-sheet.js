const { google } = require('googleapis');
const fs = require('fs');

const SPREADSHEET_ID = '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY';
const creds = JSON.parse(fs.readFileSync('data/구글 api/sonson-481412-701902a77d89.json'));

async function formatSheet() {
    const auth = new google.auth.GoogleAuth({ credentials: creds, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const sheet = spreadsheet.data.sheets.find(s => s.properties.title === '시트1_사설');
    const sheetId = sheet.properties.sheetId;

    // 전체 데이터 읽기
    const data = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: '시트1_사설!A:Z'
    });

    const rows = data.data.values || [];
    const headers = rows[0];
    console.log('총 행:', rows.length);

    // 가격카테고리 컬럼 찾기
    const priceColIndex = headers.findIndex(h => h && h.includes('가격카테고리'));
    console.log('가격카테고리 컬럼:', priceColIndex, headers[priceColIndex]);

    // 가격카테고리별 색상 매핑
    const categoryColors = {
        '매장묘': { red: 0.85, green: 0.93, blue: 0.85 },     // 연한 초록
        '봉안당': { red: 0.85, green: 0.92, blue: 1 },        // 연한 파랑
        '봉안담': { red: 0.85, green: 0.92, blue: 1 },        // 연한 파랑 (봉안당과 동일)
        '수목장': { red: 0.96, green: 0.92, blue: 0.85 },     // 연한 베이지
        '자연장': { red: 0.96, green: 0.92, blue: 0.85 },     // 연한 베이지
        '기타': { red: 1, green: 0.97, blue: 0.85 },          // 연한 노랑
        '제외됨': { red: 0.9, green: 0.9, blue: 0.9 },        // 연한 회색
        '제외함': { red: 0.9, green: 0.9, blue: 0.9 },        // 연한 회색
        '': { red: 1, green: 1, blue: 1 }                     // 흰색
    };

    const requests = [];
    let currentId = null;

    for (let i = 1; i < rows.length; i++) {
        const row = rows[i] || [];
        const id = row[0] || '';
        const category = row[priceColIndex] || '';

        // 가격카테고리별 배경색
        let bgColor = categoryColors[''];
        for (const [key, color] of Object.entries(categoryColors)) {
            if (category.includes(key)) {
                bgColor = color;
                break;
            }
        }

        requests.push({
            repeatCell: {
                range: { sheetId, startRowIndex: i, endRowIndex: i + 1, startColumnIndex: 0, endColumnIndex: 20 },
                cell: { userEnteredFormat: { backgroundColor: bgColor } },
                fields: 'userEnteredFormat.backgroundColor'
            }
        });

        // 시설ID 바뀔 때 구분선
        if (id && id !== currentId && currentId !== null) {
            requests.push({
                updateBorders: {
                    range: { sheetId, startRowIndex: i, endRowIndex: i + 1, startColumnIndex: 0, endColumnIndex: 20 },
                    top: { style: 'SOLID', width: 2, color: { red: 0.3, green: 0.3, blue: 0.3 } }
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

    console.log('완료!');
}

formatSheet().catch(console.error);
