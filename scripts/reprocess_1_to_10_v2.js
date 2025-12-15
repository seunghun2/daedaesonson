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

// 개선된 분류 함수
function categorizeItemV2(name, detail) {
    const combined = (name + ' ' + (detail || '')).toLowerCase();
    const trimmedName = name.trim().toLowerCase();

    // 1순위: 매장시설 (명확한 키워드)
    if (/단장|합장|쌍분|봉분|매장묘/.test(combined)) {
        // 하지만 "작업비"는 제외
        if (!combined.includes('작업비') && !combined.includes('설치비')) {
            return '매장시설';
        }
    }

    // 2순위: 봉안시설 (명확한 키워드)
    if (/봉안|납골|평장|회차|안치/.test(combined)) {
        if (!combined.includes('작업비') && !combined.includes('설치비')) {
            return '봉안시설';
        }
    }

    // 3순위: 기본비용 (엄격하게)
    // "묘지사용료", "시설사용료", "관리비" 등 (앞에 다른 단어 없음)
    if (/^(묘지)?사용료|^(묘지)?시설사용료|^(묘지)?관리비|^조경/.test(trimmedName)) {
        return '기본비용';
    }

    // 4순위: 석물/작업비
    if (/석물|비석|상석|와비|둘레석|경계석|작업비|설치비|개장|수선|화병|향로|월석|갓석|좌대/.test(combined)) {
        return '석물_작업비';
    }

    // 나머지
    return '기타';
}

// 운영형태 추론
function inferOperatorType(name) {
    if (name.includes('(재)') || name.includes('재단법인')) return 'FOUNDATION';
    if (name.includes('공설') || name.includes('군립') || name.includes('시립') || name.includes('구립')) return 'PUBLIC';
    return 'PRIVATE';
}

const PROMPT = `이 PDF는 한국 공원묘지 가격표입니다.

**중요: 모든 가격 항목과 시설 정보를 추출하세요**

{
  "facilityInfo": {
    "address": "전체 주소",
    "phone": "전화번호"
  },
  "items": [
    {
      "name": "항목명",
      "price": 숫자만,
      "detail": "세부정보"
    }
  ]
}

- 가격이 없거나 "별도", "문의"면 0으로
- 주소는 도/시/군/구까지 전부`;

(async () => {
    console.log('=== 개선된 로직으로 1~10번 재처리 ===\n');

    const facilities = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

    for (let num = 1; num <= 10; num++) {
        console.log(`\n━━━ ${num}번 처리 중 ━━━`);

        const folders = fs.readdirSync(ARCHIVE_DIR).filter(f => f.startsWith(`${num}.`));
        if (folders.length === 0) {
            console.log('  ❌ 폴더 없음\n');
            continue;
        }

        const folderName = folders[0];
        const facilityName = folderName.replace(/^\d+\./, '');
        const pdfPath = path.join(ARCHIVE_DIR, folderName, `${folderName}_price_info.pdf`);

        if (!fs.existsSync(pdfPath)) {
            console.log('  ❌ PDF 없음\n');
            continue;
        }

        console.log(`  시설: ${facilityName}`);

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
        console.log(`  파싱: ${data.items.length}개 → 유효: ${validItems.length}개`);

        // 5개 카테고리로 분류
        const categorized = {};
        Object.keys(CATEGORY_DB_CODE).forEach(cat => {
            categorized[cat] = {
                unit: '원',
                category: CATEGORY_DB_CODE[cat],
                rows: []
            };
        });

        validItems.forEach(item => {
            const cat = categorizeItemV2(item.name, item.detail);
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

        // 카테고리별 개수 출력
        console.log('  분류:');
        Object.keys(categorized).forEach(cat => {
            console.log(`    - ${cat}: ${categorized[cat].rows.length}개`);
        });

        // 가격 범위 (기본비용의 사용료만)
        let priceRange = { min: 100, max: 300 };
        if (categorized['기본비용']) {
            const usageFee = categorized['기본비용'].rows.find(r =>
                r.name.includes('사용료') && !r.name.includes('관리')
            );
            if (usageFee && usageFee.price >= 100000) {
                priceRange = {
                    min: Math.round(usageFee.price / 10000),
                    max: Math.round(usageFee.price / 10000)
                };
            }
        }

        // 운영형태
        const operatorType = inferOperatorType(facilityName);

        // 주소 업데이트 (PDF에서 추출한 게 있으면)
        let address = facilities[num - 1].address;
        if (data.facilityInfo && data.facilityInfo.address && data.facilityInfo.address.length > 10) {
            address = data.facilityInfo.address;
        }

        // 적용
        facilities[num - 1].name = facilityName;
        facilities[num - 1].originalName = folderName;
        facilities[num - 1].address = address;
        facilities[num - 1].operatorType = operatorType;
        facilities[num - 1].priceInfo = { priceTable: categorized };
        facilities[num - 1].priceRange = priceRange;

        console.log(`  ✅ 완료: ${priceRange.min}만원, ${operatorType}`);

        await new Promise(r => setTimeout(r, 3000));
    }

    // 저장
    fs.writeFileSync(DATA_FILE, JSON.stringify(facilities, null, 2));

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ 전체 재처리 완료!');
    console.log('\n주요 개선사항:');
    console.log('  1. ✅ 0원 항목 제거');
    console.log('  2. ✅ 기본비용 엄격하게 분류');
    console.log('  3. ✅ 운영형태 자동 설정');
    console.log('  4. ✅ 주소 업데이트 시도');
    console.log('\n브라우저 새로고침 후 확인하세요!');

})();
