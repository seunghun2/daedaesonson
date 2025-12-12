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

// 5개 카테고리 정의
const CATEGORIES = {
    '기본비용': ['사용료', '관리비', '조경비'],
    '매장시설': ['매장', '묘지', '단장', '합장', '쌍분', '봉분'],
    '봉안시설': ['봉안', '납골', '평장', '봉안당', '봉안묘'],
    '석물_작업비': ['석물', '비석', '상석', '와비', '둘레석', '경계석', '작업비', '설치비', '개장', '수선'],
    '기타': []
};

const CATEGORY_DB_CODE = {
    '기본비용': 'base_cost',
    '매장시설': 'grave',
    '봉안시설': 'charnel_grave',
    '석물_작업비': 'other',
    '기타': 'other'
};

function categorizeItem(name, detail) {
    const combined = (name + ' ' + detail).toLowerCase();

    for (const [cat, keywords] of Object.entries(CATEGORIES)) {
        if (cat === '기타') continue;
        if (keywords.some(k => combined.includes(k.toLowerCase()))) {
            return cat;
        }
    }
    return '기타';
}

const PROMPT = `이 PDF는 한국 공원묘지 가격표입니다.

**모든 가격 항목을 추출하세요:**

{
  "items": [
    {
      "name": "항목명",
      "price": 숫자만,
      "detail": "세부정보"
    }
  ]
}

중요: 가격은 숫자만 (예: 3000000)`;

(async () => {
    console.log('=== 5개 카테고리로 1~10번 업데이트 ===\n');

    const facilities = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

    for (let num = 1; num <= 10; num++) {
        console.log(`\n${num}번 처리 중...`);

        // archive 폴더 찾기
        const folders = fs.readdirSync(ARCHIVE_DIR).filter(f => f.startsWith(`${num}.`));
        if (folders.length === 0) continue;

        const folderName = folders[0];
        const pdfPath = path.join(ARCHIVE_DIR, folderName, `${folderName}_price_info.pdf`);

        if (!fs.existsSync(pdfPath)) {
            console.log(`  ❌ PDF 없음`);
            continue;
        }

        // PDF 파싱
        const pdfData = fs.readFileSync(pdfPath);
        const base64Data = pdfData.toString('base64');

        const result = await model.generateContent([
            PROMPT,
            { inlineData: { data: base64Data, mimeType: "application/pdf" } }
        ]);

        const data = JSON.parse(result.response.text());

        // 5개 카테고리로 분류
        const categorized = {};
        Object.keys(CATEGORIES).forEach(cat => {
            categorized[cat] = {
                unit: '원',
                category: CATEGORY_DB_CODE[cat],
                rows: []
            };
        });

        data.items.forEach(item => {
            const cat = categorizeItem(item.name, item.detail || '');
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

        // 가격 범위 설정 (사용료만)
        let priceRange = { min: 100, max: 300 };
        if (categorized['기본비용']) {
            const usageFee = categorized['기본비용'].rows.find(r =>
                r.name === '사용료' || r.name.includes('사용료')
            );
            if (usageFee && usageFee.price > 100000) { // 10만원 이상만
                priceRange = {
                    min: Math.round(usageFee.price / 10000),
                    max: Math.round(usageFee.price / 10000)
                };
            }
        }

        // 적용
        facilities[num - 1].priceInfo = { priceTable: categorized };
        facilities[num - 1].priceRange = priceRange;

        console.log(`  ✅ ${facilities[num - 1].name}`);
        console.log(`     가격: ${priceRange.min}만원`);
        console.log(`     카테고리: ${Object.keys(categorized).length}개`);

        await new Promise(r => setTimeout(r, 3000));
    }

    // 저장
    fs.writeFileSync(DATA_FILE, JSON.stringify(facilities, null, 2));

    console.log('\n✅ 전체 완료!');
    console.log('브라우저 새로고침 후 확인하세요!');

})();
