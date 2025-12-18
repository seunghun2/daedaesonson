const { google } = require('googleapis');
const fs = require('fs');

const SPREADSHEET_ID = '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY';
const SHEET_NAME = '시트1_사설';
const creds = JSON.parse(fs.readFileSync('data/구글 api/sonson-481412-701902a77d89.json'));

// 카테고리 영어 → 한글 변환
const categoryToKorean = {
    'FAMILY_GRAVE': '공원묘지',
    'CHARNEL_HOUSE': '봉안당',
    'NATURAL_BURIAL': '수목장',
    'CREMATORIUM': '화장시설',
    'ETC': '기타',
    'OTHER': '기타'
};

async function updateCategories() {
    const auth = new google.auth.GoogleAuth({ credentials: creds, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const sheets = google.sheets({ version: 'v4', auth });

    // 1. 현재 시트 데이터 읽기
    console.log('시트 데이터 읽는 중...');
    const data = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A:C`  // ID, 이름, 카테고리만
    });

    const rows = data.data.values || [];
    console.log('총 행:', rows.length);

    // 2. facilities.json 로드
    const facilities = JSON.parse(fs.readFileSync('data/facilities.json'));
    const facilityMap = {};
    for (const f of facilities) {
        facilityMap[f.id] = f;
    }

    // 3. 카테고리가 비어있는 행 찾기
    const updates = [];
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const id = row[0];
        const currentCategory = row[2] || '';

        if (!currentCategory && id && facilityMap[id]) {
            const koreanCategory = categoryToKorean[facilityMap[id].category] || '';
            if (koreanCategory) {
                updates.push({
                    range: `${SHEET_NAME}!C${i + 1}`,
                    values: [[koreanCategory]]
                });
            }
        }
    }

    console.log('업데이트할 셀:', updates.length);

    if (updates.length === 0) {
        console.log('업데이트할 항목이 없습니다.');
        return;
    }

    // 4. 배치 업데이트 (시설카테고리 컬럼만!)
    console.log('시설카테고리 업데이트 중...');
    await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        resource: {
            valueInputOption: 'RAW',
            data: updates
        }
    });

    console.log('✅ 완료! ' + updates.length + '개 시설카테고리 업데이트됨');
}

updateCategories().catch(e => console.error('에러:', e.message));
