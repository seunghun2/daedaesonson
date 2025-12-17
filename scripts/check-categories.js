const { google } = require('googleapis');
const fs = require('fs');

const SPREADSHEET_ID = '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY';
const creds = JSON.parse(fs.readFileSync('data/구글 api/sonson-481412-701902a77d89.json'));

async function checkCategories() {
    const auth = new google.auth.GoogleAuth({ credentials: creds, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    console.log('데이터 읽는 중...');
    const data = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: '시트1_사설!A:Z'
    });

    const rows = data.data.values || [];
    const headers = rows[0];
    console.log('헤더:', headers);

    const priceColIndex = headers.findIndex(h => h && h.includes('가격카테고리'));
    console.log('가격카테고리 컬럼 인덱스:', priceColIndex);

    // 모든 카테고리 값 수집
    const categories = {};
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i] || [];
        const cat = row[priceColIndex] || '(비어있음)';
        categories[cat] = (categories[cat] || 0) + 1;
    }

    console.log('\n=== 가격카테고리 분포 ===');
    Object.entries(categories).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
        console.log(`${cat}: ${count}개`);
    });
}

checkCategories().catch(console.error);
