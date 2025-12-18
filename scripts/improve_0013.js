const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const CREDENTIALS_PATH = path.join(__dirname, '../data/구글 api/sonson-481412-701902a77d89.json');
const SPREADSHEET_ID = '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY';
const SHEET_NAME = '0000';

// 레퍼런스 기반 매핑
function improveData(rows) {
    return rows.map(row => {
        const category = row[4] || '';
        let name = row[5] || '';
        let desc = row[6] || '';
        const price = row[7] || '';

        // 1. 매장묘 사용료 개선
        if (category === '매장묘' && (name.includes('개인묘') || name.includes('합장묘') || name.includes('쌍분묘'))) {
            // 사용료인 경우 설명을 더 구체적으로
            if (desc === '1평(3.3㎡) 기준 묘지 사용료') {
                // 그대로 유지하되 상품명을 더 명확하게
                if (name === '개인묘') name = '개인 매장묘';
                if (name === '합장묘') name = '합장 매장묘';
                if (name === '쌍분묘') name = '쌍분 매장묘';
            }
        }

        // 2. 평장묘 개선
        if (name.includes('평장묘')) {
            const match = name.match(/(\d+)기/);
            if (match) {
                desc = `${match[1]}기 안치 평장형`;
                name = '평장묘';
            }
        }

        // 3. 봉안담 개선
        if (name.includes('봉안담')) {
            // "개인 봉안담" + "1단" → "개인 봉안담 1단" + 설명 개선
            if (desc && /^\d+단$/.test(desc)) {
                const dan = desc;
                if (name.includes('개인')) {
                    name = '개인 봉안담';
                    desc = `${dan} / 1위 안치`;
                } else if (name.includes('부부')) {
                    name = '부부 봉안담';
                    desc = `${dan} / 2위 안치`;
                }
            }
        }

        // 4. 관리비 개선
        if (name.includes('관리비')) {
            if (name.includes('개인') && name.includes('봉안담')) {
                name = '봉안담 관리비 (개인)';
            } else if (name.includes('부부') && name.includes('봉안담')) {
                name = '봉안담 관리비 (부부)';
            } else if (name.includes('매장묘') || name.includes('평장묘')) {
                name = '매장묘 관리비';
            }
        }

        row[5] = name;
        row[6] = desc;
        return row;
    });
}

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

    // 데이터 개선
    const improvedRows = improveData(rows);

    // 변경 내용 출력
    console.log('=== 개선된 데이터 ===\n');
    improvedRows.forEach((row, i) => {
        const rowNum = 119 + i;
        console.log(`${rowNum}: [${row[4]}] ${row[5]} | ${row[6]} | ${row[7]}원`);
    });

    // 시트에 다시 쓰기
    console.log('\n📝 시트 업데이트 중...');

    await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A119:I145`,
        valueInputOption: 'RAW',
        resource: { values: improvedRows }
    });

    console.log('\n✅ 완료!');
}

main().catch(e => console.error('Error:', e.message));
