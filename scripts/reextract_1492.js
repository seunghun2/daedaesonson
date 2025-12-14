const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');

const TARGET_ID = '1492';
const PDF_PATH = 'archive/1492.창원시립상복공원/1492.창원시립상복공원_price_info.pdf';
const DB_PATH = 'data/pricing_class_final.json';

// Helper to clean price
function parsePrice(text) {
    // Look for numbers like 1,000,000 or 50000 at the end
    const match = text.match(/([0-9,]+)원?/);
    if (match) {
        return parseInt(match[1].replace(/,/g, ''));
    }
    return 0;
}

async function main() {
    console.log(`🚀 Re-extracting for Facility ID: ${TARGET_ID}`);

    if (!fs.existsSync(PDF_PATH)) {
        console.error('❌ PDF file not found:', PDF_PATH);
        return;
    }

    const dataBuffer = fs.readFileSync(PDF_PATH);
    const pdfData = await pdf(dataBuffer);

    // Split by lines
    const lines = pdfData.text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    console.log(`📄 Found ${lines.length} lines of text.`);

    const newItems = [];

    lines.forEach(line => {
        // Simple Heuristic: If line has a big number > 1000, it's a price line
        const price = parsePrice(line);

        if (price > 1000) {
            // This is a potential item
            newItems.push({
                id: TARGET_ID,
                parkName: '창원시립상복공원', // Hardcoded for this fix
                institutionType: '공설',
                category1: '기타', // Need manual review or smart guess
                category2: '',
                category3: '재추출',
                itemName1: '',
                itemName2: line, // Save full line as title for now
                rawText: line,
                price: price
            });
        }
    });

    console.log(`✅ Extracted ${newItems.length} items from PDF.`);

    // Update DB
    const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));

    // Remove OLD items for this park
    const filteredDb = db.filter(item => String(item.id) !== TARGET_ID && String(item.parkId) !== TARGET_ID);

    // Add NEW items
    const finalDb = [...filteredDb, ...newItems];

    fs.writeFileSync(DB_PATH, JSON.stringify(finalDb, null, 2));
    console.log(`💾 Updated DB. Total items: ${finalDb.length}`);
}

main().catch(console.error);
