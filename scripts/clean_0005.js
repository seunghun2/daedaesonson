const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const CREDENTIALS_PATH = path.join(__dirname, '../data/구글 api/sonson-481412-701902a77d89.json');
const SPREADSHEET_ID = '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY';
const SHEET_NAME = '0000';

function cleanProductName(name, desc) {
    if (!name) return { name, desc };

    let cleanedName = name;
    let newDesc = desc || '';

    // 1. 단수 정보 추출 (1단, 8단, 3~5단 등)
    const danMatch = cleanedName.match(/(\d+단|\d+~\d+단)/g);
    if (danMatch) {
        // 단수 정보를 설명으로 이동
        if (newDesc && !newDesc.includes('단')) {
            newDesc = danMatch.join(', ') + ', ' + newDesc;
        } else if (!newDesc) {
            newDesc = danMatch.join(', ');
        }
        // 상품명에서 단수 제거
        cleanedName = cleanedName.replace(/\s*\d+단/g, '').replace(/\s*\d+~\d+단/g, '');
    }

    // 2. 층수 정보 추출
    const floorMatch = cleanedName.match(/(\d+층)/);
    if (floorMatch) {
        if (newDesc) {
            newDesc = floorMatch[1] + ', ' + newDesc;
        } else {
            newDesc = floorMatch[1];
        }
        cleanedName = cleanedName.replace(/\s*\d+층\s*/g, ' ');
    }

    // 3. 쉼표 정리
    cleanedName = cleanedName.replace(/[,\s]+/g, ' ').trim();
    cleanedName = cleanedName.replace(/\(\s*\)/g, '').trim();

    // 4. "일반단", "특별단", "VIP" 등 제거 (상품명에서)
    cleanedName = cleanedName.replace(/일반단\s*/gi, '');
    cleanedName = cleanedName.replace(/특별단\s*/gi, '');

    // 5. 중복 공백 제거
    cleanedName = cleanedName.replace(/\s+/g, ' ').trim();
    newDesc = newDesc.replace(/,\s*,/g, ',').replace(/^,\s*/, '').replace(/\s*,$/, '').trim();

    return { name: cleanedName, desc: newDesc };
}

async function main() {
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
    const auth = new google.auth.GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() });

    console.log('📖 0005 데이터 읽는 중...');

    // 69~114 행 읽기 (방금 삽입한 0005 데이터)
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A69:I114`
    });

    const rows = response.data.values || [];
    console.log(`총 ${rows.length}개 행`);

    // 상품명(5번 인덱스)과 설명(6번 인덱스) 정리
    const cleanedRows = rows.map(row => {
        const originalName = row[5] || '';
        const originalDesc = row[6] || '';

        const { name, desc } = cleanProductName(originalName, originalDesc);

        if (originalName !== name || originalDesc !== desc) {
            console.log(`  "${originalName}" → "${name}" | 설명: "${desc}"`);
        }

        row[5] = name;
        row[6] = desc;
        return row;
    });

    // 시트에 다시 쓰기
    console.log('\n📝 시트 업데이트 중...');

    await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A69:I114`,
        valueInputOption: 'RAW',
        resource: { values: cleanedRows }
    });

    console.log('\n✅ 완료! 상품명과 설명이 분리되었습니다.');
}

main().catch(e => console.error('Error:', e.message));
