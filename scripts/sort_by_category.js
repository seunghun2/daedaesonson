const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const CREDENTIALS_PATH = path.join(__dirname, '../data/구글 api/sonson-481412-701902a77d89.json');
const SPREADSHEET_ID = '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY';
const SHEET_NAME = '0000';

// 카테고리 순서
const CATEGORY_ORDER = {
    '매장묘': 1,
    '봉안당': 2,
    '수목장': 3,
    '자연장': 4,
    '옵션': 5
};

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

    // ID별로 그룹화
    const groups = {};
    data.forEach(row => {
        const id = row[0] || '';
        if (!groups[id]) groups[id] = [];
        groups[id].push(row);
    });

    console.log(`${Object.keys(groups).length}개 시설`);
    console.log('🔄 각 시설 내 카테고리 순서 정렬 중...');

    // 각 그룹 내에서 카테고리 순서로 정렬
    Object.keys(groups).forEach(id => {
        groups[id].sort((a, b) => {
            const catA = a[4] || '';
            const catB = b[4] || '';
            const orderA = CATEGORY_ORDER[catA] || 99;
            const orderB = CATEGORY_ORDER[catB] || 99;
            return orderA - orderB;
        });
    });

    // ID 순서로 다시 합치기
    const sortedIds = Object.keys(groups).sort((a, b) => {
        const numA = parseInt(a.replace('park-', '')) || 99999;
        const numB = parseInt(b.replace('park-', '')) || 99999;
        return numA - numB;
    });

    const sortedData = [];
    sortedIds.forEach(id => {
        sortedData.push(...groups[id]);
    });

    const finalRows = [header, ...sortedData];

    console.log('📝 시트 업데이트 중...');

    await sheets.spreadsheets.values.clear({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A:I`
    });

    await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A1`,
        valueInputOption: 'RAW',
        resource: { values: finalRows }
    });

    console.log(`\n✅ 완료! 각 시설 내 카테고리 순서 정렬됨`);
    console.log('   순서: 매장묘 → 봉안당 → 수목장 → 자연장 → 옵션');
}

main().catch(e => console.error('Error:', e.message));
