require('dotenv').config({ path: '.env.local', override: true });
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// Gemini API 설정
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

if (!GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY가 .env.local에 없습니다!');
    process.exit(1);
}

// PDF를 base64로 인코딩
function pdfToBase64(pdfPath) {
    const buffer = fs.readFileSync(pdfPath);
    return buffer.toString('base64');
}

// Gemini API 호출
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
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('JSON not found in response');

    return JSON.parse(jsonMatch[0]);
}

// 'XX개월전 업데이트' → YYYY-MM-DD 변환
function monthsAgoToDate(text) {
    if (!text) return null;

    const match = text.match(/(\d+)개월전/);
    if (!match) return null;

    const monthsAgo = parseInt(match[1], 10);
    const now = new Date();
    now.setMonth(now.getMonth() - monthsAgo);

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

// 메인 로직
async function main() {
    console.log('🚀 주소 + 업데이트 날짜 추출 (전체 처리)\n');

    // facilities.json 로드
    const facilitiesPath = path.join(__dirname, '../data/facilities.json');
    const facilities = JSON.parse(fs.readFileSync(facilitiesPath, 'utf8'));

    // 주소 OR 업데이트 날짜가 비어있는 시설 필터
    const needsUpdate = facilities.filter(f =>
        (!f.address || f.address.trim() === '') ||
        (!f.lastUpdated || f.lastUpdated === 'YYYY-MM-DD' || f.lastUpdated.trim() === '')
    );

    console.log(`총 시설: ${facilities.length}개`);
    console.log(`업데이트 필요: ${needsUpdate.length}개\n`);

    // 전체 처리
    const toProcess = needsUpdate;

    let successCount = 0;
    let failCount = 0;
    let skipCount = 0;

    for (let i = 0; i < toProcess.length; i++) {
        const facility = toProcess[i];
        const progress = `[${i + 1}/${toProcess.length}]`;

        // ID에서 번호 추출
        const numMatch = facility.id.match(/park-(\d+)/);
        if (!numMatch) {
            console.log(`${progress} ❌ ${facility.id}: ID 형식 오류`);
            failCount++;
            continue;
        }
        const num = parseInt(numMatch[1], 10);

        // PDF 파일 찾기
        const pdfDir = path.join(__dirname, '../archive5');
        const files = fs.readdirSync(pdfDir);
        const pdfFile = files.find(f => f.startsWith(`${num}.`) && f.endsWith('.pdf'));

        if (!pdfFile) {
            console.log(`${progress} ⏭️  ${facility.id}: PDF 없음`);
            skipCount++;
            continue;
        }

        const pdfPath = path.join(pdfDir, pdfFile);

        try {
            const result = await extractInfoFromPdf(pdfPath);
            const dateFormatted = monthsAgoToDate(result.lastUpdated);

            // facilities 배열에서 해당 시설 찾아 업데이트
            const idx = facilities.findIndex(f => f.id === facility.id);
            if (idx !== -1) {
                // 주소가 비어있으면 업데이트
                if ((!facilities[idx].address || facilities[idx].address.trim() === '') && result.address) {
                    facilities[idx].address = result.address;
                }
                // 업데이트 날짜가 비어있으면 업데이트
                if ((!facilities[idx].lastUpdated || facilities[idx].lastUpdated === 'YYYY-MM-DD' || facilities[idx].lastUpdated.trim() === '') && dateFormatted) {
                    facilities[idx].lastUpdated = dateFormatted;
                }
            }

            console.log(`${progress} ✅ ${facility.id}: 주소=${result.address ? '✓' : '✗'} 업데이트=${dateFormatted || '✗'}`);
            successCount++;

        } catch (e) {
            console.log(`${progress} ❌ ${facility.id}: ${e.message.substring(0, 50)}`);
            failCount++;
        }

        // Rate limit 방지 (Gemini API 제한 피하기)
        if ((i + 1) % 10 === 0) {
            console.log(`   💾 중간 저장...`);
            fs.writeFileSync(facilitiesPath, JSON.stringify(facilities, null, 2), 'utf8');
            await new Promise(r => setTimeout(r, 2000));
        } else {
            await new Promise(r => setTimeout(r, 500));
        }
    }

    // 최종 저장
    console.log('\n💾 최종 저장 중...');
    fs.writeFileSync(facilitiesPath, JSON.stringify(facilities, null, 2), 'utf8');

    console.log('\n' + '='.repeat(60));
    console.log('📊 최종 결과');
    console.log('='.repeat(60));
    console.log(`✅ 성공: ${successCount}개`);
    console.log(`❌ 실패: ${failCount}개`);
    console.log(`⏭️  스킵: ${skipCount}개`);
    console.log('\n💡 어드민 패널에서 확인: http://localhost:3000/admin/upload\n');
}

main().catch(console.error);
