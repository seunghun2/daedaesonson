const { google } = require('googleapis');
const fs = require('fs');

const SPREADSHEET_ID = '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY';
const creds = JSON.parse(fs.readFileSync('data/구글 api/sonson-481412-0514ba9d773f.json'));

// 삭제할 키워드
const deleteKeywords = [
    // 석물 관련
    '월석', '작업비', '정리비', '향로', '천막', '판석', '북석', '화병',
    '설묘후', '꽃병', '단향로', '석문', '석주', '혼유석', '묘테석',
    '오비석', '상석', '고흥석', '비석', '명패비', '오석', '각자비',
    '석물재조립',
    // 음식 관련
    '갈비탕', '갈비', '육개장', '설렁탕', '떡국', '비빔밥', '불고기',
    '삼겹살', '냉면', '칼국수', '김치찌개', '된장찌개', '제사음식',
    '음식', '식사', '도시락', '국밥', '떡', '한우', '돼지', '닭',
    '생선', '과일', '주류', '음료', '커피', '산신', '제사상',
    // 기타
    '조화', '나무함', '목함', '위패', '조성비',
    '인건비', '공과잡비', '폐기물처리', '봉안석물', '석물대금', '식대',
    '사진액자', '제례용', '소주', '정종', '포', '표지석', '장식',
    // 음식/술 추가
    '막걸리', '맥주', '와인', '위스키', '청주', '약주', '술', '주',
    '밥', '국', '찌개', '탕', '전', '나물', '김치', '젓갈', '젓',
    '고기', '육', '생', '어', '찜', '구이', '볶음', '튀김',
    '빵', '과자', '케이크', '아이스크림', '초콜릿',
    '차', '녹차', '홍차', '우유', '주스', '물', '생수',
    '사과', '배', '포도', '귤', '바나나', '수박', '딸기',
    '상차림', '밥상', '제수', '메', '잔', '접시', '그릇', '식기',
    '장사용품'
];

async function deleteRows() {
    const auth = new google.auth.GoogleAuth({ credentials: creds, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    // 시트1_사설 데이터 읽기
    console.log('데이터 읽는 중...');
    const data = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: '시트1_사설!A:Z'
    });

    const rows = data.data.values || [];
    const headers = rows[0];
    console.log('원본 행 수:', rows.length);

    // 필터링
    const filteredRows = [headers];
    let deletedCount = 0;

    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const rowText = row.join(' ').toLowerCase();

        let shouldDelete = false;
        for (const keyword of deleteKeywords) {
            if (rowText.includes(keyword.toLowerCase())) {
                shouldDelete = true;
                break;
            }
        }

        if (shouldDelete) {
            deletedCount++;
        } else {
            filteredRows.push(row);
        }
    }

    console.log('삭제된 행:', deletedCount);
    console.log('남은 행:', filteredRows.length - 1);

    // 시트 업데이트
    console.log('\n시트 업데이트 중...');
    await sheets.spreadsheets.values.clear({
        spreadsheetId: SPREADSHEET_ID,
        range: '시트1_사설!A:Z'
    });

    await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: '시트1_사설!A1',
        valueInputOption: 'RAW',
        resource: { values: filteredRows }
    });

    console.log('완료!');
}

deleteRows().catch(console.error);
