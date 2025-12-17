const { google } = require('googleapis');
const fs = require('fs');

const SPREADSHEET_ID = '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY';
const creds = JSON.parse(fs.readFileSync('data/구글 api/sonson-481412-0514ba9d773f.json'));
const facilities = JSON.parse(fs.readFileSync('data/facilities.json'));

async function copyToSheet1() {
    const auth = new google.auth.GoogleAuth({ credentials: creds, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    const privateFacilities = facilities.filter(f => f.isPublic === false);

    const headers = [['ID', '시설명', '주소', '지역', '시설종류', '연락처', '가격정보 여부', '좌표 여부']];
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

    await sheets.spreadsheets.values.clear({ spreadsheetId: SPREADSHEET_ID, range: '시트1!A:H' });
    await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: '시트1!A1',
        valueInputOption: 'RAW',
        resource: { values: [...headers, ...privateFacilities.map(toRow)] }
    });

    console.log('시트1에 사설 ' + privateFacilities.length + '개 복사 완료!');
}
copyToSheet1();
