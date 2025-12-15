const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');
const { glob } = require('glob');

// BAD IDs detected
const TARGET_IDS = [
    '13', '77', '147', '160', '165', '192', '259', '267', '281',
    '284', '305', '306', '308', '309', '323', '330', '332', '431',
    '552', '581', '585', '600', '605', '621', '630', '635', '646',
    '650', '717', '718', '733', '784', '850', '1166', '1183', '1199',
    '1206', '1236', '1266', '1272', '1457', '1460', '1482', '1496', '1492'
];

const DB_PATH = 'data/pricing_class_final.json';

// Helper to clean price
function parsePrice(text) {
    const match = text.match(/([0-9,]+)원?/);
    if (match) {
        return parseInt(match[1].replace(/,/g, ''));
    }
    return 0;
}

// Helper to find PDF
async function findPdf(id) {
    const files = await glob(`archive/**/*${id}*price*.pdf`);
    return files.length > 0 ? files[0] : null;
}

async function main() {
    console.log(`🚀 Starting Batch Re-extraction for ${TARGET_IDS.length} facilities...`);

    let db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    let totalNewItems = [];
    let processedIds = new Set();

    for (const id of TARGET_IDS) {
        const pdFPath = await findPdf(id);
        if (!pdFPath) {
            console.log(`⚠️ PDF not found for ID: ${id}`);
            continue;
        }

        console.log(`Processing ID: ${id} (${pdFPath})...`);
        processedIds.add(id);

        try {
            const dataBuffer = fs.readFileSync(pdFPath);
            const pdfData = await pdf(dataBuffer);

            // Split by lines
            const lines = pdfData.text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

            let prevLine = '';

            lines.forEach(line => {
                const price = parsePrice(line);

                // Check if line is MOSTLY numbers (e.g. "100,000" or "50,000원")
                const isPriceOnly = line.replace(/[0-9,원\s]/g, '').length < 3;

                // If it's a valid price > 1000
                if (price > 1000) {
                    let title = line;

                    // If current line is just a price, PREPEND the previous line (it's likely the title)
                    if (isPriceOnly && prevLine.length > 0) {
                        title = prevLine + ' ' + line;
                    }

                    totalNewItems.push({
                        id: id,
                        parkId: id,
                        parkName: '',
                        institutionType: '미분류',
                        category1: '기타', // Will be refined later
                        category2: '',
                        category3: '재추출(병합)',
                        itemName1: '',
                        itemName2: title, // Merged Title
                        rawText: title,
                        price: price
                    });
                }

                prevLine = line; // Save for next iteration
            });
        } catch (e) {
            console.error(`❌ Error parsing PDF for ${id}:`, e);
        }
    }

    console.log(`✅ Extracted TOTAL ${totalNewItems.length} new items.`);

    // Remove OLD items for these IDs
    db = db.filter(item => !processedIds.has(String(item.parkId || item.id)));

    // Add NEW items
    // (Optional: Try to recover parkName from deleted items if possible, purely separate logic)

    // Wait, we lost parkName! We need to map it back from old DB or somewhere.
    // Let's create a map from old DB parkNames before deleting.

    // RELOAD DB to be safe
    const oldDb = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    const nameMap = {};
    oldDb.forEach(d => {
        if (d.parkName) nameMap[String(d.parkId || d.id)] = d.parkName;
        if (d.institutionType) nameMap[String(d.parkId || d.id) + '_type'] = d.institutionType;
    });

    totalNewItems = totalNewItems.map(item => ({
        ...item,
        parkName: nameMap[item.id] || '알수없음',
        institutionType: nameMap[item.id + '_type'] || '미분류'
    }));

    const finalDb = [...db, ...totalNewItems];

    fs.writeFileSync(DB_PATH, JSON.stringify(finalDb, null, 2));
    console.log(`💾 DB Updated! Total items: ${finalDb.length}`);
}

main().catch(console.error);
