const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse'); // 텍스트용
const Tesseract = require('tesseract.js'); // 이미지용
const { pdfToPng } = require('pdf-to-png-converter');

const ARCHIVE_DIR = path.join(__dirname, '../archive5');
const JSON_PATH = path.join(__dirname, '../data/facilities.json');

// 줄바꿈이 깨져있을 수 있으므로, 전체 텍스트에서 패턴을 찾거나
// 라인별로 보정해서 처리.
// OCR 텍스트는 띄어쓰기가 불규칙할 수 있음.

async function run() {
    console.log("🚀 Starting Smart Hybrid Auto-Injection (171-175)...");

    const facilities = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));

    const files = fs.readdirSync(ARCHIVE_DIR)
        .filter(f => f.toLowerCase().endsWith('.pdf'))
        .sort((a, b) => parseInt(a) - parseInt(b))
        .filter(f => {
            const num = parseInt(f.split('.')[0]);
            return num >= 171 && num <= 175;
        });

    console.log(`📋 Found ${files.length} files to process.`);

    for (const file of files) {
        try {
            const nameHint = file.replace(/^\d+\./, '').replace(/_price_info\.pdf$/i, '').trim();
            const cleanNameHint = nameHint.replace(/\(.*\)/g, '').trim();
            console.log(`\n📄 Processing [${file}] (${nameHint})...`);

            // 1. Try Text Extraction First
            let text = "";
            try {
                const dataBuffer = fs.readFileSync(path.join(ARCHIVE_DIR, file));
                const data = await pdf(dataBuffer);
                text = data.text;
            } catch (e) { console.log("Text extract failed, trying OCR..."); }

            // 2. If Text is too short, try OCR
            if (text.length < 50) { // 50자 미만이면 이미지로 간주
                console.log("   📸 Image PDF detected. Running OCR...");
                text = await runOCR(path.join(ARCHIVE_DIR, file));
            } else {
                console.log("   📝 Text PDF detected.");
            }

            // 3. Parse Data
            const pricingData = parseText(text);

            if (!pricingData || (isEmpty(pricingData))) {
                console.warn(`⚠️  No pricing data found. Manual check required.`);
                // 실패해도 로그만 남기고 일단 진행 (사용자가 확인하도록)
            } else {
                console.log("   ⚖️  Parsed Data:", JSON.stringify(pricingData, null, 2));
            }

            // 4. Inject into DB (if found)
            const fIndex = facilities.findIndex(f => f.name.includes(cleanNameHint));
            if (fIndex !== -1 && !isEmpty(pricingData)) {
                facilities[fIndex].pricing = pricingData;
                console.log(`✅ Injected into: ${facilities[fIndex].name}`);
            } else {
                console.warn(`❌ Facility not found or empty data. Skipped injection.`);
            }

        } catch (err) {
            console.error(`💥 Error processing ${file}:`, err);
        }
    }

    // Save
    fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
    console.log(`\n✨ Batch Finished.`);
}

async function runOCR(filePath) {
    const pngPages = await pdfToPng(filePath, {
        viewportScale: 2.0, outputFileMask: 'buffer', verbosityLevel: 0
    });
    if (pngPages.length === 0) return "";
    const result = await Tesseract.recognize(pngPages[0].content, 'kor+eng');
    return result.data.text;
}

function isEmpty(pricing) {
    if (!pricing) return true;
    return pricing['매장묘'].rows.length === 0 && pricing['봉안당'].rows.length === 0 && pricing['옵션'].rows.length === 0;
}

function parseText(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const result = { '매장묘': { rows: [] }, '봉안당': { rows: [] }, '옵션': { rows: [] } };

    for (const line of lines) {
        // OCR 특성상 띄어쓰기가 이상할 수 있음. "150, 000" 처럼.
        // 숫자 정제
        const cleanLine = line.replace(/(\d{1,3}),\s?(\d{3})/g, '$1$2').replace(/,/g, '');

        // Find price at end
        // Pattern: Text ... number (optionally '1' quantity at end)
        // Regex to capture: (Content) (Price) (Quantity - optional)
        const match = cleanLine.match(/^(.*?)\s+(\d+)\s*(\d*)$/);

        if (match) {
            const content = match[1];
            const price = parseInt(match[2]);
            const qty = match[3] ? parseInt(match[3]) : 1; // 수량

            if (price < 1000) continue; // 천원 미만은 가격 아닐 확률 높음 (수량이나 번호일 수 있음)
            if (content.includes('합계') || content.includes('http')) continue;

            const finalPrice = Math.floor(price / qty); // 수량이 있으면 단가 계산

            let category = '옵션';
            let isRepresentative = false;

            if (content.includes('사용료') || content.includes('분양') || content.includes('매장')) category = '매장묘';
            if (content.includes('봉안') || content.includes('납골')) category = '봉안당';
            if (content.includes('관리비') || content.includes('수수료') || content.includes('작업')) category = '옵션';

            if (category !== '옵션' && (content.includes('사용료'))) isRepresentative = true;

            result[category].rows.push({
                name: content,
                price: finalPrice,
                description: qty > 1 ? `수량: ${qty}` : "",
                isRepresentative: isRepresentative
            });
        }
    }
    return result;
}

run();
