const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

const ARCHIVE_DIR = path.join(__dirname, '../archive5');
const JSON_PATH = path.join(__dirname, '../data/facilities.json');

// 시설 이름이나 가격을 추출하기 위한 정규식 패턴들
// 예: "공설묘지 사용료 이용자격: ... 300,000"
const REGEX_PRICE_LINE = /([가-힣\s\(\)\d\/]+?)\s+(.*?)\s+([\d,]+)$/;
// 위 정규식 설명: (항목명) (설명/내역) (가격)
// 하지만 PDF 텍스트는 줄바꿈이 섞여있을 수 있어 줄 단위로 처리하는 게 나음.

async function run() {
    console.log("🚀 Starting Bulk Auto-Injection for archive5 (PDFs)...");

    // 1. Load Facilities
    const facilities = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));

    // 2. Get PDF Files (Sorted by Number)
    const files = fs.readdirSync(ARCHIVE_DIR)
        .filter(f => f.toLowerCase().endsWith('.pdf'))
        .sort((a, b) => {
            const numA = parseInt(a.split('.')[0]);
            const numB = parseInt(b.split('.')[0]);
            return numA - numB;
        });

    // Start from 171 (Since we finished 170)
    // Or filter specifically
    const targetFiles = files.filter(f => {
        const num = parseInt(f.split('.')[0]);
        return num >= 171;
    });

    console.log(`📋 Found ${targetFiles.length} files to process (starting from 171).`);

    let successCount = 0;
    let failCount = 0;

    for (const file of targetFiles) {
        try {
            const fileNum = parseInt(file.split('.')[0]);
            // 파일명에서 이름 추출 (예: "171.웅양공설공원묘지.pdf" -> "웅양공설공원묘지")
            let nameHint = file.replace(/^\d+\./, '').replace(/_price_info\.pdf$/i, '').replace(/\.pdf$/i, '').trim();
            // 괄호 제거 (예: "(재)원주공원묘원" -> "원주공원묘원", "강릉공원묘원(묘지)" -> "강릉공원묘원")
            // 단, 괄호 안에 중요한게 있을 수 있으니 이름 매칭 시 유연하게.
            const cleanNameHint = nameHint.replace(/\(.*\)/g, '').trim();

            console.log(`\n📄 Processing [${file}] (${nameHint})...`);

            // Extract Text
            const dataBuffer = fs.readFileSync(path.join(ARCHIVE_DIR, file));
            const data = await pdf(dataBuffer);
            const text = data.text;

            // Parse Prices
            const pricingData = parsePdfText(text);

            if (!pricingData || (pricingData['매장묘'].rows.length === 0 && pricingData['봉안당'].rows.length === 0)) {
                console.warn(`⚠️ No pricing data found in text for ${file}. Skipping.`);
                failCount++;
                continue;
            }

            // Find Facility in DB
            // 1. Try exact match with filename
            let fIndex = facilities.findIndex(f => f.name.includes(cleanNameHint));
            // 2. If not found, try searching parts
            if (fIndex === -1 && cleanNameHint.length > 2) {
                fIndex = facilities.findIndex(f => f.name.includes(cleanNameHint.substring(0, 2))); // 앞 2글자라도.. (위험하긴 함)
            }

            if (fIndex === -1) {
                console.error(`❌ Facility not found in DB for "${nameHint}" (File: ${file})`);
                failCount++;
                continue;
            }

            // Inject Data
            facilities[fIndex].pricing = pricingData;
            console.log(`✅ Injected into: ${facilities[fIndex].name} (ID: ${facilities[fIndex].id})`);
            successCount++;

        } catch (err) {
            console.error(`💥 Error processing ${file}:`, err);
            failCount++;
        }
    }

    // Save
    fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
    console.log(`\n✨ Finished! Success: ${successCount}, Failed: ${failCount}`);
}

function parsePdfText(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    // Result Structure
    const result = {
        '매장묘': { rows: [] },
        '봉안당': { rows: [] },
        '자연장': { rows: [] },
        '옵션': { rows: [] }
    };

    let currentSection = null; // '매장', '봉안', '자연', '기타'

    // Simple Parsing Logic
    // We look for patterns like "Name ... description ... 100,000"
    // This is heuristic.

    for (const line of lines) {
        // Skip header lines
        if (line.includes("시설사용료 항목") || line.includes("요금(단위:원)")) continue;

        // Try to capture price at the end
        // Regex: (Everything before last digits) (Digits with comma or not at end)
        // Example: "공설공원묘지 사용료 이용자격:해당면 주민 300,000"
        // Note: PDF text extraction might merge columns poorly.
        // Look for lines ending in digits.
        const priceMatch = line.match(/^(.*?)\s+([\d,]+)$/);

        if (priceMatch) {
            let content = priceMatch[1].trim();
            const priceStr = priceMatch[2].replace(/,/g, '');
            const price = parseInt(priceStr);

            if (isNaN(price)) continue;

            // Categorize based on content keywords
            let category = '옵션';
            let isRepresentative = false;

            if (content.includes('사용료') || content.includes('분양') || content.includes('매장') || content.includes('묘지')) {
                category = '매장묘';
                if (content.includes('관리비')) category = '옵션'; // 관리비는 옵션으로
            }
            if (content.includes('봉안') || content.includes('납골')) {
                // But if it says "봉안묘" it might be burial-like, but let's put in Bong-an for now unless user wants strict burial.
                // User focused on Burial (Gold).
                // If the facility is ONLY Bong-an, we put in Bong-an.
                category = '봉안당';
                if (content.includes('관리비')) category = '옵션';
            }
            if (content.includes('자연장') || content.includes('잔디') || content.includes('수목')) {
                category = '자연장';
            }
            // Management fee check again
            if (content.includes('관리비') || content.includes('수수료') || content.includes('석물') || content.includes('작업')) {
                category = '옵션';
            }

            // Representative Logic: The most basic "Usage Fee"
            if (category !== '옵션' && (content.includes('사용료') || content.includes('분양료'))) {
                // If it's the first one found, mark as repr? Or just standard logic.
                // Let's mark simple "사용료" as repr.
                if (!content.includes('합장') && !content.includes('부부')) {
                    isRepresentative = true;
                }
            }

            // Clean Description
            // The content string might contain description mixed in.
            // Heavily Heuristic.
            // Example: "공설공원묘지 사용료 이용자격:해당면 주민 사용기간:15년"
            // Split by known separators if possible.
            let name = content;
            let desc = "";

            // Try to split name and description
            const splitMatch = content.match(/(.*?)\s+(이용자격:|사용기간:|규격:|재질:.*)/);
            if (splitMatch) {
                name = splitMatch[1];
                desc = splitMatch[2];
            }

            // Push to result
            if (result[category]) {
                result[category].rows.push({
                    name: name,
                    price: price,
                    description: desc,
                    isRepresentative: isRepresentative
                });
            }
        }
    }

    // Post-processing: If multiple representatives, keep only the cheapest one per category? 
    // Or just all true. Let's keep all true for now.

    return result;
}

run();
