/**
 * PDF에서 시설 정보 추출 스크립트
 * - 운영법인형태 (institutionType)
 * - 카테고리 (categories)
 * - 전화번호 (phone)
 * - 총매장능력 (totalCapacity)
 */

const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const FACILITIES_PATH = path.join(__dirname, '../data/facilities.json');
const ARCHIVE_PATH = path.join(__dirname, '../archive5');

// 시설 유형 매핑
const INSTITUTION_TYPE_MAP = {
    '재단법인': 'foundation',
    '사단법인': 'corporation',
    '종교법인': 'religious',
    '주식회사': 'company',
    '공설': 'public',
    '지자체': 'public',
    '시립': 'public',
    '군립': 'public',
    '도립': 'public',
    '국립': 'public',
};

// 카테고리 매핑
const CATEGORY_MAP = {
    '봉안당': 'charnel',
    '봉안묘': 'charnel',
    '봉안탑': 'charnel',
    '납골당': 'charnel',
    '납골묘': 'charnel',
    '수목장': 'natural',
    '자연장': 'natural',
    '매장묘': 'grave',
    '공원묘원': 'grave',
    '묘지': 'grave',
    '화장장': 'cremation',
    '장례식장': 'funeral',
};

async function extractInfoFromPDF(pdfPath, facilityName) {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // PDF를 base64로 읽기
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfBase64 = pdfBuffer.toString('base64');

    const prompt = `이 PDF는 "${facilityName}" 장사시설의 가격 정보입니다.
다음 정보를 추출해주세요:

1. 운영법인형태: (재단법인, 사단법인, 종교법인, 주식회사, 공설/지자체 중 하나)
2. 시설 카테고리: (봉안당, 봉안묘, 수목장, 자연장, 매장묘/공원묘원, 화장장, 장례식장 중 해당하는 것 모두)
3. 전화번호: (있으면 추출, 없으면 null)
4. 총매장능력/총안치능력: (숫자만, 없으면 null)

반드시 다음 JSON 형식으로만 응답하세요:
{
  "institutionType": "foundation" 또는 "corporation" 또는 "religious" 또는 "company" 또는 "public",
  "categories": ["charnel", "natural", "grave"] 중 해당하는 것들,
  "phone": "전화번호" 또는 null,
  "totalCapacity": 숫자 또는 null
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
        // JSON 추출
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return null;
    } catch (error) {
        console.error(`Error processing ${facilityName}:`, error.message);
        return null;
    }
}

async function processFacility(facility, index) {
    const numericId = parseInt(facility.id.replace('park-', ''));
    const pdfPattern = `${numericId}.`;

    // archive5에서 해당 PDF 찾기
    const files = fs.readdirSync(ARCHIVE_PATH);
    const pdfFile = files.find(f => f.startsWith(pdfPattern) && f.endsWith('.pdf'));

    if (!pdfFile) {
        console.log(`[${index}] PDF not found for: ${facility.name}`);
        return null;
    }

    const pdfPath = path.join(ARCHIVE_PATH, pdfFile);
    console.log(`[${index}] Processing: ${facility.name} -> ${pdfFile}`);

    const extracted = await extractInfoFromPDF(pdfPath, facility.name);

    if (extracted) {
        console.log(`  ✓ institutionType: ${extracted.institutionType}`);
        console.log(`  ✓ categories: ${JSON.stringify(extracted.categories)}`);
        console.log(`  ✓ phone: ${extracted.phone}`);
        console.log(`  ✓ totalCapacity: ${extracted.totalCapacity}`);
    }

    return extracted;
}

async function main() {
    const startId = parseInt(process.argv[2]) || 1;
    const endId = parseInt(process.argv[3]) || startId;

    console.log(`\n=== Processing facilities ${startId} to ${endId} ===\n`);

    const facilities = JSON.parse(fs.readFileSync(FACILITIES_PATH, 'utf8'));
    const updates = [];

    for (let i = startId; i <= endId; i++) {
        const parkId = `park-${String(i).padStart(4, '0')}`;
        const facility = facilities.find(f => f.id === parkId);

        if (!facility) {
            console.log(`[${i}] Facility not found: ${parkId}`);
            continue;
        }

        // 이미 데이터가 있는지 확인
        if (facility.institutionType && facility.totalCapacity && facility.categories?.length > 0) {
            console.log(`[${i}] Already has data: ${facility.name}`);
            continue;
        }

        const extracted = await processFacility(facility, i);

        if (extracted) {
            updates.push({
                id: parkId,
                name: facility.name,
                ...extracted
            });
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n=== Summary ===');
    console.log(`Processed: ${updates.length} facilities`);

    if (updates.length > 0) {
        console.log('\nUpdates to apply:');
        updates.forEach(u => {
            console.log(`  ${u.id}: ${u.name}`);
            console.log(`    institutionType: ${u.institutionType}`);
            console.log(`    categories: ${JSON.stringify(u.categories)}`);
            console.log(`    phone: ${u.phone}`);
            console.log(`    totalCapacity: ${u.totalCapacity}`);
        });

        // 결과 저장
        const outputPath = path.join(__dirname, `../data/facility_updates_${startId}_${endId}.json`);
        fs.writeFileSync(outputPath, JSON.stringify(updates, null, 2));
        console.log(`\nSaved to: ${outputPath}`);
    }
}

main().catch(console.error);
