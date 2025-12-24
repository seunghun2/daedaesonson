const fs = require('fs');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

// --- CONFIG ---
const SHEET_ID = '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY';
const CREDENTIALS_PATH = 'credentials.json';

const categoryMap = {
    'FAMILY_GRAVE': '공원묘지',
    'CHARNEL_HOUSE': '봉안당',
    'NATURAL_BURIAL': '수목장/자연장',
    'FUNERAL_HOME': '장례식장',
    'CREMATORIUM': '화장시설',
    'OTHER': '기타'
};

async function main() {
    console.log('🚀 Starting Google Sheet Sync...');

    // 1. Load Data
    const facilities = JSON.parse(fs.readFileSync('./data/facilities.json', 'utf-8'));
    console.log(`📊 Loaded ${facilities.length} facilities`);

    // 2. Auth with Google
    if (!fs.existsSync(CREDENTIALS_PATH)) {
        console.error('❌ Credentials file not found!');
        return;
    }
    const creds = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));

    const serviceAccountAuth = new JWT({
        email: creds.client_email,
        key: creds.private_key,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(SHEET_ID, serviceAccountAuth);

    try {
        await doc.loadInfo();
        console.log(`✅ Connected to Sheet: ${doc.title}`);
    } catch (e) {
        console.error('❌ Failed to connect to Google Sheet.');
        console.error(e);
        return;
    }

    // 3. 데이터 준비
    const rows = [];

    facilities.forEach(f => {
        if (!f.priceInfo?.priceTable) return;

        const facilityCategory = categoryMap[f.category] || f.category || '미분류';

        Object.entries(f.priceInfo.priceTable).forEach(([priceType, catData]) => {
            const priceRows = catData.rows || [];

            priceRows.forEach(row => {
                rows.push({
                    '시설ID': f.id,
                    '시설명': f.name,
                    '시설카테고리': facilityCategory,
                    '2뎁스': priceType,
                    '상품명': row.name || '',
                    '설명': row.grade || '',
                    '가격': row.price || 0,
                    '대표가격': row.isRepresentative ? 'O' : ''
                });
            });
        });
    });

    console.log(`📝 총 ${rows.length}개 가격 항목 준비 완료`);

    // 4. 시트 선택 (gid=1147646432)
    let sheet = doc.sheetsById[1147646432];
    if (!sheet) {
        console.log('📄 지정된 시트를 찾지 못함, 첫 번째 시트 사용');
        sheet = doc.sheetsByIndex[0];
    }

    // 5. Clear & Upload
    console.log('🧹 Clearing old data...');
    await sheet.clear();

    const headers = ['시설ID', '시설명', '시설카테고리', '2뎁스', '상품명', '설명', '가격', '대표가격'];
    await sheet.setHeaderRow(headers);

    // Batch upload
    console.log('📤 Uploading data...');
    const BATCH_SIZE = 500;
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const chunk = rows.slice(i, i + BATCH_SIZE);
        await sheet.addRows(chunk);
        console.log(`   ${Math.min(i + BATCH_SIZE, rows.length)} / ${rows.length} rows...`);
    }

    console.log('✨ 완료!');
    console.log(`🔗 https://docs.google.com/spreadsheets/d/${SHEET_ID}`);
}

main().catch(console.error);
