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
    model: "gemini-2.0-flash",
    generationConfig: { responseMimeType: "application/json" }
});

const PROMPT = `너는 장례시설 가격표를 정리하는 역할이다.
[1] 카테고리: 매장묘, 봉안당, 수목장, 옵션
[2] 포함: 묘지 사용료, 관리비, 봉안, 수목장, 석물(옵션)
[3] 제외: 시설명, 주소, 전화번호, 장례용품, 장례서비스
[4] 상품명: 일반인이 이해 가능한 표현
[5] 설명: 묘지 사용료="1평(3.3㎡) 기준 묘지 사용료", 관리비="1평당 연간 관리비"
[6] JSON: { "items": [{ "category": "", "itemName": "", "description": "", "price": 0 }] }
[7] 정렬: 매장묘 → 봉안당 → 수목장 → 옵션`;

// 실패한 시설들 (Rate Limit)
const FACILITIES = [
    { num: 442, name: '(재)전주공원묘원', row: 611 },
    { num: 446, name: '조수천주교묘지', row: 615 },
    { num: 449, name: '제주향교묘지', row: 619 },
    { num: 454, name: '천주교제주교구묘지', row: 624 },
    { num: 456, name: '포항공원묘원', row: 626 },
    { num: 457, name: '천주교용호동공원묘지', row: 627 },
    { num: 458, name: '모슬포 천주교공동묘지', row: 628 },
    { num: 459, name: '모슬포교회 공동묘지', row: 629 },
    { num: 460, name: '천주교산내공원묘원', row: 630 },
    { num: 461, name: '천주교 창원공원묘원', row: 631 }
];

async function processFacility(facility, sheets) {
    const { num, name, row } = facility;
    const facilityId = `park-${String(num).padStart(4, '0')}`;
    const pdfPath = path.join(__dirname, `../archive5/${num}.${name}_price_info.pdf`);

    console.log(`\n[${num}] ${name} (${row}줄)`);

    if (!fs.existsSync(pdfPath)) {
        console.log(`   ❌ PDF 없음`);
        return { success: false };
    }

    try {
        const pdfData = fs.readFileSync(pdfPath);
        const base64Data = pdfData.toString('base64');

        const result = await model.generateContent([
            PROMPT,
            { inlineData: { data: base64Data, mimeType: "application/pdf" } }
        ]);

        const data = JSON.parse(result.response.text());

        if (!data.items || data.items.length === 0) {
            console.log(`   ⚠️ 항목 없음`);
            return { success: false };
        }

        const sheetRows = data.items.map(item => [
            facilityId, name, '공원묘지', '사설',
            item.category || '매장묘', item.itemName || '', item.description || '',
            String(item.price || 0), ''
        ]);

        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!A${row}:I${row + sheetRows.length - 1}`,
            valueInputOption: 'RAW',
            resource: { values: sheetRows }
        });

        console.log(`   ✅ ${sheetRows.length}개 삽입`);
        return { success: true };

    } catch (e) {
        console.log(`   ❌ 에러: ${e.message}`);
        return { success: false };
    }
}

async function main() {
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
    const auth = new google.auth.GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() });

    console.log(`🚀 ${FACILITIES.length}개 시설 천천히 처리 (7초 간격)`);

    let success = 0;
    for (let i = 0; i < FACILITIES.length; i++) {
        const result = await processFacility(FACILITIES[i], sheets);
        if (result.success) success++;

        // 마지막이 아니면 7초 대기
        if (i < FACILITIES.length - 1) {
            console.log(`   ⏳ 7초 대기...`);
            await new Promise(r => setTimeout(r, 7000));
        }
    }

    console.log(`\n✅ 완료! ${success}/${FACILITIES.length}개 성공`);
}

main().catch(e => console.error('Error:', e.message));
