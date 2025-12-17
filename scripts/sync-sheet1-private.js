const { google } = require('googleapis');
const fs = require('fs');

const SPREADSHEET_ID = '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY';
const creds = JSON.parse(fs.readFileSync('data/구글 api/sonson-481412-0514ba9d773f.json'));
const facilities = JSON.parse(fs.readFileSync('data/facilities.json'));

async function syncData() {
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
    console.log(`시트1: ${rows.length}행`);

    if (rows.length === 0) {
        console.log('시트1이 비어있습니다!');
        return;
    }

    // 헤더 확인
    const headers = rows[0];
    console.log('시트1 헤더:', headers.slice(0, 10).join(', '));

    // ID 컬럼 찾기
    const idColIndex = headers.findIndex(h => h && (h.toLowerCase().includes('id') || h === 'ID'));
    console.log('ID 컬럼 인덱스:', idColIndex);

    // ID -> 행 데이터 매핑
    const sheet1Map = {};
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row && row[idColIndex]) {
            sheet1Map[row[idColIndex]] = { rowIndex: i, data: row, headers };
        }
    }
    console.log(`시트1 ID 매핑: ${Object.keys(sheet1Map).length}개`);

    // 2. 사설 시설 목록
    const privateFacilities = facilities.filter(f => f.isPublic === false);
    console.log(`사설 시설: ${privateFacilities.length}개`);

    // 3. 매칭 확인
    let matched = 0;
    let notMatched = [];

    privateFacilities.forEach(f => {
        if (sheet1Map[f.id]) {
            matched++;
        } else {
            notMatched.push(f.id);
        }
    });

    console.log(`\n=== 매칭 결과 ===`);
    console.log(`매칭됨: ${matched}개`);
    console.log(`미매칭: ${notMatched.length}개`);

    if (notMatched.length > 0 && notMatched.length <= 20) {
        console.log('미매칭 ID:', notMatched.join(', '));
    }

    // 4. 사설_시설목록_복사본 시트 생성
    const newSheetName = '🏢_사설_시설목록_병합';
    try {
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: SPREADSHEET_ID,
            resource: { requests: [{ addSheet: { properties: { title: newSheetName } } }] }
        });
        console.log(`\n새 시트 생성: ${newSheetName}`);
    } catch (e) { console.log('시트 이미 존재'); }

    // 5. 병합 데이터 생성
    // 사설_시설목록 기본 + 시트1 추가 컬럼
    const newHeaders = ['ID', '시설명', '주소', '지역', '시설종류', '연락처', '가격정보', '좌표'];

    // 시트1 헤더 중 추가할 것들 (ID, 시설명 제외)
    const extraHeaders = headers.filter(h => h && !['ID', 'id', '시설명', '이름'].includes(h));
    const fullHeaders = [...newHeaders, '---시트1---', ...extraHeaders];

    const mergedRows = [fullHeaders];

    privateFacilities.forEach(f => {
        const baseRow = [
            f.id,
            f.name,
            f.address || '-',
            f.region || '-',
            f.facilityType || '-',
            f.phone || '-',
            f.priceInfo && f.priceInfo.length > 0 ? 'O' : 'X',
            f.coords ? 'O' : 'X'
        ];

        // 시트1 데이터 추가
        if (sheet1Map[f.id]) {
            const sheet1Row = sheet1Map[f.id].data;
            const extraData = extraHeaders.map((h, i) => {
                const colIndex = headers.indexOf(h);
                return colIndex >= 0 && sheet1Row[colIndex] ? sheet1Row[colIndex] : '';
            });
            mergedRows.push([...baseRow, '', ...extraData]);
        } else {
            mergedRows.push([...baseRow, '', ...extraHeaders.map(() => '')]);
        }
    });

    // 6. 시트에 저장
    await sheets.spreadsheets.values.clear({ spreadsheetId: SPREADSHEET_ID, range: `${newSheetName}!A:ZZ` });
    await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${newSheetName}!A1`,
        valueInputOption: 'RAW',
        resource: { values: mergedRows }
    });

    console.log(`\n병합 완료! ${mergedRows.length - 1}행 저장`);
}

syncData().catch(console.error);
