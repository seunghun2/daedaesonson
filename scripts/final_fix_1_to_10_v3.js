const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// ENV Loader
['.env', '.env.local'].forEach(fileName => {
    const envPath = path.join(__dirname, '../', fileName);
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf-8');
        envConfig.split('\n').forEach(line => {
            const [key, val] = line.split('=');
            if (key && val && !process.env[key.trim()]) {
                process.env[key.trim()] = val.trim().replace(/^["']|["']$/g, '');
            }
        });
    }
});

const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp",
    generationConfig: { responseMimeType: "application/json" }
});

const DATA_FILE = path.join(__dirname, '../data/facilities.json');
const ARCHIVE_DIR = path.join(__dirname, '../archive');

const CATEGORY_DB_CODE = {
    '기본비용': 'base_cost',
    '매장시설': 'grave',
    '봉안시설': 'charnel_grave',
    '석물_작업비': 'other',
    '기타': 'other'
};

// V3 개선된 분류 로직 (엄격한 규칙)
function categorizeItemV3(name, detail) {
    const combined = (name + ' ' + (detail || '')).toLowerCase();
    const trimmedName = name.trim();

    // ━━━ 1순위: 석물 (절대 우선!) ━━━
    const stoneKeywords = ['석물', '상석', '비석', '와비', '둘레석', '경계석',
        '화병', '향로', '월석', '갓석', '좌대', '북석', '혼유'];
    if (stoneKeywords.some(k => combined.includes(k))) {
        return '석물_작업비';
    }

    // ━━━ 2순위: 작업비 ━━━
    if (/작업비|설치비|개장|수선/.test(combined)) {
        return '석물_작업비';
    }

    // ━━━ 3순위: 시설 타입 명시 ━━━
    // 매장 관련
    if (/매장묘|단장묘|합장묘|쌍분|봉분/.test(combined)) {
        return '매장시설';
    }

    // 봉안 관련
    if (/봉안묘|봉안당|평장|납골|안치|회차/.test(combined)) {
        return '봉안시설';
    }

    // ━━━ 4순위: 기본비용 (엄격!) ━━━
    // 시설 타입 없는 순수 사용료/관리비만
    const basicPatterns = [
        /^묘지사용료$/i,
        /^사용료$/i,
        /^시설사용료$/i,
        /^관리비$/i,
        /^묘지관리비$/i,
        /^조경비$/i
    ];

    if (basicPatterns.some(p => p.test(trimmedName))) {
        return '기본비용';
    }

    // ━━━ 나머지 ━━━
    return '기타';
}

function inferOperatorType(name) {
    if (name.includes('(재)') || name.includes('재단법인')) return 'FOUNDATION';
    if (name.includes('공설') || name.includes('군립') || name.includes('시립')) return 'PUBLIC';
    return 'PRIVATE';
}

const PROMPT = `이 PDF는 한국 공원묘지 가격표입니다.

모든 가격 항목을 추출하세요:

{
  "items": [
    {
      "name": "항목명",
      "price": 숫자만,
      "detail": "세부정보"
    }
  ]
}

- 가격은 숫자만 (예: 3000000)
- 가격 없으면 0`;

(async () => {
    console.log('=== V3 엄격한 규칙으로 1~10번 재처리 ===\n');

    const facilities = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

    for (let num = 1; num <= 10; num++) {
        console.log(`━━━ ${num}번 처리 ━━━`);

        const folders = fs.readdirSync(ARCHIVE_DIR).filter(f => f.startsWith(`${num}.`));
        if (folders.length === 0) continue;

        const folderName = folders[0];
        const pdfPath = path.join(ARCHIVE_DIR, folderName, `${folderName}_price_info.pdf`);

        if (!fs.existsSync(pdfPath)) {
            console.log('  ❌ PDF 없음\n');
            continue;
        }

        console.log(`  ${folderName.replace(/^\d+\./, '')}`);

        // PDF 파싱
        const pdfData = fs.readFileSync(pdfPath);
        const base64Data = pdfData.toString('base64');

        const result = await model.generateContent([
            PROMPT,
            { inlineData: { data: base64Data, mimeType: "application/pdf" } }
        ]);

        const data = JSON.parse(result.response.text());

        // 0원 제거
        const validItems = data.items.filter(item => item.price && item.price > 0);

        // 분류
        const categorized = {};
        Object.keys(CATEGORY_DB_CODE).forEach(cat => {
            categorized[cat] = { unit: '원', category: CATEGORY_DB_CODE[cat], rows: [] };
        });

        validItems.forEach(item => {
            const cat = categorizeItemV3(item.name, item.detail);
            categorized[cat].rows.push({
                name: item.name,
                price: item.price,
                grade: item.detail || ''
            });
        });

        // 빈 카테고리 제거
        Object.keys(categorized).forEach(cat => {
            if (categorized[cat].rows.length === 0) {
                delete categorized[cat];
            }
        });

        // 분류 결과 출력
        console.log('  분류:');
        Object.keys(categorized).forEach(cat => {
            console.log(`    ${cat}: ${categorized[cat].rows.length}개`);
        });

        // 적용
        const facilityName = folderName.replace(/^\d+\./, '');
        facilities[num - 1].name = facilityName;
        facilities[num - 1].originalName = folderName;
        facilities[num - 1].operatorType = inferOperatorType(facilityName);
        facilities[num - 1].priceInfo = { priceTable: categorized };

        console.log(`  ✅ 완료\n`);

        await new Promise(r => setTimeout(r, 3000));
    }

    // 정확한 가격 설정
    const prices = [300, 216, 160, 495, 85, 107, 142, 120, 150, 140];
    prices.forEach((price, idx) => {
        facilities[idx].priceRange = { min: price, max: price };
    });

    // 좌표 설정
    const coords = [
        { lat: 35.2281, lng: 128.6811 }, // 1. 낙원 (김해)
        { lat: 35.5384, lng: 129.3114 }, // 2. 실로암 (울산)
        { lat: 35.4589, lng: 129.1556 }, // 3. 삼덕 (울산 울주)
        { lat: 35.5384, lng: 129.3114 }, // 4. 울산
        { lat: 35.1797, lng: 128.1076 }, // 5. 진주
        { lat: 35.3350, lng: 129.0375 }, // 6. 신불산 (양산)
        { lat: 36.6820, lng: 126.8466 }, // 7. 예산
        { lat: 35.5384, lng: 129.3114 }, // 8. 대지 (울산)
        { lat: 36.0355, lng: 128.2318 }, // 9. 선산 (구미)
        { lat: 35.3350, lng: 129.0375 }  // 10. 솥발산 (양산)
    ];
    coords.forEach((coord, idx) => {
        facilities[idx].coordinates = coord;
    });

    // 저장
    fs.writeFileSync(DATA_FILE, JSON.stringify(facilities, null, 2));

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ V3 재처리 완료!');
    console.log('\n개선 사항:');
    console.log('  1. ✅ 석물 절대 우선 분류');
    console.log('  2. ✅ 기본비용 엄격하게 제한');
    console.log('  3. ✅ 시설 타입 우선 체크');
    console.log('  4. ✅ 정확한 가격 적용');
    console.log('  5. ✅ 좌표 설정');
    console.log('\n브라우저 새로고침(Cmd+Shift+R) 하세요!');

})();
