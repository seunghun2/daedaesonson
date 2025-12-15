const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const pdf = require('pdf-parse');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

// ====================================================================
// 제외 키워드 - 석물, 비석, 식당 등 부가서비스는 제외
// ====================================================================
const EXCLUDE_KEYWORDS = [
    '석물', '비석', '상석', '방석', '외비', '표석', '각자', '메탈포토',
    '와비', '월석', '성경책', '가족표석', '부부표석', '걸방석',
    '식당', '식사', '천막', '대여', '나무', '전지', '조경', '잔디',
    '작업비', '개장', '봉분', '수선', '설치비', '정리', '리모델링',
    '유골함', '외전', '영안당', '제사', '산신제', '장례', '의전',
    '사용료 반환', '관리비 반환', '관리비', '충곽', '탈관', '석실',
    '삼향로', '석화분', '석등', '판석', '갓(', '구판', '경계석', '담장석',
    '석곽', '석관', '석봉분', '철쭉식재'
];

function shouldExclude(name) {
    const n = name.toLowerCase();
    for (const kw of EXCLUDE_KEYWORDS) {
        if (n.includes(kw.toLowerCase())) return true;
    }
    return false;
}

async function extractTextFromPdf(pdfPath) {
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdf(dataBuffer);
    return data.text;
}

async function callGeminiFlash(prompt) {
    const body = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
    };
    const res = await fetch(GEMINI_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Gemini API error ${res.status}: ${err}`);
    }
    const json = await res.json();
    const parts = json.candidates?.[0]?.content?.parts;
    if (!parts || parts.length === 0) throw new Error('No response from Gemini');
    return parts.map(p => p.text).join('\n');
}

async function deleteExistingData(facilityId) {
    await fetch('http://localhost:3000/api/bulk-insert-pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facilityId, pricing: {} }),
    });
}

async function processFacility(num) {
    const facilityId = `park-${String(num).padStart(4, '0')}`;
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔍 [${num}번] ${facilityId} 처리 시작`);
    console.log('='.repeat(60));

    try {
        // 1. PDF 파일 찾기
        const pdfDir = path.join(__dirname, '../archive5');
        const files = fs.readdirSync(pdfDir);
        const pdfFile = files.find(f => f.startsWith(`${num}.`) && f.endsWith('.pdf'));

        if (!pdfFile) throw new Error(`PDF 파일 없음`);

        const pdfPath = path.join(pdfDir, pdfFile);
        console.log(`📁 ${pdfFile}`);

        // 2. 기존 데이터 삭제
        await deleteExistingData(facilityId);
        console.log('🗑️  기존 데이터 삭제 완료');

        // 3. PDF 텍스트 추출
        const pdfText = await extractTextFromPdf(pdfPath);
        console.log('📄 PDF 텍스트 추출 완료');

        // 4. Gemini Flash로 분석
        const prompt = `다음 텍스트에서 장묘/추모공원 가격 정보를 추출해주세요.

카테고리는 반드시 아래 4가지로 분류해주세요:
- 매장묘: 묘지 사용료, 평형별 가격, 개인/부부/가족 매장묘 등
- 봉안당: 납골당, 봉안함, 봉안위 등
- 수목장: 수목장, 자연장, 평장묘, 정원형 등
- 기타: 위 3가지에 해당하지 않는 것들

출력 형식 (JSON):
{
  "facility": "시설명",
  "categories": {
    "매장묘": [{"name": "...", "price": "...", "description": "..."}],
    "봉안당": [{"name": "...", "price": "...", "description": "..."}],
    "수목장": [{"name": "...", "price": "...", "description": "..."}],
    "기타": [{"name": "...", "price": "...", "description": "..."}]
  }
}

텍스트:
${pdfText}`;

        console.log('🤖 Gemini Flash 호출 중...');
        const geminiResponse = await callGeminiFlash(prompt);

        // 5. JSON 파싱
        const jsonMatch = geminiResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('JSON not found');
        const parsed = JSON.parse(jsonMatch[0]);

        // 6. 제외 키워드 적용 후 pricing 생성
        const pricing = {};
        const categoryMap = {
            '매장묘': { category: 'grave', categoryName: '매장묘', unit: '원' },
            '봉안당': { category: 'charnel', categoryName: '봉안당', unit: '원' },
            '수목장': { category: 'natural', categoryName: '수목장', unit: '원' },
            '기타': { category: 'other', categoryName: '기타', unit: '원' }
        };

        let totalIncluded = 0;
        let totalExcluded = 0;

        for (const [catName, items] of Object.entries(parsed.categories || {})) {
            if (!items || !Array.isArray(items)) continue;

            const map = categoryMap[catName] || categoryMap['기타'];
            const rows = [];

            for (const item of items) {
                if (shouldExclude(item.name)) {
                    totalExcluded++;
                    continue;
                }
                rows.push({
                    itemName: item.name,
                    price: String(item.price || '0'),
                    description: item.description || ''
                });
                totalIncluded++;
            }

            if (rows.length > 0) {
                pricing[catName] = { ...map, rows };
            }
        }

        // 7. DB 삽입
        console.log('📤 DB 삽입 중...');
        const insertRes = await fetch('http://localhost:3000/api/bulk-insert-pricing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ facilityId, pricing })
        });

        if (!insertRes.ok) throw new Error(`DB 삽입 실패: ${insertRes.status}`);

        // 8. 결과 출력
        console.log('✅ 삽입 완료!');
        Object.entries(pricing).forEach(([cat, data]) => {
            console.log(`   - ${cat}: ${data.rows.length}개`);
        });
        console.log(`   - 제외됨: ${totalExcluded}개`);

        return { success: true, facility: parsed.facility };

    } catch (error) {
        console.error(`❌ 에러: ${error.message}`);
        return { success: false, error: error.message };
    }
}

async function main() {
    console.log('🚀 1~5번 PDF 재처리 시작 (개선된 로직)\n');

    const results = [];
    for (let i = 1; i <= 5; i++) {
        const result = await processFacility(i);
        results.push({ num: i, ...result });
        if (i < 5) await new Promise(r => setTimeout(r, 2000));
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 최종 결과');
    console.log('='.repeat(60));

    results.forEach(r => {
        console.log(r.success ? `✅ ${r.num}번: ${r.facility}` : `❌ ${r.num}번: ${r.error}`);
    });

    console.log(`\n총 ${results.filter(r => r.success).length}/5개 성공!`);
    console.log('💡 어드민 패널에서 확인: http://localhost:3000/admin/upload\n');
}

main();
