const { google } = require('googleapis');
const fs = require('fs');

const SPREADSHEET_ID = '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY';
const creds = JSON.parse(fs.readFileSync('data/구글 api/sonson-481412-0514ba9d773f.json', 'utf8'));

async function createSchemaSheet() {
    const auth = new google.auth.GoogleAuth({ credentials: creds, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    const sheetName = '📋_스키마_정의';

    // 시트 생성 시도
    try {
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: SPREADSHEET_ID,
            resource: { requests: [{ addSheet: { properties: { title: sheetName } } }] }
        });
        console.log('시트 생성됨');
    } catch (e) { console.log('시트 이미 존재'); }

    // 스키마 정의 데이터
    const data = [
        ['🔷 가격 항목 스키마 (PriceItem)'],
        [''],
        ['필드명', '타입', '필수', '설명', '예시'],
        ['id', 'string', 'O', '고유 ID', 'park-0001-price-001'],
        ['facilityId', 'string', 'O', '시설 ID', 'park-0001'],
        [''],
        ['--- 시설 정보 ---', '', '', '', ''],
        ['facilityType', 'enum', 'O', '시설 유형', '봉안당 | 봉안담 | 자연장지 | 화장시설 | 묘역시설'],
        ['category', 'string', 'O', '구분', '단장, 합장, 1인용, 가족장, VIP 등'],
        [''],
        ['--- 가격 조건 ---', '', '', '', ''],
        ['residency', 'enum', 'X', '거주 구분', '관내 | 관외 | null (구분없음)'],
        ['period', 'string', 'X', '사용 기간', '30년, 15년, 영구, null'],
        [''],
        ['--- 가격 정보 ---', '', '', '', ''],
        ['usageFee', 'number', 'O', '사용료 (원)', '450000'],
        ['managementFee', 'number', 'O', '관리비 (원)', '350000 (없으면 0)'],
        ['total', 'number', 'O', '합계 (원)', '800000'],
        [''],
        ['--- 메타 정보 ---', '', '', '', ''],
        ['source', 'enum', 'O', '데이터 출처', '조례 | e하늘 | 직접입력'],
        ['isPublic', 'boolean', 'O', '공설 여부', 'true | false'],
        ['lastUpdated', 'string', 'O', '마지막 수정', '2024-12-17'],
        ['ordinanceRef', 'string', 'X', '조례 참조 (공설만)', '강릉시 장사시설 조례 별표1'],
        [''],
        [''],
        ['🔷 공설 vs 사설 차이'],
        [''],
        ['항목', '공설 (Public)', '사설 (Private)'],
        ['residency', '관내/관외 구분 있음', '보통 없음'],
        ['period', '15년, 30년 명확', '영구, 50년 등 다양'],
        ['managementFee', '별도 명시', '포함되거나 별도'],
        ['source', '조례 (법적 기준)', '시설 자체 책정'],
        ['ordinanceRef', '있음', '없음'],
        [''],
        [''],
        ['🔷 우선순위 규칙'],
        [''],
        ['상황', '우선순위', '이유'],
        ['조례 vs e하늘', '조례 우선', '법적 기준'],
        ['조례 vs 직접입력', '직접입력 우선', '최신 확인'],
        ['e하늘 vs 직접입력', '직접입력 우선', '관리자 확인'],
        [''],
        [''],
        ['🔷 시설 유형 (facilityType)'],
        [''],
        ['코드', '한글', '설명'],
        ['봉안당', '봉안당', '실내 봉안 시설'],
        ['봉안담', '봉안담', '야외 봉안 시설 (벽면)'],
        ['자연장지', '자연장지', '수목장, 잔디장 등'],
        ['화장시설', '화장시설', '화장장'],
        ['묘역시설', '묘역시설', '분묘, 매장묘'],
    ];

    await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!A1:E60`,
        valueInputOption: 'RAW',
        resource: { values: data }
    });

    console.log('스키마 정의 시트 생성 완료!');
}

createSchemaSheet().catch(console.error);
