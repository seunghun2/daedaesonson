const { google } = require('googleapis');
const fs = require('fs');

const SPREADSHEET_ID = '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY';
const SHEET_NAME = '시트1_사설';
const creds = JSON.parse(fs.readFileSync('data/구글 api/sonson-481412-701902a77d89.json'));

async function addMissingFacilities() {
    const auth = new google.auth.GoogleAuth({ credentials: creds, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const sheets = google.sheets({ version: 'v4', auth });

    // 1. 현재 시트에서 시설ID 수집
    console.log('현재 시트 데이터 읽는 중...');
    const data = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A:A`
    });

    const existingIds = new Set((data.data.values || []).slice(1).map(r => r[0]).filter(Boolean));
    console.log('현재 시트 고유 ID:', existingIds.size);

    // 2. facilities.json에서 사설 시설 가져오기
    const facilities = JSON.parse(fs.readFileSync('data/facilities.json'));
    const privateFacilities = facilities.filter(f => f.isPublic === false);
    console.log('facilities.json 사설:', privateFacilities.length);

    // 3. 시트에 없는 사설 시설 찾기
    const missing = [];
    for (const f of privateFacilities) {
        if (!existingIds.has(f.id)) {
            missing.push(f);
        }
    }
    console.log('추가할 시설:', missing.length);

    if (missing.length === 0) {
        console.log('추가할 시설이 없습니다.');
        return;
    }

    // 4. 새 행 데이터 만들기 (헤더: 시설ID, 시설명, 시설카테고리, 운영구분, 가격카테고리, 상품명, 설명, 가격, 대표가격)
    const newRows = [];
    for (const f of missing) {
        const category = f.category1 || '';
        newRows.push([
            f.id,           // 시설ID
            f.name,         // 시설명
            category,       // 시설카테고리
            '사설',          // 운영구분
            '',             // 가격카테고리 (빈값)
            '',             // 상품명
            '',             // 설명
            '',             // 가격
            ''              // 대표가격
        ]);
    }

    // ID 순으로 정렬
    newRows.sort((a, b) => a[0].localeCompare(b[0]));

    // 5. 시트 맨 아래에 추가 (기존 데이터 수정 없음!)
    console.log('시트 맨 아래에 추가 중...');
    await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A:I`,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        resource: { values: newRows }
    });

    console.log('✅ 완료! ' + newRows.length + '개 시설 추가됨 (기존 데이터 수정 없음)');
}

addMissingFacilities().catch(e => console.error('에러:', e.message));
