const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

// Google Sheet ID
const SHEET_ID = '1mBEC8i1jPMxVs5jNp-st_4c3MsWMPu90hU2KeUcSlyE';
const CREDENTIALS_FILE = 'credentials.json';

// 필터링 키워드
const EXCLUDE_KEYWORDS = [
    '유골함', '수의', '관', '횡대', '결관', '명정', '위패', '성경책',
    '화병', '향로', '독서대', '사진', '메탈포토', '액자', '꽃', '조화', '화분', '식재', '나무', '철쭉',
    '잔디',
    '천막', '식사', '식당', '밥',
    '안치단', '제례', '개토제', '산신제', '위령제',
    '반혼제', '평토제', '성분제', '의전', '상조', '리무진', '버스',
    '엠뷸런스', '운구', '접객', '도우미', '벌초', '성묘', '대행', '제사', '차례', '예초', '전지',
    '작업비', '설치비', '개장', '수선', '이장', '파묘', '화장',
    '봉분', '리모델링', '토목', '공사', '각자', '글자', '철거', '운반',
    '상석', '비석', '와비', '둘레석', '묘테', '경계석', '석관', '석곽', '석실',
    '월석', '표석', '가족표석', '부부표석', '갓', '좌대', '판석', '석등', '걸방석', '구판',
    '만족도', '배너', '개인정보', '보건복지부', '장례문화진흥원', 'Copyright',
    '로그인', '회원가입', '원격지원', '화장예약', '선택한 상품', '궁금한게',
    '하늘e', '눌러주세요', '닫기', '열기', '지도', '길찾기', '공유', '금액',
    '품명', '규격', '재질', '원산지', '생산지',
    '담장형 월석'
];

async function updateGoogleSheet() {
    try {
        // 1. Load Credentials
        if (!fs.existsSync(CREDENTIALS_FILE)) {
            console.error('❌ credentials.json not found!');
            return;
        }
        const creds = JSON.parse(fs.readFileSync(CREDENTIALS_FILE));

        // 2. Load Excel Data (Nakwon Only)
        console.log('Reading Excel file...');
        const workbook = xlsx.readFile('park_price_master.xlsx');
        const priceRows = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

        const targetName = '(재)낙원추모공원';
        const rawItems = priceRows.filter(row => row.FacilityName === targetName);

        if (rawItems.length === 0) {
            console.error('No data found for Nakwon Memorial Park.');
            return;
        }

        // 3. Filter Data
        const refinedData = [];
        // Header row
        refinedData.push(['시설명', '제목', '설명', '가격']);

        rawItems.forEach(item => {
            let text = (item.ExtractedName + ' ' + (item.RawLine || '')).toLowerCase();
            if (!item.ExtractedName || item.ExtractedName.trim() === '') return;

            // 관리비는 무조건 포함
            if (text.includes('관리비')) {
                refinedData.push([targetName, item.ExtractedName, item.RawLine, item.ExtractedPrice]);
                return;
            }

            let isExcluded = false;
            for (const keyword of EXCLUDE_KEYWORDS) {
                if (text.includes(keyword)) {
                    isExcluded = true;
                    break;
                }
            }

            if (!isExcluded) {
                refinedData.push([targetName, item.ExtractedName, item.RawLine, item.ExtractedPrice]);
            }
        });

        console.log(`Filtered items: ${refinedData.length - 1} (out of ${rawItems.length})`);

        // 4. Update Google Sheet
        const auth = new JWT({
            email: creds.client_email,
            key: creds.private_key,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const doc = new GoogleSpreadsheet(SHEET_ID, auth);
        await doc.loadInfo();

        console.log(`Connected to Sheet: ${doc.title}`);

        let sheet = doc.sheetsByTitle['data_on'];
        if (!sheet) {
            console.log('Creating new sheet: data_on');
            sheet = await doc.addSheet({ title: 'data_on' });
        } else {
            console.log('Found existing sheet: data_on. Clearing...');
            await sheet.clear();
        }

        // Write headers and data
        await sheet.setHeaderRow(refinedData[0]);
        await sheet.addRows(refinedData.slice(1).map(row => ({
            '시설명': row[0],
            '제목': row[1],
            '설명': row[2],
            '가격': row[3]
        })));

        console.log('✅ Google Sheet updated successfully!');

    } catch (e) {
        console.error('Error updating Google Sheet:', e);
    }
}

updateGoogleSheet();
