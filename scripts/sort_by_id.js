const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const CREDENTIALS_PATH = path.join(__dirname, '../data/구글 api/sonson-481412-701902a77d89.json');
const SPREADSHEET_ID = '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY';
const SHEET_NAME = '0000';

async function main() {
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
    const auth = new google.auth.GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() });

    console.log('📖 시트 데이터 읽는 중...');

    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A:I`
    });

    const rows = response.data.values || [];
    const header = rows[0];
    const data = rows.slice(1);

    console.log(`총 ${data.length}개 행`);

    // 시설ID 기준 정렬 (park-0001 → 1로 변환해서 숫자 정렬)
    console.log('🔄 시설ID 순서로 정렬 중...');

    data.sort((a, b) => {
        const idA = a[0] || '';
        const idB = b[0] || '';

        // park-XXXX에서 숫자 추출
        const numA = parseInt(idA.replace('park-', '')) || 99999;
        const numB = parseInt(idB.replace('park-', '')) || 99999;

        return numA - numB;
    });

    // 정렬된 데이터로 시트 업데이트
    const sortedRows = [header, ...data];

    console.log('📝 시트 업데이트 중...');

    // 먼저 전체 클리어
    await sheets.spreadsheets.values.clear({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A:I`
    });

    // 정렬된 데이터 쓰기
    await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A1`,
        valueInputOption: 'RAW',
        resource: { values: sortedRows }
    });

    console.log(`\n✅ 완료! ${sortedRows.length}개 행이 시설ID 순서로 정렬되었습니다.`);

    // 샘플 출력
    console.log('\n📋 정렬 결과 샘플:');
    sortedRows.slice(1, 11).forEach((row, i) => {
        console.log(`  ${i + 1}. ${row[0]} - ${row[1]}`);
    });
}

main().catch(e => console.error('Error:', e.message));
