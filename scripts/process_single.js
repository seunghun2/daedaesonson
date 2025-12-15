const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const pdf = require('pdf-parse');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

const EXCLUDE_KEYWORDS = [
    '석물', '비석', '상석', '방석', '외비', '표석', '각자', '메탈포토',
    '와비', '성경책', '가족표석', '부부표석', '걸방석',
    '갓석', '좌대', '둘레석', '애석',
    '식당', '식사', '천막', '대여', '나무', '전지', '조경', '잔디',
    '육계장', '추어탕', '해장국', '갈비탕', '설렁탕', '냉면', '비빔밥', '국밥',
    '작업비', '개장', '봉분', '수선', '설치비', '정리',
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
    const body = { contents: [{ role: 'user', parts: [{ text: prompt }] }] };
    const res = await fetch(GEMINI_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Gemini API error ${res.status}`);
    const json = await res.json();
    return json.candidates?.[0]?.content?.parts?.map(p => p.text).join('\n') || '';
}

async function processSingle(num) {
    const facilityId = `park-${String(num).padStart(4, '0')}`;

    // PDF 찾기
    const pdfDir = path.join(__dirname, '../archive5');
    const files = fs.readdirSync(pdfDir);
    const pdfFile = files.find(f => f.startsWith(`${num}.`) && f.endsWith('.pdf'));
    if (!pdfFile) throw new Error(`PDF 없음: ${num}번`);

    const pdfPath = path.join(pdfDir, pdfFile);

    // 기존 데이터 삭제
    await fetch('http://localhost:3000/api/bulk-insert-pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facilityId, pricing: {} }),
    });

    // PDF 텍스트 추출
    const pdfText = await extractTextFromPdf(pdfPath);

    // Gemini 분석
    const prompt = `다음 텍스트에서 장묘/추모공원 가격 정보를 추출해주세요.

카테고리는 반드시 아래 4가지로 분류:
- 매장묘: 묘지 사용료, 평형별 가격, 개인/부부/가족 매장묘
- 봉안당: 납골당, 봉안함, 봉안위, X위
- 수목장: 수목장, 자연장, 평장묘, 정원형
- 기타: 위 3가지에 해당하지 않는 것

JSON 형식:
{"facility":"시설명","categories":{"매장묘":[{"name":"","price":"","description":""}],"봉안당":[],"수목장":[],"기타":[]}}

텍스트:
${pdfText}`;

    const geminiResponse = await callGeminiFlash(prompt);
    const jsonMatch = geminiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('JSON 파싱 실패');
    const parsed = JSON.parse(jsonMatch[0]);

    // 분류 및 제외 처리
    const result = {
        facilityId,
        facilityName: parsed.facility,
        categories: {},
        excluded: []
    };

    const categoryMap = {
        '매장묘': 'grave', '봉안당': 'charnel', '수목장': 'natural', '기타': 'other'
    };

    // 아이템 이름 기반 재분류 함수
    function reclassifyItem(name) {
        const n = name.toLowerCase();
        // 봉안당 키워드
        if (n.includes('봉안묘') || n.includes('봉안당') || n.includes('납골')) return '봉안당';
        if (n.includes('평안') || n.match(/공작\d+단/)) return '봉안당'; // 평안X단, 공작X단
        // 수목장 키워드
        if (n.includes('평장') || n.includes('수목') || n.includes('자연장')) return '수목장';
        // 매장묘 키워드
        if (n.includes('매장묘') || (n.includes('매장') && n.includes('묘'))) return '매장묘';
        return null; // 재분류 필요 없음
    }

    for (const [catName, items] of Object.entries(parsed.categories || {})) {
        if (!items || !Array.isArray(items)) continue;

        for (const item of items) {
            if (shouldExclude(item.name)) {
                result.excluded.push({ category: catName, ...item });
                continue;
            }

            // 재분류 체크: 기타에 있지만 실제로는 다른 카테고리인 경우
            let targetCat = catName;
            if (catName === '기타') {
                const reclassified = reclassifyItem(item.name);
                if (reclassified) targetCat = reclassified;
            }

            if (!result.categories[targetCat]) {
                result.categories[targetCat] = {
                    category: categoryMap[targetCat] || 'other',
                    categoryName: targetCat,
                    unit: '원',
                    rows: []
                };
            }

            result.categories[targetCat].rows.push({
                itemName: item.name,
                price: String(item.price || '0').replace(/,/g, ''),
                description: item.description || ''
            });
        }
    }

    // 🔥 제외된 항목도 "제외됨" 카테고리로 추가
    if (result.excluded.length > 0) {
        result.categories['제외됨'] = {
            category: 'excluded',
            categoryName: '제외됨',
            unit: '원',
            rows: result.excluded.map(e => ({
                itemName: e.name,
                price: String(e.price || '0').replace(/,/g, ''),
                description: `[${e.category}] ${e.description || ''}`
            }))
        };
    }

    // 결과 저장 (확인용)
    const resultPath = path.join(__dirname, `../data/verify_${num}.json`);
    fs.writeFileSync(resultPath, JSON.stringify(result, null, 2), 'utf-8');

    return result;
}

async function main() {
    const num = parseInt(process.argv[2]) || 1;
    console.log(`\n🔍 [${num}번] 시설 처리 시작\n`);

    try {
        const result = await processSingle(num);

        console.log(`✅ 시설: ${result.facilityName}`);
        console.log(`📁 ID: ${result.facilityId}\n`);

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📊 분류 결과:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        for (const [cat, data] of Object.entries(result.categories)) {
            console.log(`\n📦 ${cat} (${data.rows.length}개)`);
            data.rows.slice(0, 5).forEach(r => {
                console.log(`   • ${r.itemName}: ${r.price}원`);
            });
            if (data.rows.length > 5) console.log(`   ... 외 ${data.rows.length - 5}개`);
        }

        console.log(`\n❌ 제외됨: ${result.excluded.length}개`);
        if (result.excluded.length > 0) {
            result.excluded.slice(0, 3).forEach(e => {
                console.log(`   • [${e.category}] ${e.name}`);
            });
            if (result.excluded.length > 3) console.log(`   ... 외 ${result.excluded.length - 3}개`);
        }

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📄 상세 결과: data/verify_' + num + '.json');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    } catch (error) {
        console.error('❌ 에러:', error.message);
    }
}

main();
