const fs = require('fs');
const pdf = require('pdf-parse');

const TARGET_ID = '511'; // 해인사 고불암무량수전
const PDF_PATH = 'archive/511.해인사 고불암무량수전/511.해인사 고불암무량수전_price_info.pdf';
const DB_PATH = 'data/pricing_class_final.json';

async function main() {
    console.log(`🚀 Re-extracting for Facility ID: ${TARGET_ID} (Regex Mode)`);

    const dataBuffer = fs.readFileSync(PDF_PATH);
    const pdfData = await pdf(dataBuffer);

    const lines = pdfData.text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const newItems = [];

    // Regex to split Title and Price
    // Example: "2A 방 일반 (부부)1단9,000,000" -> Title: "2A 방 일반 (부부)1단", Price: "9,000,000"
    // Heuristic: Last chunk of digits/commas is price.

    lines.forEach(line => {
        // Extract Price candidates at the end
        const match = line.match(/(.*?)(\d{1,3}(,\d{3})+)$/);

        if (match) {
            let title = match[1].trim();
            let priceRaw = match[2];
            let price = parseInt(priceRaw.replace(/,/g, ''));

            if (price > 1000) { // Valid price
                newItems.push({
                    id: TARGET_ID,
                    parkId: TARGET_ID,
                    parkName: '해인사 고불암무량수전',
                    institutionType: '사설', // Hardcode or infer
                    category1: '봉안당', // Seems like Charnel House mostly
                    category2: '',
                    category3: '재추출(Regex)',
                    itemName1: '',
                    itemName2: title,
                    rawText: title, // Description same as title for now
                    price: price
                });
            }
        } else {
            // Fallback for lines without commas but are prices (e.g. 5000000)
            // Or lines that are just numbers
            const simplePriceMatch = line.match(/^(\D*)([0-9]+)$/);
            if (simplePriceMatch && simplePriceMatch[2].length > 4) {
                let title = simplePriceMatch[1].trim();
                let price = parseInt(simplePriceMatch[2]);
                newItems.push({
                    id: TARGET_ID,
                    parkId: TARGET_ID,
                    parkName: '해인사 고불암무량수전',
                    institutionType: '사설',
                    category1: '봉안당',
                    category2: '',
                    category3: '재추출(Simple)',
                    itemName1: '',
                    itemName2: title,
                    rawText: title,
                    price: price
                });
            }
        }
    });

    console.log(`✅ Extracted ${newItems.length} items from PDF.`);

    // Check samples
    if (newItems.length > 0) {
        console.log('Sample:', newItems[0]);
    }

    // Update DB
    const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    const filteredDb = db.filter(item => String(item.id) !== TARGET_ID && String(item.parkId) !== TARGET_ID);
    const finalDb = [...filteredDb, ...newItems];

    fs.writeFileSync(DB_PATH, JSON.stringify(finalDb, null, 2));
    console.log(`💾 Updated DB. Total items: ${finalDb.length}`);
}

main().catch(console.error);
