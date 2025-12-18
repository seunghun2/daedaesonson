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

const FACILITIES = [
    { num: 511, name: '해인사 고불암무량수전', row: 825 },
    { num: 512, name: '재단법인 일산장안추모공원', row: 826 },
    { num: 513, name: '대한불교관음회조계종 백천사 봉안당', row: 827 },
    { num: 514, name: '(재)성산공원 추모관', row: 828 },
    { num: 515, name: '에덴추모공원', row: 829 },
    { num: 517, name: '파주추모공원 봉안당', row: 905 },
    { num: 518, name: '(재)유명추모공원', row: 906 },
    { num: 519, name: '양평추모공원 더포레', row: 907 },
    { num: 520, name: '수불사추모공원', row: 908 },
    { num: 522, name: '연천동막골추모관', row: 952 },
    { num: 523, name: '대덕스카이캐슬 추모관', row: 953 },
    { num: 524, name: '마라나타하늘정원', row: 954 },
    { num: 525, name: '천국의계단추모관(재단법인천국)', row: 955 },
    { num: 527, name: '중앙추모공원(재단법인 현) 봉안시설', row: 998 },
    { num: 533, name: '크리스찬메모리얼파크', row: 1163 },
    { num: 534, name: '신불산추모공원 납골당', row: 1164 },
    { num: 537, name: '재단법인조안공원양주지사', row: 1201 },
    { num: 538, name: '약사사지장전추모관', row: 1202 },
    { num: 539, name: '(재)법화세계추모관', row: 1203 },
    { num: 540, name: '유토피아추모공원(헤리티지관)', row: 1204 },
    { num: 541, name: '영모묘원 대원전', row: 1205 },
    { num: 543, name: '메모리얼펠리스추모관(실로암)', row: 1206 },
    { num: 545, name: '(재)평화공원 파라다이스 추모관', row: 1207 },
    { num: 546, name: '유토피아추모관', row: 1208 },
    { num: 548, name: '천주교 비봉추모관', row: 1210 },
    { num: 549, name: '천주교 서울대교구 평화묘원 봉안묘', row: 1211 },
    { num: 550, name: '생극추모공원', row: 1212 },
    { num: 551, name: '하늘소망추모관', row: 1213 },
    { num: 552, name: '대한불교조계종 삼봉사 봉안당', row: 1214 },
    { num: 553, name: '천주교안성추모공원(봉안)', row: 1215 },
    { num: 554, name: '아산메모리얼파크 휴온 봉안당', row: 1216 },
    { num: 555, name: '청통추모관', row: 1217 },
    { num: 559, name: '극락사추모공원', row: 1243 },
    { num: 560, name: '(재)분당메모리얼파크', row: 1244 },
    { num: 566, name: '녹야원추모관', row: 1303 },
    { num: 567, name: '(재)한국SGI이천평화공원', row: 1304 },
    { num: 568, name: '상상추모공원', row: 1305 },
    { num: 569, name: '양주추모공원', row: 1306 },
    { num: 570, name: '(재)한국SGI청도평화공원', row: 1307 },
    { num: 571, name: '약사사 하늘재추모원 ', row: 1308 },
    { num: 572, name: '천주교 금상동성당 하늘자리', row: 1309 },
    { num: 577, name: '삼우추모공원', row: 1359 },
    { num: 578, name: '예진추모관', row: 1360 },
    { num: 580, name: '용미리건물식추모의집', row: 1369 },
    { num: 590, name: '천주교안동교구 봉안경당', row: 1439 },
    { num: 593, name: '예원추모관', row: 1466 },
    { num: 595, name: '천주교용인공원묘원(봉안)', row: 1481 },
    { num: 598, name: '전통사찰95호 동도사', row: 1498 },
    { num: 600, name: '대국사', row: 1515 },
    { num: 602, name: '대한불교조계종관음사', row: 1532 },
    { num: 603, name: '석예정사', row: 1533 },
    { num: 606, name: '양산 석굴암 극락전 추모관', row: 1560 },
    { num: 609, name: '천주교하늘공원 봉안당', row: 1578 },
    { num: 610, name: '추모공원 하늘문', row: 1579 },
    { num: 614, name: '일산푸른솔추모공원', row: 1580 },
    { num: 616, name: '(재)지평선전북공원묘원(봉안)', row: 1581 },
    { num: 619, name: '흥륜사정토원', row: 1599 },
    { num: 620, name: '(주)청아공원', row: 1600 },
    { num: 622, name: '강촌추모원', row: 1611 },
    { num: 625, name: '학천사추모관', row: 1631 },
    { num: 628, name: '봉안당 홈', row: 1632 },
    { num: 629, name: '(재)안동추모공원(봉안당)', row: 1639 },
    { num: 631, name: '(재)여주세종추모공원 봉안당', row: 1645 },
    { num: 633, name: '월봉사연화원', row: 1656 },
    { num: 634, name: '대한불교염불선종운수사사홍선원', row: 1657 },
    { num: 639, name: '효자추모관', row: 1677 },
    { num: 640, name: '쌍용사 봉안당', row: 1678 },
    { num: 641, name: '오향중흥교회 봉안당', row: 1679 },
    { num: 649, name: '용주사 봉안당', row: 1707 },
    { num: 651, name: '감로복지원 진주추모공원', row: 1708 },
    { num: 652, name: '재단법인 통일로추모공원', row: 1709 },
    { num: 653, name: '창원공원묘원 봉안시설', row: 1710 },
    { num: 654, name: '생극납골공원', row: 1711 },
    { num: 655, name: '효심추모관', row: 1712 },
    { num: 656, name: '재단법인청림공원(봉안탑)', row: 1713 }
];

async function processFacility(facility, sheets) {
    const { num, name, row } = facility;
    const facilityId = `park-${String(num).padStart(4, '0')}`;
    const pdfPath = path.join(__dirname, `../archive5/${num}.${name}_price_info.pdf`);

    process.stdout.write(`[${num}] ${name.substring(0, 15)}... `);

    if (!fs.existsSync(pdfPath)) {
        console.log('❌ PDF없음');
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
            console.log('⚠️ 항목없음');
            return { success: false };
        }

        const sheetRows = data.items.map(item => [
            facilityId, name, '봉안당', '사설',
            item.category || '봉안당', item.itemName || '', item.description || '',
            String(item.price || 0), ''
        ]);

        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!A${row}:I${row + sheetRows.length - 1}`,
            valueInputOption: 'RAW',
            resource: { values: sheetRows }
        });

        console.log(`✅ ${sheetRows.length}개`);
        return { success: true };

    } catch (e) {
        console.log(`❌ ${e.message.substring(0, 30)}`);
        return { success: false };
    }
}

async function main() {
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
    const auth = new google.auth.GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() });

    // 511은 이미 했으므로 제외
    const remaining = FACILITIES.filter(f => f.num !== 511);

    console.log(`🚀 ${remaining.length}개 시설 처리 (5~12초 랜덤 간격)\n`);

    let success = 0;
    for (let i = 0; i < remaining.length; i++) {
        const result = await processFacility(remaining[i], sheets);
        if (result.success) success++;

        if (i < remaining.length - 1) {
            const delay = 5000 + Math.random() * 7000; // 5~12초 랜덤
            await new Promise(r => setTimeout(r, delay));
        }

        // 10개마다 진행상황 출력
        if ((i + 1) % 10 === 0) {
            console.log(`--- ${i + 1}/${remaining.length} 완료 (${success}개 성공) ---\n`);
        }
    }

    console.log(`\n✅ 완료! ${success}/${remaining.length}개 성공`);
}

main().catch(e => console.error('Error:', e.message));
