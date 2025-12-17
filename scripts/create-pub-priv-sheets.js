const { google } = require('googleapis');
const fs = require('fs');

const SPREADSHEET_ID = '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY';
const creds = JSON.parse(fs.readFileSync('data/구글 api/sonson-481412-0514ba9d773f.json'));
const facilities = JSON.parse(fs.readFileSync('data/facilities.json'));

async function createSeparatedSheets() {
    const auth = new google.auth.GoogleAuth({ credentials: creds, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    // 공설/사설 분류
    const publicFacilities = facilities.filter(f => f.isPublic === true);
    const privateFacilities = facilities.filter(f => f.isPublic === false);
    const unknownFacilities = facilities.filter(f => f.isPublic === null || f.isPublic === undefined);

    console.log(`총 시설: ${facilities.length}`);
    console.log(`공설: ${publicFacilities.length}`);
    console.log(`사설: ${privateFacilities.length}`);
    console.log(`미확인: ${unknownFacilities.length}`);

    // 헤더
    const headers = [['ID', '시설명', '주소', '지역', '시설종류', '연락처', '가격정보 여부', '좌표 여부']];

    // 데이터 변환 함수
    const toRow = (f) => [
        f.id,
        f.name,
        f.address || '-',
        f.region || '-',
        f.facilityType || '-',
        f.phone || '-',
        f.priceInfo && f.priceInfo.length > 0 ? 'O' : 'X',
        f.coords ? 'O' : 'X'
    ];

    // 공설 시트
    const publicSheetName = '🏛️_공설_시설목록';
    try {
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: SPREADSHEET_ID,
            resource: { requests: [{ addSheet: { properties: { title: publicSheetName } } }] }
        });
    } catch (e) { /* 이미 존재 */ }

    await sheets.spreadsheets.values.clear({ spreadsheetId: SPREADSHEET_ID, range: `${publicSheetName}!A:H` });
    await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${publicSheetName}!A1`,
        valueInputOption: 'RAW',
        resource: { values: [...headers, ...publicFacilities.map(toRow)] }
    });
    console.log(`공설 시트 생성: ${publicFacilities.length}행`);

    // 사설 시트
    const privateSheetName = '🏢_사설_시설목록';
    try {
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: SPREADSHEET_ID,
            resource: { requests: [{ addSheet: { properties: { title: privateSheetName } } }] }
        });
    } catch (e) { /* 이미 존재 */ }

    await sheets.spreadsheets.values.clear({ spreadsheetId: SPREADSHEET_ID, range: `${privateSheetName}!A:H` });
    await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${privateSheetName}!A1`,
        valueInputOption: 'RAW',
        resource: { values: [...headers, ...privateFacilities.map(toRow)] }
    });
    console.log(`사설 시트 생성: ${privateFacilities.length}행`);

    console.log('\n완료!');
}

createSeparatedSheets().catch(console.error);
