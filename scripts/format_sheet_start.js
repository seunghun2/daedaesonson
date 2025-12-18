const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const CREDENTIALS_PATH = path.join(__dirname, '../data/구글 api/sonson-481412-701902a77d89.json');
const SPREADSHEET_ID = '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY';
const SHEET_NAME = '0000';

// 은은한 배경색 (가격카테고리별)
const CATEGORY_COLORS = {
    '봉안당': { red: 0.95, green: 0.95, blue: 1.0 },       // 연한 라벤더
    '봉안묘': { red: 0.95, green: 1.0, blue: 0.95 },       // 연한 민트
    '자연장': { red: 1.0, green: 0.98, blue: 0.92 },       // 연한 크림
    '수목장': { red: 0.92, green: 0.98, blue: 0.92 },      // 연한 연두
    '납골당': { red: 0.98, green: 0.95, blue: 0.95 },      // 연한 핑크
    '화장장': { red: 0.96, green: 0.96, blue: 0.96 },      // 연한 회색
    '장례식장': { red: 0.98, green: 0.96, blue: 0.92 },    // 연한 베이지
    '공원묘지': { red: 0.92, green: 0.96, blue: 0.98 },    // 연한 하늘색
    'default': { red: 1.0, green: 1.0, blue: 1.0 }         // 흰색
};

async function main() {
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
    const auth = new google.auth.GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() });

    // 시트 ID 찾기
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const sheet = spreadsheet.data.sheets.find(s => s.properties.title === SHEET_NAME);

    if (!sheet) {
        console.log(`❌ 시트 "${SHEET_NAME}"를 찾을 수 없습니다.`);
        console.log('사용 가능한 시트:', spreadsheet.data.sheets.map(s => s.properties.title).join(', '));
        return;
    }

    const sheetId = sheet.properties.sheetId;
    console.log(`✅ 시트 찾음: ${SHEET_NAME} (ID: ${sheetId})`);

    // 데이터 읽기
    console.log('📖 데이터 읽는 중...');
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A:Z`
    });

    const rows = response.data.values || [];
    const header = rows[0];
    console.log(`총 ${rows.length}개 행`);

    const idCol = header.indexOf('시설ID');
    const categoryCol = header.indexOf('가격카테고리');
    console.log(`시설ID 컬럼: ${idCol}, 가격카테고리 컬럼: ${categoryCol}`);

    if (idCol < 0 || categoryCol < 0) {
        console.log('❌ 필요한 컬럼을 찾을 수 없습니다.');
        return;
    }

    // 포맷팅 요청 생성
    const requests = [];
    let prevId = null;
    let colorRowCount = 0;

    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const currentId = row[idCol] || '';
        const category = row[categoryCol] || '';

        // 1. ID가 바뀌면 구분선 추가 (위쪽 테두리)
        if (prevId && currentId !== prevId) {
            requests.push({
                updateBorders: {
                    range: {
                        sheetId: sheetId,
                        startRowIndex: i,
                        endRowIndex: i + 1,
                        startColumnIndex: 0,
                        endColumnIndex: header.length
                    },
                    top: {
                        style: 'SOLID_MEDIUM',
                        color: { red: 0.3, green: 0.3, blue: 0.3 }
                    }
                }
            });
        }
        prevId = currentId;

        // 2. 가격카테고리별 배경색
        const bgColor = CATEGORY_COLORS[category] || CATEGORY_COLORS['default'];
        requests.push({
            repeatCell: {
                range: {
                    sheetId: sheetId,
                    startRowIndex: i,
                    endRowIndex: i + 1,
                    startColumnIndex: 0,
                    endColumnIndex: header.length
                },
                cell: {
                    userEnteredFormat: {
                        backgroundColor: bgColor
                    }
                },
                fields: 'userEnteredFormat.backgroundColor'
            }
        });
        colorRowCount++;
    }

    console.log(`\n📊 포맷팅 준비:`);
    console.log(`  - 총 요청 수: ${requests.length}`);
    console.log(`  - 배경색 적용 행: ${colorRowCount}`);

    // 배치로 요청 실행 (한 번에 너무 많으면 나눠서)
    const BATCH_SIZE = 500;
    for (let i = 0; i < requests.length; i += BATCH_SIZE) {
        const batch = requests.slice(i, i + BATCH_SIZE);
        console.log(`📝 배치 ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(requests.length / BATCH_SIZE)} 실행 중... (${batch.length}개 요청)`);

        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: SPREADSHEET_ID,
            resource: { requests: batch }
        });
    }

    console.log('\n✅ 포맷팅 완료!');
    console.log('  - ID별 구분선 추가됨');
    console.log('  - 가격카테고리별 배경색 적용됨');
}

main().catch(e => console.error('Error:', e.message));
