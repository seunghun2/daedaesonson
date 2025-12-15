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

const PROMPT = `이 PDF는 한국 공원묘지 가격표입니다.

**모든 가격 항목을 정확히 추출하세요:**

각 항목마다:
1. 항목명
2. 가격 (숫자만)
3. 세부정보 (규격, 평형 등)

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
- 가격은 숫자만 (예: 3000000)
- "부터~" "이상" 같은 텍스트는 detail에
- 모든 행을 빠짐없이 추출`;

(async () => {
    const facilityNum = 2;
    const facilityName = '(재)실로암공원묘원';

    console.log(`=== ${facilityNum}. ${facilityName} PDF 파싱 ===\n`);

    const pdfPath = path.join(__dirname, `../archive/${facilityNum}.${facilityName}/${facilityNum}.${facilityName}_price_info.pdf`);

    if (!fs.existsSync(pdfPath)) {
        console.log(`❌ PDF 파일 없음: ${pdfPath}`);
        process.exit(1);
    }

    const pdfData = fs.readFileSync(pdfPath);
    const base64Data = pdfData.toString('base64');

    console.log('PDF 읽는 중...');

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

    console.log(`✅ ${data.items.length}개 항목 발견\n`);

    // 처음 5개 미리보기
    console.log('처음 5개 항목:');
    data.items.slice(0, 5).forEach(item => {
        console.log(`  - ${item.name}: ${item.price.toLocaleString()}원`);
    });

    // 저장
    const outputFile = path.join(__dirname, '../facility_2_parsed.json');
    fs.writeFileSync(outputFile, JSON.stringify(data, null, 2));

    console.log(`\n💾 저장: ${outputFile}`);

})();
