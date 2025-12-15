const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');

// --- Configuration ---
const INPUT_JSON = 'esky_full_renumbered.json';
const INPUT_CSV = 'data/pricing_all.csv';
const ARCHIVE_DIR = 'archive';
const OUTPUT_DIR = 'data';

// --- mappings ---
const TYPE_TO_FILE = {
    'Charnel': 'pricing_enshrinement.csv',
    'CharnelDet': 'pricing_enshrinement.csv',
    'Cemetery': 'pricing_cemetery.csv',
    'CemeteryDet': 'pricing_cemetery.csv',
    'NaturalBurial': 'pricing_natural.csv',
    'NaturalBurialDet': 'pricing_natural.csv',
    'Crematorium': 'pricing_cremation.csv',
    'CrematoriumDet': 'pricing_cremation.csv'
};

const HEADERS = 'ParkID,ParkName,Category,ItemName,Price,RawText';

// -- Helper: Parse CSV Line properly ---
function parseCsvLine(line) {
    const result = [];
    let current = '';
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
            inQuote = !inQuote;
        } else if (c === ',' && !inQuote) {
            result.push(current);
            current = '';
        } else {
            current += c;
        }
    }
    result.push(current);
    return result.map(col => col.replace(/^"(.*)"$/, '$1').replace(/""/g, '"'));
}

// --- Helper: Categorize Item (New Logic) ---
function categorizeItem(itemName, facilityType) {
    // 1. Common Fees (Cross-type)
    if (/관리비/.test(itemName)) return '관리비'; // Maintenance
    if (/사용료/.test(itemName)) return '기본비용'; // Usage Fee (Generic)
    if (/작업비|이장|개장|벌초/.test(itemName)) return '작업비'; // Service/Labor
    if (/석물|비석|상석|둘레석|평장와비/.test(itemName)) return '석물비'; // Stone
    if (/패|각인|위패|명패/.test(itemName)) return '부대비용'; // Tablet/Engraving
    if (/제사|차례/.test(itemName)) return '부대비용'; // Ritual

    // 2. Type-Specific Categorization
    if (facilityType.includes('Charnel')) {
        // Enshrinement (Bong-an)
        if (/단|부부|개인|로얄|노블|특별|vip|층/.test(itemName.toLowerCase())) return '안치단';
        if (/분양/.test(itemName)) return '안치단';
        // Default for Enshrinement
        return '안치단';
    }

    if (facilityType.includes('Cemetery')) {
        // Cemetery (Mae-jang)
        if (/봉안묘|가족묘|납골묘/.test(itemName)) return '봉안묘'; // Urn Grave
        if (/수목장|자연장|잔디/.test(itemName)) return '자연장'; // Natural in Cemetery
        if (/매장|단장|합장|쌍분/.test(itemName)) return '매장묘';
        // Default for Cemetery
        return '매장묘'; // Assume generic item in cemetery is a Grave
    }

    if (facilityType.includes('Natural')) {
        // Natural (Jayeon-jang)
        if (/수목|소나무|주목|공동목|개인목|부부목/.test(itemName)) return '수목장';
        if (/잔디|화초/.test(itemName)) return '잔디장';
        if (/평장/.test(itemName)) return '평장형';
        return '자연장'; // Default
    }

    if (facilityType.includes('Crematorium')) {
        // Cremation
        if (/화장|대인|소인|사산|유골/.test(itemName)) return '화장비';
        if (/빈소|안치실|접객|예식/.test(itemName)) return '시설사용료';
        if (/관|수의|용품|함/.test(itemName)) return '장례용품';
        return '화장비'; // Default
    }

    return '기타';
}

