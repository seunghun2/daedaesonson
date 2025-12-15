const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');
const pdf = require('pdf-parse');

// Gemini Flash model endpoint
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

async function deleteExistingData(facilityId) {
    // Using bulk-insert endpoint with empty pricing to delete (depends on API behavior)
    const payload = { facilityId, pricing: {} };
    await fetch('http://localhost:3000/api/bulk-insert-pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    console.log(`✅ 기존 데이터(${facilityId}) 삭제 완료`);
}

async function extractTextFromPdf(pdfPath) {
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdf(dataBuffer);
    return data.text;
}

async function callGeminiFlash(prompt) {
    const body = {
        contents: [{
            role: 'user',
            parts: [{ text: prompt }]
        }]
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
    // Extract the text response
    const parts = json.candidates?.[0]?.content?.parts;
    if (!parts || parts.length === 0) throw new Error('No response parts from Gemini');
    return parts.map(p => p.text).join('\n');
}

async function reprocessPark0001() {
    const facilityId = 'park-0001';
    console.log('🔄 park-0001 재처리 시작 (Gemini 2.0 Flash)');

    await deleteExistingData(facilityId);

    // PDF 파일 찾기 (원본 또는 복사본)
    const pdfDir = path.join(__dirname, '../archive5');
    const possibleFiles = [
        '1.(재)낙원추모공원_price_info.pdf',
        '1.(재)낙원추모공원_price_info 복사본.pdf'
    ];
    let pdfFile = null;
    for (const f of possibleFiles) {
        const fullPath = path.join(pdfDir, f);
        if (fs.existsSync(fullPath)) { pdfFile = f; break; }
    }
    if (!pdfFile) {
        console.error('PDF 파일을 찾을 수 없습니다:', possibleFiles);
        return;
    }
    const pdfPath = path.join(pdfDir, pdfFile);

    console.log('📄 PDF 텍스트 추출 중...');
    const pdfText = await extractTextFromPdf(pdfPath);

    const prompt = `다음은 "${pdfPath}" 파일에서 추출한 텍스트입니다.\n` +
        `이 텍스트에서 시설명, 가격 카테고리(매장묘, 봉안당, 수목장, 기타)와 각 항목의 이름, 가격, 설명을 JSON 형태로 추출해주세요.\n` +
        `출력 형식은 아래와 같습니다.\n` +
        `{
      "facility": "시설명",
      "categories": {
        "매장묘": [{"name": "...", "price": "...", "description": "..."}],
        "봉안당": [{"name": "...", "price": "...", "description": "..."}],
        "수목장": [{"name": "...", "price": "...", "description": "..."}],
        "기타": [{"name": "...", "price": "...", "description": "..."}]
      }
    }
    텍스트가 길어도 전체를 포함해 주세요.`;

    console.log('🤖 Gemini Flash 호출 중...');
    const geminiResponse = await callGeminiFlash(pdfText + '\n' + prompt);

    // Save raw response for debugging
    fs.writeFileSync(path.join(__dirname, '../data/park_0001_gemini_raw.txt'), geminiResponse, 'utf-8');

    let parsed;
    try {
        // Try to extract JSON from the response (may contain extra text)
        const jsonMatch = geminiResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('JSON not found in Gemini response');
        parsed = JSON.parse(jsonMatch[0]);
    } catch (e) {
        console.error('❌ Gemini 응답 파싱 실패:', e.message);
        console.error('응답 내용:', geminiResponse);
        return;
    }

    // -------------------------------------------------------------------
    // ① 키워드 기반 재분류 & 제외 로직
    // -------------------------------------------------------------------
    const EXCLUDE_KEYWORDS = [
        '석물', '비석', '상석', '방석', '외비', '표석', '각자', '메탈포토',
        '식당', '식사', '천막', '대여', '나무', '전지', '조경',
        '작업비', '개장', '봉분', '수선', '설치비', '정리',
        '유골함', '외전', '영안당', '제사', '산신제', '장례',
        '사용료 반환', '관리비 반환', '건관리'
    ];

    function categorizeItem(name) {
        const n = name.toLowerCase();
        for (const kw of EXCLUDE_KEYWORDS) {
            if (n.includes(kw)) return 'exclude';
        }
        if (n.includes('매장') || n.includes('평형') || n.includes('평장') || (n.includes('묘') && !n.includes('봉안') && !n.includes('수목')))
            return 'grave';
        if (n.includes('봉안') || n.includes('납골') || n.match(/\d+위/) || n.includes('정려'))
            return 'charnel';
        if (n.includes('수목') || n.includes('자연장') || n.includes('플라타너스') || n.includes('아이리스') || n.includes('클로버') || n.includes('다알리아') || n.includes('철쭉'))
            return 'natural';
        return 'other';
    }

    // -------------------------------------------------------------------
    // ② 정제된 pricing 객체 생성
    // -------------------------------------------------------------------
    const pricing = {};
    const categoryMap = {
        grave: { category: 'grave', categoryName: '매장묘', unit: '원' },
        charnel: { category: 'charnel', categoryName: '봉안당', unit: '원' },
        natural: { category: 'natural', categoryName: '수목장', unit: '원' },
        other: { category: 'other', categoryName: '기타', unit: '원' }
    };

    // 모든 아이템을 평탄화하고 재분류
    let excludedCount = 0;
    if (parsed.categories) {
        Object.values(parsed.categories).forEach(cat => {
            (cat.items || cat.rows || []).forEach(item => {
                const catKey = categorizeItem(item.name);
                if (catKey === 'exclude') {
                    excludedCount++;
                    return;
                }
                const target = pricing[catKey] || (pricing[catKey] = { ...categoryMap[catKey], rows: [] });
                target.rows.push({
                    itemName: item.name,
                    price: String(item.price),
                    description: item.description || ''
                });
            });
        });
    }

    // 빈 카테고리 제거
    Object.keys(pricing).forEach(k => {
        if (pricing[k].rows.length === 0) delete pricing[k];
    });

    console.log(`   - 제외된 항목: ${excludedCount}개`);

    console.log('📤 DB 재삽입 중...');
    const insertPayload = { facilityId, pricing };
    const insertRes = await fetch('http://localhost:3000/api/bulk-insert-pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(insertPayload)
    });
    if (!insertRes.ok) {
        const err = await insertRes.text();
        throw new Error(`DB 삽입 실패: ${insertRes.status} - ${err}`);
    }
    const insertResult = await insertRes.json();
    console.log('✅ 재삽입 완료!');
    console.log('📊 최종 결과:');
    Object.entries(pricing).forEach(([name, data]) => {
        console.log(`   - ${name}: ${data.rows.length}개`);
    });
    console.log('\n💡 어드민 패널에서 확인: http://localhost:3000/admin/upload');
}

reprocessPark0001();
