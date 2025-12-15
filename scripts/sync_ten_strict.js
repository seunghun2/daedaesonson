const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

const DATA_FILE = path.join(__dirname, '../data/facilities.json');
const ARCHIVE_DIR = path.join(__dirname, '../archive');
const PUBLIC_UPLOADS_DIR = path.join(__dirname, '../public/uploads');

// Utility to remove "AI" related words
function cleanAiText(text) {
    if (!text) return text;
    return text.replace(/\(AI추출\)/g, '').replace(/AI추출/g, '').replace(/\(AI\)/g, '').replace(/AI/g, '').trim();
}

// Utility to normalize spaces
function normalizeSpaces(text) {
    return text.replace(/\s+/g, ' ').trim();
}

async function parsePricePdf(pdfPath) {
    try {
        const dataBuffer = fs.readFileSync(pdfPath);
        const data = await pdf(dataBuffer);
        const text = data.text;

        // Robust Parsing Logic
        // 1. Split lines
        const rawLines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const priceTable = {};

        // Initialize Groups
        priceTable['기본비용'] = { unit: '원', rows: [], category: 'BASIC_COST' };
        priceTable['[별도] 시설설치비'] = { unit: '원', rows: [], category: 'INSTALLATION' };
        priceTable['[안내] 관리비 및 기타'] = { unit: '원', rows: [], category: 'MANAGEMENT' };

        // Helper: Classify Logic
        const classifyItem = (rawName, price) => {
            const n = rawName.replace(/\s/g, '');

            // 1. Installation / Construction / Stone (Strong Signals)
            if (n.includes('작업') || n.includes('시공') || n.includes('설치') || n.includes('석물') || n.includes('비석') ||
                n.includes('상석') || n.includes('각자') || n.includes('조각') || n.includes('테두리') || n.includes('식재') ||
                n.includes('제거') || n.includes('수선') || n.includes('화분') || n.includes('향로') || n.includes('판석') ||
                n.includes('둘레석') || n.includes('와비') || n.includes('경계석')) {
                return '[별도] 시설설치비';
            }

            // 2. Services / Minor Mgmt
            if (n.includes('벌초') || n.includes('제사') || n.includes('의전') || n.includes('개장') || n.includes('이장') ||
                n.includes('대여') || n.includes('식사') || n.includes('유골함')) {
                return '[안내] 관리비 및 기타';
            }

            // 3. Basic Cost (Usage, Main Mgmt)
            if (n.includes('사용료') || n.includes('분양') || n.includes('안치') || n.includes('관리비')) {
                return '기본비용';
            }

            // 4. Fallback Heuristics
            // If it sounds like a Product (e.g. "Personal Grave", "Couple Grave")
            if (n.includes('단') || n.includes('묘') || n.includes('장') || n.includes('기')) {
                if (price > 1000000) return '기본비용'; // Expensive product -> Basic
            }

            // Default to Installation if unknown small item, or Basic if unknown big item
            return price > 1000000 ? '기본비용' : '[별도] 시설설치비';
        };

        // 2. Iterate and Merge Context
        for (let i = 0; i < rawLines.length; i++) {
            let line = rawLines[i];

            // Regex: Ends with Price (e.g. 5,000,000 or 50000)
            // Allow optional "원" or "만원"
            const priceMatch = line.match(/(.+?)\s*([\d,]+)(원|만원)?$/);

            if (priceMatch) {
                let rawName = cleanAiText(priceMatch[1]);
                let priceStr = priceMatch[2].replace(/,/g, '');
                let price = parseInt(priceStr, 10);

                // --- CONTEXT MERGE HEURISTIC ---
                // If name is short, or starts with special chars like ')' ordigits,
                // it might be a continuation of the previous line.
                // e.g. previous: "Premium Grave" current: "(Type A) 5000000"

                if (i > 0) {
                    const prevLine = rawLines[i - 1];
                    // Condition to merge: 
                    // 1. Name is very short (< 2 chars)
                    // 2. Name starts with ')' or ']' or digits
                    // 3. Name looks like a suffix
                    if (rawName.length < 2 || /^[)\]}\d]/.test(rawName) || rawName === '000') {
                        rawName = prevLine + ' ' + rawName;
                    }
                }

                // Final Cleanup after merge
                rawName = cleanAiText(rawName);
                // Remove leading garbage (e.g. "1. ")
                rawName = rawName.replace(/^\d+[\.\)]\s*/, '');

                // --- NOISE FILTER ---
                if (price < 1000) continue;
                if (rawName.replace(/[\d,]/g, '').trim() === '원') continue; // Only "원" left
                if (/^\d+$/.test(rawName.replace(/,/g, ''))) continue; // Only digits
                if (rawName.includes('000원')) continue; // "000원" error
                if (rawName.length < 2) continue;

                // --- APPLY CLASSIFIER ---
                const targetGroup = classifyItem(rawName, price);

                // Check dupes in group
                const exists = priceTable[targetGroup].rows.find(r => r.name === rawName && r.price === price);
                if (!exists) {
                    priceTable[targetGroup].rows.push({
                        name: rawName,
                        price: price,
                        grade: ''
                    });
                }
            }
        }

        // 3. STRICT SORTING (Usage > Management)
        if (priceTable['기본비용'].rows.length > 0) {
            const usageRows = [];
            const manageRows = [];
            const otherRows = [];

            priceTable['기본비용'].rows.forEach(row => {
                const n = row.name.replace(/\s/g, '');
                if (n.includes('사용료') || n.includes('분양')) {
                    usageRows.push(row);
                } else if (n.includes('관리비')) {
                    manageRows.push(row);
                } else {
                    otherRows.push(row);
                }
            });

            usageRows.sort((a, b) => b.price - a.price); // Expensive first
            manageRows.sort((a, b) => a.price - b.price); // Cheap first

            priceTable['기본비용'].rows = [...usageRows, ...manageRows, ...otherRows];
        }

        // Cleanup Empty
        Object.keys(priceTable).forEach(k => {
            if (priceTable[k].rows.length === 0) delete priceTable[k];
        });

        return priceTable;

    } catch (e) {
        console.error(`Error parsing PDF ${pdfPath}:`, e.message);
        return null; // Return null to indicate failure/keep existing if we wanted, but here we overwrite so...
    }
}

