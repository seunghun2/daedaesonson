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

**중요 가격 정보만 추출하세요:**

1. 사용료 (묘지사용료)
2. 관리비
3. 주요 상품 (매장묘, 봉안묘 등)

**JSON 형식:**
{
  "usageFee": { "name": "사용료", "price": 숫자 },
  "managementFee": { "name": "관리비", "price": 숫자 },
  "mainProducts": [
    { "name": "상품명", "price": 숫자, "detail": "설명" }
  ]
}`;

const ARCHIVE_DIR = path.join(__dirname, '../archive');

(async () => {
    console.log('=== 3~10번 PDF 가격표 추출 ===\n');

    const results = [];

    for (let num = 3; num <= 10; num++) {
        const folders = fs.readdirSync(ARCHIVE_DIR).filter(f => f.startsWith(`${num}.`));

        if (folders.length === 0) {
            console.log(`${num}. ❌ 폴더 없음`);
            continue;
        }

        const folderName = folders[0];
        const pdfPath = path.join(ARCHIVE_DIR, folderName, `${folderName}_price_info.pdf`);

        if (!fs.existsSync(pdfPath)) {
            console.log(`${num}. ❌ PDF 없음: ${folderName}`);
            continue;
        }

        console.log(`${num}. ${folderName} 파싱 중...`);

        try {
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

            results.push({
                number: num,
                name: folderName.replace(/^\d+\./, ''),
                ...data
            });

            console.log(`   ✅ 완료`);

            // Rate limit
            await new Promise(r => setTimeout(r, 3000));

        } catch (e) {
            console.log(`   ⚠️  실패: ${e.message}`);
        }
    }

    // 저장
    fs.writeFileSync(
        path.join(__dirname, '../facilities_3_to_10_prices.json'),
        JSON.stringify(results, null, 2)
    );

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ 추출 완료!\n');

    // 요약 출력
    results.forEach(r => {
        console.log(`${r.number}. ${r.name}`);
        if (r.usageFee) {
            console.log(`   사용료: ${r.usageFee.price.toLocaleString()}원`);
        }
        if (r.managementFee) {
            console.log(`   관리비: ${r.managementFee.price.toLocaleString()}원`);
        }
        if (r.mainProducts && r.mainProducts.length > 0) {
            console.log(`   주요상품: ${r.mainProducts.length}개`);
            r.mainProducts.slice(0, 2).forEach(p => {
                console.log(`     - ${p.name}: ${p.price.toLocaleString()}원`);
            });
        }
        console.log('');
    });

    console.log('💾 결과 저장: facilities_3_to_10_prices.json');

})();
