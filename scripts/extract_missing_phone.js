/**
 * phone이 없는 시설들의 정보를 PDF에서 추출하는 스크립트
 */

const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const API_KEY = "AIzaSyBwYFI4wemDzGL__QaU7ie61ajQnxldojc";
const genAI = new GoogleGenerativeAI(API_KEY);

const FACILITIES_PATH = path.join(__dirname, '../data/facilities.json');
const ARCHIVE_PATH = path.join(__dirname, '../archive5');

async function extractInfoFromPDF(pdfPath, facilityName) {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfBase64 = pdfBuffer.toString('base64');

    const prompt = `이 PDF는 "${facilityName}" 장사시설의 가격 정보입니다.

다음 정보를 추출해주세요:

1. 운영법인형태: (재)=재단법인, (사)=사단법인, (주)=주식회사, 공설/시립/군립/도립=public
2. 공설/사설 구분: 공설(시립,군립,도립,국립,공설)=true, 사설=false
3. 시설 카테고리: (봉안당/봉안묘/봉안탑, 수목장/자연장, 매장묘/공원묘원/묘지, 화장장, 장례식장)
4. 주소: 시설의 전체 주소
5. 전화번호
6. 총안치능력/총매장능력: 숫자만
7. 데이터 업데이트 날짜: YYYY-MM-DD 형식
8. 편의시설: 주차장, 식당, 장애인편의시설, 매점 유무

반드시 아래 JSON 형식으로만 응답:
{
  "institutionType": "foundation" | "corporation" | "religious" | "company" | "public",
  "isPublic": true/false,
  "categories": ["charnel", "natural", "grave", "cremation", "funeral"] 중 해당,
  "address": "전체 주소" 또는 null,
  "phone": "전화번호" 또는 null,
  "capacity": 숫자 또는 null,
  "lastUpdated": "YYYY-MM-DD" 또는 null,
  "hasParking": true/false,
  "hasRestaurant": true/false,
  "hasAccessibility": true/false,
  "hasStore": true/false
}`;

    try {
        const result = await model.generateContent([
            { text: prompt },
            {
                inlineData: {
                    mimeType: 'application/pdf',
                    data: pdfBase64
                }
            }
        ]);

        const responseText = result.response.text();
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return null;
    } catch (error) {
        console.error(`Error: ${error.message}`);
        return null;
    }
}

async function main() {
    const mode = process.argv[2]; // 'list' | 'test' | 'batch'
    const startIdx = parseInt(process.argv[3]) || 0;
    const count = parseInt(process.argv[4]) || 5;

    const facilities = JSON.parse(fs.readFileSync(FACILITIES_PATH, 'utf8'));
    const archive5Files = fs.readdirSync(ARCHIVE_PATH);

    // phone이 없는 시설만 필터
    const noPhone = facilities.filter(f => !f.phone);

    console.log(`\n총 phone 없는 시설: ${noPhone.length}개\n`);

    if (mode === 'list') {
        // 리스트만 출력
        noPhone.forEach((f, idx) => {
            const numId = parseInt(f.id.replace('park-', ''));
            console.log(`${idx + 1}. [${numId}] ${f.name}`);
        });
        return;
    }

    if (mode === 'test') {
        // 단일 테스트
        const testIdx = startIdx;
        const facility = noPhone[testIdx];
        if (!facility) {
            console.log('Invalid index');
            return;
        }

        const numId = parseInt(facility.id.replace('park-', ''));
        const pdfFile = archive5Files.find(f => f.startsWith(numId + '.') && f.endsWith('.pdf'));

        console.log(`테스트: [${numId}] ${facility.name}`);
        console.log(`PDF: ${pdfFile}\n`);

        if (!pdfFile) {
            console.log('PDF 파일 없음!');
            return;
        }

        const pdfPath = path.join(ARCHIVE_PATH, pdfFile);
        const extracted = await extractInfoFromPDF(pdfPath, facility.name);

        console.log('추출 결과:');
        console.log(JSON.stringify(extracted, null, 2));
        return;
    }

    if (mode === 'batch') {
        // 배치 처리
        const endIdx = Math.min(startIdx + count, noPhone.length);
        console.log(`Processing ${startIdx} ~ ${endIdx - 1} (${endIdx - startIdx}개)\n`);

        const updates = [];

        for (let i = startIdx; i < endIdx; i++) {
            const facility = noPhone[i];
            const numId = parseInt(facility.id.replace('park-', ''));
            const pdfFile = archive5Files.find(f => f.startsWith(numId + '.') && f.endsWith('.pdf'));

            console.log(`[${i + 1}/${noPhone.length}] ${numId}. ${facility.name}`);

            if (!pdfFile) {
                console.log('  ❌ PDF 없음\n');
                continue;
            }

            const pdfPath = path.join(ARCHIVE_PATH, pdfFile);
            const extracted = await extractInfoFromPDF(pdfPath, facility.name);

            if (extracted) {
                console.log(`  ✓ institutionType: ${extracted.institutionType}`);
                console.log(`  ✓ categories: ${JSON.stringify(extracted.categories)}`);
                console.log(`  ✓ address: ${extracted.address}`);
                console.log(`  ✓ phone: ${extracted.phone}`);
                console.log(`  ✓ capacity: ${extracted.capacity}`);

                // API POST로 저장
                const payload = {
                    id: facility.id,
                    name: facility.name,
                    address: extracted.address || facility.address,
                    institutionType: extracted.institutionType,
                    isPublic: extracted.isPublic,
                    categories: extracted.categories,
                    phone: extracted.phone,
                    capacity: extracted.capacity,
                    lastUpdated: extracted.lastUpdated,
                    hasParking: extracted.hasParking,
                    hasRestaurant: extracted.hasRestaurant,
                    hasAccessibility: extracted.hasAccessibility,
                    hasStore: extracted.hasStore
                };

                try {
                    const res = await fetch('http://localhost:3000/api/facilities', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    const result = await res.json();
                    if (result.success) {
                        console.log('  ✅ API 저장 완료!\n');
                        updates.push({ ...payload, saved: true });
                    } else {
                        console.log('  ⚠️ API 저장 실패\n');
                    }
                } catch (e) {
                    console.log('  ⚠️ API 호출 에러:', e.message, '\n');
                }
            } else {
                console.log('  ❌ 추출 실패\n');
            }

            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        console.log(`\n=== 완료 ===`);
        console.log(`처리됨: ${updates.length}개`);
        return;
    }

    // 기본: 사용법 안내
    console.log('사용법:');
    console.log('  node extract_missing_phone.js list          - 목록 보기');
    console.log('  node extract_missing_phone.js test 0        - 첫번째 테스트');
    console.log('  node extract_missing_phone.js batch 0 10    - 0번부터 10개 처리');
}

main().catch(console.error);
