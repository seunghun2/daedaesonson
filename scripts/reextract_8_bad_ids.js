const fs = require('fs');
const pdf = require('pdf-parse');
const { glob } = require('glob');

const TARGET_IDS = ['155', '440', '444', '446', '459', '460', '465', '560'];
const DB_PATH = 'data/pricing_class_final.json';

// Helper to clean price
function parsePrice(text) {
    const match = text.match(/([0-9,]+)원?/);
    if (!match) return 0;
    return parseInt(match[1].replace(/,/g, ''));
}

async function findPdf(id) {
    const files = await glob(`archive/**/*${id}*price*.pdf`);
    return files.length > 0 ? files[0] : null;
}

async function main() {
    console.log(`🚀 Checking 8 suspiciously bad facilities...`);

    let db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));

    // 1. CLEANUP: Remove garbage items ("총매장능력" etc)
    const keywords = ['총매장능력', '개편의시설', '안치능력', '총안치', '주차가능', '부지면적'];
    const originalLength = db.length;

    db = db.filter(d => {
        const text = (d.itemName2 || '') + (d.rawText || '');
        // Keep if DOES NOT contain any bad keywords
        return !keywords.some(k => text.includes(k));
    });
    console.log(`🧹 Removed ${originalLength - db.length} garbage items (Total Capacity info).`);

    // 2. RE-EXTRACT for target IDs
    let totalNewItems = [];

    for (const id of TARGET_IDS) {
        const pdFPath = await findPdf(id);

        let foundAny = false;

        if (pdFPath) {
            console.log(`Processing ID ${id}: ${pdFPath}...`);
            try {
                const dataBuffer = fs.readFileSync(pdFPath);
                const pdfData = await pdf(dataBuffer);
                const lines = pdfData.text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

                let prevLine = '';
                lines.forEach(line => {
                    const price = parsePrice(line);
                    if (price > 1000) {
                        let text = line.replace(/[0-9,]+원?$/, '').trim();
                        if (text.length < 2 && prevLine.length > 2) text = prevLine + ' ' + text;

                        if (text.length > 1) {
                            totalNewItems.push({
                                id: id,
                                parkId: id,
                                parkName: '미상(자동복구)',
                                institutionType: '미분류',
                                category1: '기타',
                                category2: '',
                                category3: '재추출(BadID)',
                                itemName1: '',
                                itemName2: text,
                                rawText: line,
                                price: price
                            });
                            foundAny = true;
                        }
                    }
                    prevLine = line;
                });
            } catch (e) {
                console.error(`❌ PDF parse error for ${id}`);
            }
        }

        // If still nothing found (or no PDF), mark as "No Info"
        if (!foundAny) {
            console.log(`⚠️ No valid pricing found for ${id}. Marking as "정보없음".`);
            totalNewItems.push({
                id: id,
                parkId: id,
                parkName: '미상',
                institutionType: '미분류',
                category1: '정보없음',
                category2: '',
                category3: '확인필요',
                itemName1: '',
                itemName2: '가격 정보 없음 (PDF 확인 필요)',
                rawText: '자동 추출 실패',
                price: 0
            });
        }
    }

    // 3. Update DB
    // Remove OLD items for these targets (they were garbage anyway)
    db = db.filter(item => !TARGET_IDS.includes(String(item.parkId || item.id)));

    const finalDb = [...db, ...totalNewItems];
    fs.writeFileSync(DB_PATH, JSON.stringify(finalDb, null, 2));
    console.log(`💾 DB Updated! Total items: ${finalDb.length}`);
}

main().catch(console.error);
