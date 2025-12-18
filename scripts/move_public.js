const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const CREDENTIALS_PATH = path.join(__dirname, '../data/구글 api/sonson-481412-701902a77d89.json');
const SPREADSHEET_ID = '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY';

async function main() {
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
    const auth = new google.auth.GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() });

    // 0000 시트에서 park-0305 행 찾기
    console.log('📖 0000 시트에서 park-0305 찾는 중...');

    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: '0000!A:I'
    });

    const rows = response.data.values || [];
    const header = rows[0];

    const targetRows = [];
    const remainingRows = [header];

    for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] === 'park-0305') {
            targetRows.push(rows[i]);
        } else {
            remainingRows.push(rows[i]);
        }
    }

    console.log(`  → park-0305 행: ${targetRows.length}개`);

    if (targetRows.length === 0) {
        console.log('park-0305가 없습니다.');
        return;
    }

    // 시트1_공설에 추가
    console.log('📝 시트1_공설에 추가 중...');

    await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: '시트1_공설!A:I',
        valueInputOption: 'RAW',
        resource: { values: targetRows }
    });

    // 0000 시트에서 제거 (나머지만 남기기)
    console.log('🗑️ 0000 시트에서 삭제 중...');

    await sheets.spreadsheets.values.clear({
        spreadsheetId: SPREADSHEET_ID,
        range: '0000!A:I'
    });

    await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: '0000!A1',
        valueInputOption: 'RAW',
        resource: { values: remainingRows }
    });

    console.log(`\n✅ 완료! park-0305 ${targetRows.length}개 행이 시트1_공설로 이동됨`);
    console.log(`   0000 시트: ${remainingRows.length}개 행 남음`);
}
main();
