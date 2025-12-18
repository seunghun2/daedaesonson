const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const CREDENTIALS_PATH = path.join(__dirname, '../data/구글 api/sonson-481412-701902a77d89.json');
const SPREADSHEET_ID = '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY';
const SHEET_NAME = '0000';

// 카테고리 정렬 순서
const CATEGORY_ORDER = {
    '매장묘': 1,
    '봉안당': 2,
    '수목장': 3,
    '옵션': 4
};

async function main() {
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
    const auth = new google.auth.GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() });

    console.log('📖 0013 데이터 읽는 중...');

    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A119:I145`
    });

    const rows = response.data.values || [];
    console.log(`총 ${rows.length}개 행\n`);

    // 카테고리별 정렬
    rows.sort((a, b) => {
        const catA = a[4] || '';
        const catB = b[4] || '';

        const orderA = CATEGORY_ORDER[catA] || 99;
        const orderB = CATEGORY_ORDER[catB] || 99;

        if (orderA !== orderB) {
            return orderA - orderB;
        }

        // 같은 카테고리 내: 관리비는 맨 뒤로
        const nameA = a[5] || '';
        const nameB = b[5] || '';

        const isManageA = nameA.includes('관리비');
        const isManageB = nameB.includes('관리비');

        if (isManageA && !isManageB) return 1;
        if (!isManageA && isManageB) return -1;

        return 0;
    });

    // 정렬 결과 출력
    console.log('=== 정렬된 데이터 ===\n');
    rows.forEach((row, i) => {
        const rowNum = 119 + i;
        console.log(`${rowNum}: [${row[4]}] ${row[5]} | ${row[6]} | ${row[7]}원`);
    });

    // 시트에 다시 쓰기
    console.log('\n📝 시트 업데이트 중...');

    await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A119:I145`,
        valueInputOption: 'RAW',
        resource: { values: rows }
    });

    console.log('\n✅ 완료! 카테고리별로 정렬되었습니다.');
}

main().catch(e => console.error('Error:', e.message));