(async () => {
    console.log("=== Syncing TOP 10 Facilities (Strict Mode) ===");

    // 1. Load Data
    const facilities = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

    // 2. Identify Top 10 (Assume they are already sorted by previous script!)
    const targets = facilities.slice(0, 10);

    // 3. Process
    for (let i = 0; i < targets.length; i++) {
        const item = targets[i];
        const sortNum = i + 1; // 1-based index

        console.log(`[${sortNum}] Processing: ${item.name} ...`);

        // Find Folder
        // Heuristic: Folder starts with "sortNum." 
        // We iterate folders to find match because of (재) normalization issues
        const folders = fs.readdirSync(ARCHIVE_DIR).filter(f => !f.startsWith('.'));
        const targetFolder = folders.find(f => {
            return f.startsWith(`${sortNum}.`) || f.includes(item.name.replace(/\(.*\)/g, '').trim());
        });

        if (!targetFolder) {
            console.log(`   ⚠️ Folder not found for ${item.name}`);
            continue;
        }

        const facilityFolder = path.join(ARCHIVE_DIR, targetFolder);

        // A. WIPE & REPLACE IMAGES
        const targetUploadDir = path.join(PUBLIC_UPLOADS_DIR, item.id);

        // Clean existing
        if (fs.existsSync(targetUploadDir)) {
            fs.rmSync(targetUploadDir, { recursive: true, force: true });
        }
        fs.mkdirSync(targetUploadDir, { recursive: true });

        // Copy new
        const photosDir = path.join(facilityFolder, 'photos');
        let newImages = [];
        if (fs.existsSync(photosDir)) {
            const photos = fs.readdirSync(photosDir).filter(p => !p.startsWith('.'));
            photos.sort(); // alphabet sort 001, 002...

            photos.forEach(p => {
                const src = path.join(photosDir, p);
                const dest = path.join(targetUploadDir, p);
                fs.copyFileSync(src, dest);
                newImages.push(`/uploads/${item.id}/${p}`);
            });
            console.log(`   📸 Replaced ${newImages.length} images.`);
        }
        item.imageGallery = newImages;

        // B. STRICT PRICE PARSE
        // Find PDF (usually _price_info.pdf or [Folder]_price_info.pdf)
        const folderPdf = fs.readdirSync(facilityFolder).find(f => f.toLowerCase().endsWith('.pdf'));
        if (folderPdf) {
            const pdfPath = path.join(facilityFolder, folderPdf);
            const priceTable = await parsePricePdf(pdfPath);

            if (priceTable) {
                if (!item.priceInfo) item.priceInfo = {};
                item.priceInfo.priceTable = priceTable;
                console.log(`   💰 Updated Price Info (Strict Sorted, No AI tags).`);
            }
        } else {
            console.log(`   ⚠️ No PDF found.`);
        }

    }

    // 4. Save
    // We only modified the objects in the array. 'facilities' variable holds references.
    // So writing 'facilities' should work.
    fs.writeFileSync(DATA_FILE, JSON.stringify(facilities, null, 2));
    console.log("✅ Sync Complete for Top 10.");

})();
