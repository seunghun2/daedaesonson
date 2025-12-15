require('dotenv').config({ path: '.env.local', override: true });
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// Gemini API 설정
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

if (!GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY가 .env에 없습니다!');
    process.exit(1);
}

// PDF를 base64로 인코딩
function pdfToBase64(pdfPath) {
    const buffer = fs.readFileSync(pdfPath);
    return buffer.toString('base64');
}

// Gemini API 호출 (PDF 직접 전송) - 주소 + 업데이트 날짜 추출
async function extractInfoFromPdf(pdfPath) {
    const base64Data = pdfToBase64(pdfPath);

    const body = {
        contents: [{
            role: 'user',
            parts: [
                {
                    inlineData: {
                        mimeType: 'application/pdf',
                        data: base64Data
                    }
                },
                {
                    text: `이 PDF에서 시설 정보를 추출해주세요.

1. 주소 (address): 시설의 도로명 또는 지번 주소
2. 업데이트 (lastUpdated): "XX개월전 업데이트" 형식의 텍스트 (예: "11개월전 업데이트")
                    
응답 형식 (반드시 JSON만):
{"address": "추출된 주소", "lastUpdated": "XX개월전 업데이트"}

없는 항목은 null로:
{"address": null, "lastUpdated": null}

JSON만 응답하세요. 다른 설명 없이.`
                }
            ]
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
    const parts = json.candidates?.[0]?.content?.parts;
    if (!parts || parts.length === 0) throw new Error('No response from Gemini');

    const text = parts.map(p => p.text).join('');

    // JSON 추출
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('JSON not found in response');

    return JSON.parse(jsonMatch[0]);
}

// 'XX개월전 업데이트' 형식을 YYYY-MM-DD로 변환
function monthsAgoToDate(text) {
    if (!text) return null;

    // "11개월전 업데이트" → 11 추출
    const match = text.match(/(\d+)개월전/);
    if (!match) return null;

    const monthsAgo = parseInt(match[1], 10);
    const now = new Date();
    now.setMonth(now.getMonth() - monthsAgo);

    // YYYY-MM-DD 형식
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

// 메인 로직
async function main() {
    console.log('🚀 주소 + 업데이트 날짜 추출 테스트 (3개)\n');

    // facilities.json 로드
    const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));

    // 주소 OR 업데이트 날짜가 비어있는 시설 필터
    const needsUpdate = facilities.filter(f =>
        (!f.address || f.address.trim() === '') ||
        (!f.lastUpdated || f.lastUpdated === 'YYYY-MM-DD' || f.lastUpdated.trim() === '')
    );

    console.log(`총 업데이트 필요한 시설: ${needsUpdate.length}개`);
    console.log('테스트: 처음 3개만 처리\n');

    const testFacilities = needsUpdate.slice(0, 3);
    const results = [];

    for (const facility of testFacilities) {
        // ID에서 번호 추출 (park-0159 -> 159)
        const numMatch = facility.id.match(/park-(\d+)/);
        if (!numMatch) {
            console.log(`❌ ${facility.id}: ID 형식 오류`);
            continue;
        }
        const num = parseInt(numMatch[1], 10);

        // PDF 파일 찾기
        const pdfDir = path.join(__dirname, '../archive5');
        const files = fs.readdirSync(pdfDir);
        const pdfFile = files.find(f => f.startsWith(`${num}.`) && f.endsWith('.pdf'));

        if (!pdfFile) {
            console.log(`❌ ${facility.id} (${facility.name}): PDF 없음`);
            continue;
        }

        const pdfPath = path.join(pdfDir, pdfFile);
        console.log(`📄 ${facility.id} (${facility.name})`);
        console.log(`   PDF: ${pdfFile}`);

        try {
            const result = await extractInfoFromPdf(pdfPath);
            const dateFormatted = monthsAgoToDate(result.lastUpdated);

            console.log(`   ✅ 주소: ${result.address || '(없음)'}`);
            console.log(`   ✅ 업데이트: ${result.lastUpdated || '(없음)'} → ${dateFormatted || '(변환실패)'}`);

            results.push({
                id: facility.id,
                name: facility.name,
                address: result.address,
                lastUpdated: dateFormatted
            });
        } catch (e) {
            console.log(`   ❌ 에러: ${e.message}`);
        }

        // Rate limit 방지
        await new Promise(r => setTimeout(r, 1000));
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 결과 요약');
    console.log('='.repeat(60));
    results.forEach(r => {
        console.log(`${r.id}:`);
        console.log(`  주소: ${r.address || '(없음)'}`);
        console.log(`  업데이트: ${r.lastUpdated || '(없음)'}`);
    });
}

main().catch(console.error);
