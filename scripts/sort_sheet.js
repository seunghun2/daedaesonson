const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const CREDENTIALS_PATH = path.join(__dirname, '../data/구글 api/sonson-481412-701902a77d89.json');
const SPREADSHEET_ID = '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY';
const SHEET_NAME = '시트1_시작';

async function main() {
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
    const auth = new google.auth.GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() });

    console.log('📖 시트 데이터 읽는 중...');
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A:Z`
    });

    const rows = response.data.values || [];
    const header = rows[0];
    const data = rows.slice(1);

    console.log(`총 ${data.length}개 행 읽음`);

    // ID 컬럼 찾기 (시설ID)
    const idCol = header.indexOf('시설ID');
    console.log(`시설ID 컬럼 위치: ${idCol}`);

    // ID 기준 정렬 (park-0001, park-0002, ... 순서)
    data.sort((a, b) => {
        const idA = a[idCol] || '';
        const idB = b[idCol] || '';

        // park-XXXX 형식에서 숫자 추출
        const numA = parseInt(idA.replace(/\D/g, '')) || 0;
        const numB = parseInt(idB.replace(/\D/g, '')) || 0;

        return numA - numB;
    });

    console.log('✅ 정렬 완료!');

    // 정렬 결과 미리보기
    console.log('\n📋 정렬 후 처음 20개 ID:');
    const seenIds = new Set();
    for (const row of data) {
        if (seenIds.size >= 20) break;
        const id = row[idCol];
        if (id && !seenIds.has(id)) {
            seenIds.add(id);
            console.log(`  - ${id}`);
        }
    }

    // 시트에 다시 쓰기
    const finalRows = [header, ...data];

    console.log(`\n📝 시트 업데이트 중... (총 ${finalRows.length}행)`);

    await sheets.spreadsheets.values.clear({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A:Z`
    });

    await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A1`,
        valueInputOption: 'RAW',
        resource: { values: finalRows }
    });

    console.log('\n✅ 시트 정렬 완료!');
}

main().catch(e => console.error('Error:', e.message));
