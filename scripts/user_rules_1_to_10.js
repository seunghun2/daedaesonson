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
    '매장묘': 'grave',
    '봉안묘': 'charnel_grave',
    '봉안당': 'charnel_house',
    '수목장': 'natural',
    '기타': 'other'
};

// 사용자 규칙 기반 분류
function categorizeByUserRules(name, detail) {
    const combined = (name + ' ' + (detail || '')).toLowerCase();

    // 2. 기본비용
    if ((combined.includes('묘지') && combined.includes('사용료')) ||
        combined.includes('관리비') ||
        combined.includes('환불') ||
        combined.includes('반환')) {
        return '기본비용';
    }

    // 3. 매장묘 (석물 + 작업비 포함)
    const burialKeywords = [
        '상석', '비석', '와비', '갓', '둘레석', '경계석', '묘테',
        '석관', '장대석', '망두석', '좌대', '북석',
        '매장', '봉분', '개장', '안치', '설치', '작업비', '용역비', '정리비'
    ];
    if (burialKeywords.some(k => combined.includes(k))) {
        return '매장묘';
    }

    // 5. 봉안당 (먼저 체크!)
    if (combined.includes('봉안당') || combined.includes('봉안담') ||
        combined.includes('개인단') || combined.includes('부부단') ||
        combined.includes('탑형')) {
        return '봉안당';
    }

    // 4. 봉안묘 (봉안당 제외)
    if (combined.includes('봉안')) {
        return '봉안묘';
    }

    // 6. 수목장
    if (combined.includes('수목') || combined.includes('정원형') ||
        combined.includes('자연장') || combined.includes('평장')) {
        return '수목장';
    }

    // 7. 기타
    return '기타';
}

// 평/㎡ 처리
function processSize(detail) {
    if (!detail) return null;

    // n평형 찾기
    const pyeongMatch = detail.match(/(\d+\.?\d*)평/);
    if (pyeongMatch) {
        return { value: parseFloat(pyeongMatch[1]), unit: '평' };
    }

    // ㎡ 찾기
    const sqmMatch = detail.match(/(\d+\.?\d*)㎡/);
    if (sqmMatch) {
        const sqm = parseFloat(sqmMatch[1]);
        return { value: Math.round(sqm / 3.3 * 10) / 10, unit: '평' };
    }

    return null;
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

- 가격은 숫자만`;

(async () => {
    console.log('=== 사용자 규칙 기반 1~10번 재처리 ===\n');

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

        // 0원 제거 (단, "제공"/"지원" 포함 시 기타로)
        const validItems = data.items.filter(item => {
            if (item.price && item.price > 0) return true;
            const combined = (item.name + ' ' + (item.detail || '')).toLowerCase();
            return combined.includes('제공') || combined.includes('지원');
        });

        // 분류
        const categorized = {};
        Object.keys(CATEGORY_DB_CODE).forEach(cat => {
            categorized[cat] = { unit: '원', category: CATEGORY_DB_CODE[cat], rows: [] };
        });

        validItems.forEach(item => {
            const cat = categorizeByUserRules(item.name, item.detail);
            const size = processSize(item.detail);

            categorized[cat].rows.push({
                name: item.name,
                price: item.price || 0,
                grade: item.detail || '',
                size: size ? `${size.value}${size.unit}` : ''
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
        { lat: 35.2281, lng: 128.6811 },
        { lat: 35.5384, lng: 129.3114 },
        { lat: 35.4589, lng: 129.1556 },
        { lat: 35.5384, lng: 129.3114 },
        { lat: 35.1797, lng: 128.1076 },
        { lat: 35.3350, lng: 129.0375 },
        { lat: 36.6820, lng: 126.8466 },
        { lat: 35.5384, lng: 129.3114 },
        { lat: 36.0355, lng: 128.2318 },
        { lat: 35.3350, lng: 129.0375 }
    ];
    coords.forEach((coord, idx) => {
        facilities[idx].coordinates = coord;
    });

    // 저장
    fs.writeFileSync(DATA_FILE, JSON.stringify(facilities, null, 2));

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ 사용자 규칙 기반 재처리 완료!');
    console.log('\n새로운 카테고리:');
    console.log('  1. 기본비용 (묘지사용료, 관리비 등)');
    console.log('  2. 매장묘 (석물 + 작업비 포함)');
    console.log('  3. 봉안묘 (봉안시설 - 봉안당 제외)');
    console.log('  4. 봉안당 (실내 봉안시설)');
    console.log('  5. 수목장 (자연장, 평장 등)');
    console.log('  6. 기타');
    console.log('\n브라우저 새로고침(Cmd+Shift+R) 하세요!');

})();
