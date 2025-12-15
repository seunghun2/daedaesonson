const fs = require('fs');
const pdf = require('pdf-parse');
const { glob } = require('glob');

const DB_PATH = 'data/pricing_class_final.json';

// Simple Price Parser
function parsePrice(text) {
    const match = text.match(/([0-9,]+)원?$/);
    if (!match) return 0;
    return parseInt(match[1].replace(/,/g, ''));
}

async function main() {
    console.log('🚀 Checking for missing IDs (1-1498)...');

    let db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    const existingIds = new Set(db.map(d => parseInt(d.parkId || d.id)));

    const targetList = [];

    // 1. Find Missing IDs & PDFs
    for (let i = 1; i <= 1498; i++) {
        if (!existingIds.has(i)) {
            // Try explicit naming first defined by user structure
            let files = await glob(`archive/${i}.*/*price*.pdf`);

            // Fallback search
            if (files.length === 0) {
                files = await glob(`archive/**/*${i}*price*.pdf`);
            }

            // Exclude false positives (e.g. searching for '1' finds '100')
            // But strict path structure 'archive/1.name/...' usually protects this.

            if (files.length > 0) {
                targetList.push({ id: i, path: files[0] });
            }
        }
    }

    console.log(`🔎 Found ${targetList.length} missing facilities that have PDFs.`);

    // 2. Extract Data
    const newItems = [];

    for (const target of targetList) {
        console.log(`Processing ID ${target.id}: ${target.path}...`);

        try {
            const dataBuffer = fs.readFileSync(target.path);
            const pdfData = await pdf(dataBuffer);
            const lines = pdfData.text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

            // Parsing Logic: Capture "시설사용료" and "서비스 항목" sections
            // But since these PDFs vary wildly, we will use the Robust Line Parser (Text + Price on same line)
            // or Context Merge from previous logic.

            let prevLine = '';
            lines.forEach(line => {
                const price = parsePrice(line);

                // Heuristic: Line must have text AND a price > 1000
                // Also check if line contains "시설사용료" or "서비스" is not necessary for row extraction, 
                // but we want to capture rows UNDER those headers.
                // For now, grab ANYTHING with a price.

                if (price > 1000) {
                    // Clean numeric garbage from text
                    let text = line.replace(/[0-9,]+원?$/, '').trim();

                    // If text is too short, verify with previous line
                    if (text.length < 2 && prevLine.length > 2) {
                        text = prevLine + ' ' + text;
                    }

                    if (text.length > 1) {
                        newItems.push({
                            id: String(target.id),
                            parkId: String(target.id),
                            parkName: '미상(자동복구)', // We could parse from folder name
                            institutionType: '미분류',
                            category1: '기타',
                            category2: '',
                            category3: '누락복구',
                            itemName1: '',
                            itemName2: text,
                            rawText: line,
                            price: price
                        });
                    }
                }
                prevLine = line;
            });

        } catch (e) {
            console.error(`❌ Error parsing PDF for ${target.id}:`, e);
        }
    }

    console.log(`✅ Recovered ${newItems.length} items from missing facilities.`);

    // 3. Update Park Names from Folder Path
    // "archive/511.해인사 고불암무량수전/..." -> Extract "해인사 고불암무량수전"
    targetList.forEach(t => {
        const folderName = t.path.split('/')[1]; // archive/NAME/...
        let name = folderName;
        // Remove "123." prefix
        if (name.includes('.')) {
            name = name.split('.').slice(1).join('.').trim();
        }

        // Apply to new items
        newItems.forEach(item => {
            if (item.id === String(t.id)) {
                item.parkName = name;
            }
        });
    });

    // 4. Save
    const finalDb = [...db, ...newItems];
    fs.writeFileSync(DB_PATH, JSON.stringify(finalDb, null, 2));
    console.log(`💾 DB Updated! Total items: ${finalDb.length}`);
}

main().catch(console.error);