// --- Helper: Standardize Item (The Core Logic) ---
function standardizeItem(item, facilityType) {
    let { category, itemName, price, rawText } = item;

    // 1. Unification of Fee Names
    if (/(묘원|공설묘지|공동묘지|분묘)\s*사용료/.test(itemName)) itemName = itemName.replace(/(묘원|공설묘지|공동묘지|분묘)\s*사용료/, '묘지사용료');
    if (/(묘원|공설묘지|공동묘지|분묘)\s*관리비/.test(itemName)) itemName = itemName.replace(/(묘원|공설묘지|공동묘지|분묘)\s*관리비/, '묘지관리비');

    if (itemName.endsWith('사용료')) itemName = itemName.replace(/(\s|^)사용료$/, '$1묘지사용료');

    if (/사용료|관리비|작업비|안치비|이장비|개장비/.test(itemName)) {
        itemName = itemName.replace(/(묘지|봉안|매장|수목|자연)(?:\s+)(사용료|관리비)/g, '$1$2').replace(/\s+(비용)/g, '비');
    }

    // Stuck Title Fix
    if (/사용료[가-힣]+/.test(itemName)) {
        itemName = itemName.replace(/(사용료)([가-힣]+)/, '$1 ($2)');
    }

    // 2. Unit/Parenthesis Standardization
    itemName = itemName.replace(/1기\s*기/, '(1기)');
    itemName = itemName.replace(/(\s|^)(1기|1구|1위)(\s|$)/g, '$1($2)$3');
    itemName = itemName.replace(/m2/gi, '㎡');

    itemName = itemName.replace(/\(\s+/g, '(').replace(/\s+\)/g, ')');
    itemName = itemName.replace(/([가-힣])\(/g, '$1 (');
    itemName = itemName.replace(/\(\(/g, '(').replace(/\)\)/g, ')');

    // 3. RawText Formatting
    if (!rawText.includes('[자격:')) {
        if (rawText.includes('관내 거주자')) rawText = '[자격: 관내] / ' + rawText.replace(/\(?관내 거주자\)?/, '');
        if (rawText.includes('관외 거주자')) rawText = '[자격: 관외] / ' + rawText.replace(/\(?관외 거주자\)?/, '');
    }

    // 4. Dimensions Extraction from Title
    const dimRegex = /\(?(\d+[\d\.]*)\s*[xX*]\s*(\d+[\d\.]*)(?:\s*[xX*]\s*(\d+[\d\.]*))?\s*(cm|mm|m|척|자)?\)?/;
    const dimMatch = itemName.match(dimRegex);
    if (dimMatch && !itemName.includes('묘지사용료')) {
        const dimStr = dimMatch[0];
        itemName = itemName.replace(dimStr, '').trim();
        const tag = `[규격: ${dimStr.replace(/[()]/g, '')}]`;
        rawText = rawText ? `${tag} / ${rawText}` : tag;
    }

    // 5. Categorization (NEW)
    category = categorizeItem(itemName, facilityType);

    // Clean
    itemName = itemName.replace(/^\s+|\s+$/g, '').replace(/\s+/g, ' ');
    rawText = rawText.replace(/^\/|\/$/g, '').trim();
    rawText = rawText.replace(/\s{2,}/g, ' ');

    return { category, itemName, price, rawText };
}


// --- Main Execution ---
(async () => {
    // 1. Load JSON and Old CSV
    console.log('Loading data...');
    const jsonContent = fs.readFileSync(INPUT_JSON, 'utf-8');
    const facilities = JSON.parse(jsonContent).list || JSON.parse(jsonContent);
    const facilityMap = {};
    facilities.forEach(f => {
        facilityMap[f.rno] = {
            name: f.companyname,
            type: f.type,
            id: `park-${String(f.rno).padStart(4, '0')}`
        };
    });

    const results = {};
    Object.values(TYPE_TO_FILE).forEach(f => results[f] = []);

    // 2. Process Old CSV (1-508)
    if (fs.existsSync(INPUT_CSV)) {
        const csvContent = fs.readFileSync(INPUT_CSV, 'utf-8');
        const lines = csvContent.split('\n');
        lines.forEach((line, idx) => {
            if (idx === 0 || !line.trim()) return;
            const cols = parseCsvLine(line);
            if (cols.length < 6) return;

            const [parkId, parkName, cat, item, price, raw] = cols;
            const rno = parseInt(parkId.replace('park-', ''));
            const fInfo = facilityMap[rno];
            const targetType = fInfo ? fInfo.type : 'Charnel';

            // Re-standardize AND Re-Categorize
            const std = standardizeItem({
                category: cat, // Will be overwritten
                itemName: item,
                price: price,
                rawText: raw
            }, targetType);

            const targetFile = TYPE_TO_FILE[targetType] || 'pricing_enshrinement.csv';
            results[targetFile].push({ ...std, parkId, parkName });
        });
        console.log(`Loaded and re-processed items from ${INPUT_CSV}`);
    }

    // 3. Process New Data (509-1498)
    const sortedRnos = Object.keys(facilityMap).map(Number).sort((a, b) => a - b);

    for (const rno of sortedRnos) {
        if (rno <= 508) continue;

        const fInfo = facilityMap[rno];
        const parkId = fInfo.id;
        const parkName = fInfo.name;
        const targetType = fInfo.type;
        const targetFile = TYPE_TO_FILE[targetType] || 'pricing_enshrinement.csv';

        const archiveRoot = fs.readdirSync(ARCHIVE_DIR);
        const dirName = archiveRoot.find(d => d.startsWith(`${rno}.`));
        if (!dirName) continue;

        const dirPath = path.join(ARCHIVE_DIR, dirName);
        if (!fs.statSync(dirPath).isDirectory()) continue;
        const pdfFile = fs.readdirSync(dirPath).find(f => f.endsWith('.pdf'));

        if (pdfFile) {
            try {
                const pdfPath = path.join(dirPath, pdfFile);
                const dataBuffer = fs.readFileSync(pdfPath);
                const data = await pdf(dataBuffer);
                const text = data.text;

                const lines = text.split('\n');
                lines.forEach(line => {
                    line = line.trim();
                    if (!line) return;

                    if (/[\d,]+\s+\d{1,2}$/.test(line)) {
                        line = line.replace(/([\d,]+)\s+\d{1,2}$/, '$1');
                    }

                    const priceRegex = /([\d,]+)(?:원)?$/;
                    const match = line.match(priceRegex);
                    if (match) {
                        let priceStr = match[1].replace(/,/g, '');
                        if (priceStr.length > 5 && priceStr.endsWith('1')) {
                            priceStr = priceStr.slice(0, -1);
                        }
                        if (priceStr.length < 4) return;

                        let strName = line.replace(match[0], '').trim();
                        if (strName.length < 2) return;

                        const std = standardizeItem({
                            category: '', // Will be computed
                            itemName: strName,
                            price: priceStr,
                            rawText: ''
                        }, targetType);

                        results[targetFile].push({ ...std, parkId, parkName });
                    }
                });
            } catch (e) {
                // Ignore PDF errors
            }
        }
    }

    // 4. Write Files
    for (const [filename, items] of Object.entries(results)) {
        if (items.length === 0) continue;

        const filePath = path.join(OUTPUT_DIR, filename);
        const header = HEADERS + '\n';
        const rows = items.map(i => {
            const name = `"${i.itemName.replace(/"/g, '""')}"`;
            const raw = `"${i.rawText.replace(/"/g, '""')}"`;
            return `${i.parkId},${i.parkName},${i.category},${name},${i.price},${raw}`;
        }).join('\n');

        fs.writeFileSync(filePath, header + rows);
        console.log(`Analyzed ${items.length} items for ${filename}`);
    }

})();
