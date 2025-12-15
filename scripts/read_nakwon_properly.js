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

const PROMPT = `이 PDF는 한국 장사시설(공원묘지/봉안당) 가격표입니다.

**매우 중요한 요청:**
1. 표에 있는 **모든 행(row)**을 빠짐없이 추출하세요
2. 각 행의 컬럼 구조: [항목명] [세부사항] [가격] [수량] [선택]
3. 가격은 반드시 숫자만 추출 (쉼표 제거, 원 단위)
4. 세부사항이 비어있으면 빈 문자열 ""

**분류 규칙:**
- **시설사용료**: "사용료", "관리비" 등 기본 비용
- **세비스 항목**: "상석", "비석", "각자", "봉분" 등 석물/작업비
- 위 둘 다 아니면 "기타"

**JSON 형식:**
{
  "facilities": [
    {"name": "사용료", "detail": "1평당 기준", "price": 3000000},
    {"name": "관리비", "detail": "1평당/1년 기준", "price": 25000}
  ],
  "services": [
    {"name": "상석 2.3 세트", "detail": "고급석", "price": 800000},
    {"name": "상석 2.5 세트", "detail": "기와석, 고급석", "price": 1100000}
  ],
  "others": [
    {"name": "기타항목", "detail": "상세", "price": 0}
  ]
}

**주의:** 
- 헤더 행(항목명, 세부사항 등)은 제외
- 가격이 0이거나 없는 행도 포함
- 모든 행을 빠짐없이`;

(async () => {
    const pdfPath = path.join(__dirname, '../archive/1.(재)낙원추모공원/1.(재)낙원추모공원_price_info.pdf');

    console.log('📄 낙원추모공원 PDF 읽는 중...\n');

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

    console.log('=== 📋 낙원추모공원 가격표 ===\n');

    console.log('【 시설사용료 】');
    if (data.facilities) {
        data.facilities.forEach(item => {
            console.log(`  - ${item.name}`);
            console.log(`    세부: ${item.detail || '없음'}`);
            console.log(`    가격: ${item.price.toLocaleString()}원\n`);
        });
    }

    console.log('\n【 세비스 항목 (석물/작업비) 】');
    if (data.services) {
        data.services.forEach(item => {
            console.log(`  - ${item.name}`);
            console.log(`    세부: ${item.detail || '없음'}`);
            console.log(`    가격: ${item.price.toLocaleString()}원\n`);
        });
    }

    if (data.others && data.others.length > 0) {
        console.log('\n【 기타 】');
        data.others.forEach(item => {
            console.log(`  - ${item.name}: ${item.price.toLocaleString()}원`);
        });
    }

    console.log('\n=== 끝 ===');

    // 결과를 파일로 저장
    fs.writeFileSync(
        path.join(__dirname, '../nakwon_parsed.json'),
        JSON.stringify(data, null, 2)
    );
    console.log('\n💾 결과 저장: nakwon_parsed.json');

})();
