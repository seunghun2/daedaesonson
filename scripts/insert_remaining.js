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

const PROMPT = `너는 장례시설 가격표를 정리하는 역할이다.
[1] 카테고리: 매장묘, 봉안당, 수목장, 옵션
[2] 포함: 묘지 사용료, 관리비, 봉안, 수목장, 석물(옵션)
[3] 제외: 시설명, 주소, 전화번호, 장례용품, 장례서비스
[4] 상품명: 일반인이 이해 가능한 표현
[5] 설명: 묘지 사용료="1평(3.3㎡) 기준 묘지 사용료", 관리비="1평당 연간 관리비"
[6] JSON: { "items": [{ "category": "", "itemName": "", "description": "", "price": 0 }] }
[7] 정렬: 매장묘 → 봉안당 → 수목장 → 옵션`;

// 남은 시설 목록
const FACILITIES = [
    { num: 216, name: '천주교부산교구 하늘공원', row: 563 },
    { num: 227, name: '김포공원법인묘지(대곶)', row: 566 },
    { num: 228, name: '김포공원법인묘지(풍무)', row: 567 },
    { num: 270, name: '가톨릭 범물공원묘원', row: 580 },
    { num: 285, name: '천주교성환공원묘지', row: 581 },
    { num: 290, name: '대전공원묘원', row: 582 },
    { num: 341, name: '하늘의문(마전동)', row: 596 },
    { num: 352, name: '하늘의문(당하동)', row: 597 },
    { num: 354, name: '혜화동성당 도봉동묘원', row: 598 },
    { num: 371, name: '부활동산종교재단법인', row: 600 },
    { num: 391, name: '천주교나주성당공원묘지', row: 601 },
    { num: 431, name: '서산시희망공원(묘지)', row: 603 },
    { num: 436, name: '예수장로회 제주교회묘지', row: 604 },
    { num: 440, name: '(재)분당메모리얼파크', row: 609 },
    { num: 442, name: '(재)전주공원묘원', row: 611 },
    { num: 446, name: '조수천주교묘지', row: 615 },
    { num: 449, name: '제주향교묘지', row: 619 },
    { num: 454, name: '천주교제주교구묘지', row: 624 },
    { num: 456, name: '포항공원묘원', row: 626 },
    { num: 457, name: '천주교용호동공원묘지', row: 627 },
    { num: 458, name: '모슬포 천주교공동묘지', row: 628 },
    { num: 459, name: '모슬포교회 공동묘지', row: 629 },
    { num: 460, name: '천주교산내공원묘원', row: 630 },
    { num: 461, name: '천주교 창원공원묘원', row: 631 },
    { num: 462, name: '천주교가덕공원묘지', row: 632 },
    { num: 463, name: '신동아교회묘지', row: 633 },
    { num: 470, name: '충주천주교회 성요셉공원묘원', row: 646 },
    { num: 481, name: '김포성당 매괴의모후 묘원', row: 651 },
    { num: 491, name: '천주교 김천공원묘지', row: 657 }
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
        await new Promise(r => setTimeout(r, 2000));
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

    console.log(`🚀 남은 ${FACILITIES.length}개 시설 처리 시작!`);

    let success = 0;
    for (const f of FACILITIES) {
        const result = await processFacility(f, sheets);
        if (result.success) success++;
    }

    console.log(`\n✅ 완료! ${success}/${FACILITIES.length}개 성공`);
}

main().catch(e => console.error('Error:', e.message));
