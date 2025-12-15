const fs = require('fs');
const path = require('path');
const Tesseract = require('tesseract.js');

const IMAGE_DIR = path.join(__dirname, '../archive5_images');
const JSON_PATH = path.join(__dirname, '../data/facilities.json');

async function run() {
    console.log("🚀 Starting Image OCR Auto-Injection (171-175)...");

    // 1. Get List of Files
    const allFiles = fs.readdirSync(IMAGE_DIR);
    const targetFiles = allFiles.filter(f => {
        const match = f.match(/^(\d+)\./);
        if (!match) return false;
        const num = parseInt(match[1]);
        return num >= 171 && num <= 175;
    }).sort((a, b) => {
        const numA = parseInt(a.split('.')[0]);
        const numB = parseInt(b.split('.')[0]);
        return numA - numB;
    });

    console.log(`📋 Found ${targetFiles.length} images to process.`);

    const facilities = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));

    for (const file of targetFiles) {
        try {
            const filePath = path.join(IMAGE_DIR, file);
            const nameHint = file.replace(/^\d+\./, '').replace(/_price_info.*$/, '').trim();
            const cleanNameHint = nameHint.replace(/\(.*\)/g, '').trim();

            console.log(`\n📸 Processing [${file}] (${nameHint})...`);

            // 2. Run OCR
            const result = await Tesseract.recognize(filePath, 'kor+eng');
            const text = result.data.text;

            // console.log("   📝 Extracted Text Preview:", text.substring(0, 100).replace(/\n/g, ' '));

            // 3. Parse Data
            const pricingData = parseText(text);

            if (isEmpty(pricingData)) {
                console.warn(`⚠️  No pricing data found. Check manually.`);
                continue;
            }

            console.log("   ⚖️  Parsed Data:", JSON.stringify(pricingData, null, 2));

            // 4. Inject
            const fIndex = facilities.findIndex(f => f.name.includes(cleanNameHint));
            if (fIndex !== -1) {
                facilities[fIndex].pricing = pricingData;
                console.log(`✅ Injected into: ${facilities[fIndex].name}`);
            } else {
                console.warn(`❌ Facility not found in DB: ${cleanNameHint}`);
            }

        } catch (err) {
            console.error(`💥 Error processing ${file}:`, err);
        }
    }

    // Save
    fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
    console.log(`\n✨ Batch 171-175 Finished.`);
}

function isEmpty(pricing) {
    if (!pricing) return true;
    return pricing['매장묘'].rows.length === 0 && pricing['봉안당'].rows.length === 0 && pricing['옵션'].rows.length === 0;
}

function parseText(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const result = { '매장묘': { rows: [] }, '봉안당': { rows: [] }, '옵션': { rows: [] } };

    for (const line of lines) {
        // 숫자, 쉼표, 공백 처리 (예: "300, 000" -> "300000")
        const cleanLine = line.replace(/(\d{1,3}),\s?(\d{3})/g, '$1$2').replace(/,/g, '');

        // 패턴: (문자열) (숫자) (선택적 숫자 1)
        // 예: "공설공원묘지 사용료 ... 300000 1"
        const match = cleanLine.match(/^(.*?)\s+(\d+)\s*(\d*)$/);

        if (match) {
            const content = match[1].trim();
            const price = parseInt(match[2]);
            const qty = match[3] ? parseInt(match[3]) : 1;

            if (price < 1000) continue;
            if (content.includes('합계') || content.includes('http')) continue;
            // "055-..." 전화번호 제외
            if (content.match(/\d{2,3}-\d{3,4}/)) continue;

            const finalPrice = Math.floor(price / qty);

            let category = '옵션';
            let isRepresentative = false;

            if (content.includes('사용료') || content.includes('분양') || content.includes('매장')) category = '매장묘';
            if (content.includes('봉안') || content.includes('납골')) category = '봉안당';
            if (content.includes('관리비') || content.includes('수수료') || content.includes('작업') || content.includes('석물')) category = '옵션';

            if (category !== '옵션' && content.includes('사용료')) isRepresentative = true;

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
