const { google } = require('googleapis');
const fs = require('fs');

const creds = JSON.parse(fs.readFileSync('data/구글 api/sonson-481412-0514ba9d773f.json', 'utf8'));
const auth = new google.auth.GoogleAuth({ credentials: creds, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });

async function applyFormatting() {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    // Get sheet ID
    const info = await sheets.spreadsheets.get({
        spreadsheetId: '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY'
    });
    const sheetId = info.data.sheets.find(s => s.properties.title === '시트1').properties.sheetId;

    // 카테고리별 색상 (E열 = index 4가 가격카테고리)
    const colors = {
        '매장묘': { red: 0.95, green: 1.0, blue: 0.95 },
        '봉안당': { red: 1.0, green: 0.97, blue: 0.9 },
        '수목장': { red: 0.9, green: 0.98, blue: 0.9 },
        '기타': { red: 0.98, green: 0.98, blue: 0.98 },
        '제외됨': { red: 1.0, green: 0.95, blue: 0.95 }
    };

    const colorRequests = Object.entries(colors).map(([category, color]) => ({
        addConditionalFormatRule: {
            rule: {
                ranges: [{
                    sheetId: sheetId,
                    startRowIndex: 1,
                    startColumnIndex: 0,
                    endColumnIndex: 10
                }],
                booleanRule: {
                    condition: {
                        type: 'CUSTOM_FORMULA',
                        values: [{ userEnteredValue: '=$E2="' + category + '"' }]
                    },
                    format: { backgroundColor: color }
                }
            },
            index: 0
        }
    }));

    await sheets.spreadsheets.batchUpdate({
        spreadsheetId: '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY',
        resource: { requests: colorRequests }
    });

    console.log('✅ 카테고리 색상 적용 완료!');

    // park 구분선
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY',
        range: '시트1!A:A'
    });

    const parkIds = res.data.values;
    const parkStarts = [];
    let prevPark = '';

    parkIds.forEach((r, i) => {
        if (i === 0) return;
        const parkId = r[0] || '';
        if (parkId !== prevPark) {
            parkStarts.push(i);
            prevPark = parkId;
        }
    });

    console.log('park 구분선:', parkStarts.length, '개');

    // 배치로 구분선 추가
    const batchSize = 100;
    for (let i = 0; i < parkStarts.length; i += batchSize) {
        const batch = parkStarts.slice(i, i + batchSize).map(rowIndex => ({
            updateBorders: {
                range: {
                    sheetId: sheetId,
                    startRowIndex: rowIndex,
                    endRowIndex: rowIndex + 1,
                    startColumnIndex: 0,
                    endColumnIndex: 10
                },
                top: {
                    style: 'SOLID_MEDIUM',
                    color: { red: 0.3, green: 0.3, blue: 0.3 }
                }
            }
        }));

        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY',
            resource: { requests: batch }
        });
        console.log('구분선 처리:', Math.min(i + batchSize, parkStarts.length), '/', parkStarts.length);
    }

    console.log('✅ park 구분선 적용 완료!');
}

applyFormatting();
