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

const ARCHIVE_DIR = path.join(__dirname, '../archive');

const ANALYSIS_PROMPT = `이 PDF는 한국 장사시설 가격표입니다.

**다음 정보를 추출해주세요:**

1. **카테고리 구조**: 어떤 큰 분류가 있는지 (예: 사용료, 석물비, 관리비 등)
2. **주요 항목들**: 각 카테고리에 어떤 항목들이 있는지
3. **가격 패턴**: 가격이 어떻게 표시되는지 (단일가/범위/등급별)

**JSON 형식:**
{
  "facilityName": "시설명",
  "categories": [
    {
      "name": "카테고리명",
      "itemCount": 항목수,
      "commonItems": ["일반적인 항목1", "항목2"],
      "pricePattern": "단일가 | 범위 | 등급별"
    }
  ],
  "hasBasicFee": true/false,
  "hasManagementFee": true/false,
  "hasInstallationFee": true/false,
  "totalItemsCount": 총항목수
}`;

(async () => {
    console.log('=== Top 10 시설 PDF 구조 분석 ===\n');

    const results = [];

    for (let i = 1; i <= 10; i++) {
        console.log(`[${i}/10] 분석 중...`);

        // Find folder
        const folders = fs.readdirSync(ARCHIVE_DIR).filter(f => !f.startsWith('.'));
        const targetFolder = folders.find(f => f.startsWith(`${i}.`));

        if (!targetFolder) {
            console.log(`  ❌ 폴더를 찾을 수 없음`);
            continue;
        }

        const facilityFolder = path.join(ARCHIVE_DIR, targetFolder);
        const pdfFile = fs.readdirSync(facilityFolder).find(f => f.toLowerCase().endsWith('.pdf'));

        if (!pdfFile) {
            console.log(`  ❌ PDF 파일 없음`);
            continue;
        }

        try {
            const pdfPath = path.join(facilityFolder, pdfFile);
            const pdfData = fs.readFileSync(pdfPath);
            const base64Data = pdfData.toString('base64');

            const result = await model.generateContent([
                ANALYSIS_PROMPT,
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
                number: i,
                folderName: targetFolder,
                ...data
            });

            console.log(`  ✅ ${data.facilityName || targetFolder}`);
            console.log(`     카테고리: ${data.categories?.length || 0}개`);
            console.log(`     총 항목: ${data.totalItemsCount || '?'}개\n`);

            // Rate limit
            await new Promise(r => setTimeout(r, 3000));

        } catch (e) {
            console.log(`  ⚠️ 분석 실패: ${e.message}\n`);
        }
    }

    // 결과 저장
    fs.writeFileSync(
        path.join(__dirname, '../top10_pdf_analysis.json'),
        JSON.stringify(results, null, 2)
    );

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ 분석 완료!\n');
    console.log('💾 결과 저장: top10_pdf_analysis.json\n');

    // 공통 패턴 분석
    console.log('=== 공통 패턴 분석 ===\n');

    const hasBasic = results.filter(r => r.hasBasicFee).length;
    const hasMgmt = results.filter(r => r.hasManagementFee).length;
    const hasInstall = results.filter(r => r.hasInstallationFee).length;

    console.log(`기본 사용료 있음: ${hasBasic}/10 (${(hasBasic / 10 * 100).toFixed(0)}%)`);
    console.log(`관리비 있음: ${hasMgmt}/10 (${(hasMgmt / 10 * 100).toFixed(0)}%)`);
    console.log(`설치비 있음: ${hasInstall}/10 (${(hasInstall / 10 * 100).toFixed(0)}%)`);

    console.log('\n평균 카테고리 수:',
        (results.reduce((sum, r) => sum + (r.categories?.length || 0), 0) / results.length).toFixed(1));

    console.log('\n다음 단계: 이 데이터로 표준 스키마를 설계하시겠습니까?');

})();
