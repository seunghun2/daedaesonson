const { google } = require('googleapis');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

// ENV 로드
['.env', '.env.local'].forEach(fileName => {
    const envPath = path.join(__dirname, '../', fileName);
    if (fs.existsSync(envPath)) {
        fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
            const [key, val] = line.split('=');
            if (key && val && !process.env[key.trim()]) {
                process.env[key.trim()] = val.trim().replace(/^["']|["']$/g, '');
            }
        });
    }
});

const CREDENTIALS_PATH = path.join(__dirname, '../data/구글 api/sonson-481412-701902a77d89.json');
const SPREADSHEET_ID = '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY';
const SHEET_NAME = '0000';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp",
    generationConfig: { responseMimeType: "application/json" }
});

const PROMPT = `너는 장례시설(공원묘지·추모공원) 가격표를
일반인이 이해할 수 있도록 구조화·정리하는 역할이다.

[1] 카테고리 (고정): 매장묘, 봉안당, 수목장, 옵션
※ 평장묘, 단장묘, 합장묘 → 모두 "매장묘"
※ 봉안묘, 봉안함, 봉안담, 납골 → 모두 "봉안당"
※ 석물, 비석, 상석, 묘테, 각자비, 작업비 → 전부 "옵션"

[2] 포함: 묘지 사용료, 관리비, 봉안, 수목장, 석물(옵션)
[3] 제외: 시설명, 주소, 전화번호, 장례용품, 장례서비스
[4] 상품명: 일반인이 이해 가능한 표현 (내부 코드/층수/단수 제외)
[5] 설명: 묘지 사용료="1평(3.3㎡) 기준 묘지 사용료", 관리비="1평당 연간 관리비", 단수 있으면 설명에 추가

[6] 출력 형식 (JSON):
{
  "items": [
    { "category": "매장묘", "itemName": "개인묘", "description": "1평(3.3㎡) 기준 묘지 사용료", "price": 5000000 }
  ]
}

[7] 정렬: 매장묘 → 봉안당 → 수목장 → 옵션, 각 카테고리 내 관리비는 맨 뒤
PDF를 "사람이 보는 가격표"로 짧고 명확하게 정리하라.`;

// 처리할 시설 목록
const FACILITIES = [
    { num: 28, name: '(재)화신공원묘원' },
    { num: 37, name: '(재)지평선전북공원묘원(묘지)' },
    { num: 38, name: '(재)진달래문화재단' },
    { num: 41, name: '(재)자하연포천(묘지)' },
    { num: 45, name: '충주공원묘원' },
    { num: 49, name: '천주교혜화동성당 포천묘원' },
    { num: 50, name: '광주공원묘원' },
    { num: 58, name: '(재)경주공원묘원' },
    { num: 65, name: '(재)광주구천주교공원묘원' }
];

// 카테고리 정렬
const CATEGORY_ORDER = { '매장묘': 1, '봉안당': 2, '수목장': 3, '옵션': 4 };

function sortByCategory(rows) {
    return rows.sort((a, b) => {
        const orderA = CATEGORY_ORDER[a[4]] || 99;
        const orderB = CATEGORY_ORDER[b[4]] || 99;
        if (orderA !== orderB) return orderA - orderB;

        const isManageA = (a[5] || '').includes('관리비');
        const isManageB = (b[5] || '').includes('관리비');
        if (isManageA && !isManageB) return 1;
        if (!isManageA && isManageB) return -1;
        return 0;
    });
}

async function processFacility(facility, startRow, sheets) {
    const { num, name } = facility;
    const facilityId = `park-${String(num).padStart(4, '0')}`;
    const pdfPath = path.join(__dirname, `../archive5/${num}.${name}_price_info.pdf`);

    console.log(`\n${'='.repeat(50)}`);
    console.log(`📄 [${num}] ${name}`);

    if (!fs.existsSync(pdfPath)) {
        console.log(`   ❌ PDF 없음: ${pdfPath}`);
        return { success: false, rows: 0 };
    }

    try {
        // PDF 분석
        const pdfData = fs.readFileSync(pdfPath);
        const base64Data = pdfData.toString('base64');

        const result = await model.generateContent([
            PROMPT,
            { inlineData: { data: base64Data, mimeType: "application/pdf" } }
        ]);

        const data = JSON.parse(result.response.text());
        console.log(`   ✅ 분석 완료: ${data.items?.length || 0}개 항목`);

        if (!data.items || data.items.length === 0) {
            console.log(`   ⚠️ 항목 없음`);
            return { success: false, rows: 0 };
        }

        // 시트 데이터 형식으로 변환
        let sheetRows = data.items.map(item => [
            facilityId,
            name,
            '공원묘지',
            '사설',
            item.category || '매장묘',
            item.itemName || '',
            item.description || '',
            String(item.price || 0),
            ''
        ]);

        // 카테고리별 정렬
        sheetRows = sortByCategory(sheetRows);

        // 시트에 삽입
        const range = `${SHEET_NAME}!A${startRow}:I${startRow + sheetRows.length - 1}`;

        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: range,
            valueInputOption: 'RAW',
            resource: { values: sheetRows }
        });

        console.log(`   📝 삽입: ${startRow}~${startRow + sheetRows.length - 1}행 (${sheetRows.length}개)`);

        // Rate limit
        await new Promise(r => setTimeout(r, 3000));

        return { success: true, rows: sheetRows.length };

    } catch (e) {
        console.log(`   ❌ 에러: ${e.message}`);
        return { success: false, rows: 0 };
    }
}

async function main() {
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
    const auth = new google.auth.GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() });

    console.log('🚀 배치 처리 시작!\n');
    console.log(`처리할 시설: ${FACILITIES.length}개`);

    // 0022가 213번 줄에서 끝났으므로 214부터 시작
    let currentRow = 214;
    let successCount = 0;

    for (const facility of FACILITIES) {
        const result = await processFacility(facility, currentRow, sheets);
        if (result.success) {
            successCount++;
            currentRow += result.rows;
        }
    }

    console.log(`\n${'='.repeat(50)}`);
    console.log(`✅ 완료! ${successCount}/${FACILITIES.length}개 시설 처리됨`);
    console.log(`최종 행: ${currentRow - 1}`);
}

main().catch(e => console.error('Error:', e.message));
