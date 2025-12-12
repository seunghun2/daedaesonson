const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

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

const PROMPT = `이 PDF는 낙원추모공원 가격표입니다.

**모든 가격 항목을 정확히 추출하세요.**

각 항목마다:
1. 정확한 항목명
2. 가격 (숫자만, "부터~" 같은 텍스트 제외)
3. 세부사항 (평형, 규격 등)

**JSON 형식:**
{
  "items": [
    {
      "name": "항목명",
      "price": 숫자만,
      "detail": "세부정보"
    }
  ]
}

**중요:**
- 가격은 반드시 숫자만 (예: 20275000)
- "20,275,000원" → 20275000
- "부터~" 같은 텍스트는 detail에
- 모든 행을 빠짐없이`;

(async () => {
    const pdfPath = path.join(__dirname, '../archive/1.(재)낙원추모공원/1.(재)낙원추모공원_price_info.pdf');

    console.log('📄 낙원추모공원 전체 가격표 재점검...\n');

    const pdfData = fs.readFileSync(pdfPath);
    const base64Data = pdfData.toString('base64');

    const result = await model.generateContent([
        PROMPT,
        {
            inlineData: {
                data: base64Data,
                mimeType: "application/pdf"
            }
        }
    ]);

    const responseText = result.response.text();
    const data = JSON.parse(responseText);

    console.log(`총 ${data.items.length}개 항목 발견\n`);
    console.log('=== 주요 가격 확인 ===\n');

    // 주요 항목 필터링
    const keywords = ['개인 매장', '부부 매장', '프리미엄', '평장', '1단형', '봉분'];

    data.items.forEach(item => {
        if (keywords.some(k => item.name.includes(k))) {
            console.log(`${item.name}`);
            console.log(`  가격: ${item.price.toLocaleString()}원`);
            if (item.detail) console.log(`  설명: ${item.detail}`);
            console.log('');
        }
    });

    // 전체 저장
    fs.writeFileSync(
        path.join(__dirname, '../nakwon_full_prices.json'),
        JSON.stringify(data, null, 2)
    );

    console.log('💾 전체 결과: nakwon_full_prices.json');

    // facilities.json 업데이트 준비
    console.log('\n다음 단계: 이 데이터로 facilities.json을 업데이트할까요?');

})();
