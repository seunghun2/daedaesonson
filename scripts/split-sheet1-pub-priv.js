const { google } = require('googleapis');
const fs = require('fs');

const SPREADSHEET_ID = '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY';
const creds = JSON.parse(fs.readFileSync('data/구글 api/sonson-481412-0514ba9d773f.json'));
const facilities = JSON.parse(fs.readFileSync('data/facilities.json'));

async function splitSheet1() {
    const auth = new google.auth.GoogleAuth({ credentials: creds, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    // 1. 시트1 데이터 읽기
    console.log('시트1 데이터 읽는 중...');
    const sheet1Data = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: '시트1!A:Z'
    });

    const rows = sheet1Data.data.values || [];
    const headers = rows[0];
    console.log('시트1:', rows.length, '행');
    console.log('헤더:', headers.slice(0, 5).join(', '));

    // ID 컬럼 인덱스 찾기
    const idColIndex = 0; // 시설ID

    // 2. 공설/사설 분류
    const publicIds = new Set(facilities.filter(f => f.isPublic === true).map(f => f.id));
    const privateIds = new Set(facilities.filter(f => f.isPublic === false).map(f => f.id));

    console.log('공설 시설:', publicIds.size);
    console.log('사설 시설:', privateIds.size);

    // 3. 시트1 데이터를 공설/사설로 분리
    const publicRows = [headers];
    const privateRows = [headers];

    // 시트1에 있는 ID 추적
    const sheet1Ids = new Set();

    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const id = row[idColIndex];

        if (!id) continue;
        sheet1Ids.add(id);

        if (publicIds.has(id)) {
            publicRows.push(row);
        } else if (privateIds.has(id)) {
            privateRows.push(row);
        }
    }

    console.log('시트1 공설 행:', publicRows.length - 1);
    console.log('시트1 사설 행:', privateRows.length - 1);

    // 4. 누락된 ID 추가 (빈 행으로)
    const emptyRow = headers.map(() => '');

    // 공설 누락 추가
    let publicMissing = 0;
    facilities.filter(f => f.isPublic === true).forEach(f => {
        if (!sheet1Ids.has(f.id)) {
            const newRow = [...emptyRow];
            newRow[0] = f.id;
            newRow[1] = f.name;
            publicRows.push(newRow);
            publicMissing++;
        }
    });

    // 사설 누락 추가
    let privateMissing = 0;
    facilities.filter(f => f.isPublic === false).forEach(f => {
        if (!sheet1Ids.has(f.id)) {
            const newRow = [...emptyRow];
            newRow[0] = f.id;
            newRow[1] = f.name;
            privateRows.push(newRow);
            privateMissing++;
        }
    });

    console.log('공설 누락 추가:', publicMissing);
    console.log('사설 누락 추가:', privateMissing);

    // 5. ID 순서로 정렬
    const sortById = (a, b) => {
        if (a[0] === headers[0]) return -1; // 헤더는 맨 위
        if (b[0] === headers[0]) return 1;
        return a[0].localeCompare(b[0]);
    };

    publicRows.sort(sortById);
    privateRows.sort(sortById);

    // 6. 기존 시트 삭제 시도
    const sheetsToDelete = ['🏛️_공설_시설목록', '🏢_사설_시설목록', '🏢_사설_시설목록_병합'];
    for (const name of sheetsToDelete) {
        try {
            const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
            const sheet = spreadsheet.data.sheets.find(s => s.properties.title === name);
            if (sheet) {
                await sheets.spreadsheets.batchUpdate({
                    spreadsheetId: SPREADSHEET_ID,
                    resource: { requests: [{ deleteSheet: { sheetId: sheet.properties.sheetId } }] }
                });
                console.log('삭제:', name);
            }
        } catch (e) { /* 무시 */ }
    }

    // 7. 새 시트 생성 및 데이터 저장
    // 공설
    const publicSheetName = '시트1_공설';
    try {
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: SPREADSHEET_ID,
            resource: { requests: [{ addSheet: { properties: { title: publicSheetName } } }] }
        });
    } catch (e) { /* 이미 존재 */ }

    await sheets.spreadsheets.values.clear({ spreadsheetId: SPREADSHEET_ID, range: `${publicSheetName}!A:Z` });
    await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${publicSheetName}!A1`,
        valueInputOption: 'RAW',
        resource: { values: publicRows }
    });
    console.log(`\n${publicSheetName} 생성: ${publicRows.length - 1}행`);

    // 사설
    const privateSheetName = '시트1_사설';
    try {
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: SPREADSHEET_ID,
            resource: { requests: [{ addSheet: { properties: { title: privateSheetName } } }] }
        });
    } catch (e) { /* 이미 존재 */ }

    await sheets.spreadsheets.values.clear({ spreadsheetId: SPREADSHEET_ID, range: `${privateSheetName}!A:Z` });
    await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${privateSheetName}!A1`,
        valueInputOption: 'RAW',
        resource: { values: privateRows }
    });
    console.log(`${privateSheetName} 생성: ${privateRows.length - 1}행`);

    console.log('\n완료!');
}

splitSheet1().catch(console.error);
