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

const PROMPT = `이 PDF는 낙원추모공원 가격표입니다.

**매장묘 관련 항목만 추출해주세요:**

다음 정보를 찾아주세요:
1. "개인 매장묘" 또는 "개인단" 관련 가격
2. "부부 매장묘" 또는 "합장" 관련 가격
3. 평형별 구분이 있다면 모두

**JSON 형식:**
{
  "burialGraves": [
    {
      "name": "항목명",
      "size": "평형 정보",
      "price": 숫자만,
      "description": "추가 설명"
    }
  ]
}

**주의:**
- 가격은 반드시 숫자만 (쉼표 제거)
- "부터~" 같은 텍스트는 description에`;

(async () => {
    const pdfPath = path.join(__dirname, '../archive/1.(재)낙원추모공원/1.(재)낙원추모공원_price_info.pdf');

    console.log('📄 낙원추모공원 PDF - 매장묘 가격 재분석...\n');

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

    console.log('=== 매장묘 가격 정보 ===\n');

    if (data.burialGraves) {
        data.burialGraves.forEach(item => {
            console.log(`📌 ${item.name}`);
            console.log(`   평형: ${item.size || '정보없음'}`);
            console.log(`   가격: ${item.price.toLocaleString()}원`);
            if (item.description) {
                console.log(`   설명: ${item.description}`);
            }
            console.log('');
        });
    }

    console.log('=== 끝 ===');

    // 결과 저장
    fs.writeFileSync(
        path.join(__dirname, '../nakwon_burial_prices.json'),
        JSON.stringify(data, null, 2)
    );
    console.log('\n💾 결과 저장: nakwon_burial_prices.json');

})();
