const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

// Regex Patterns for cleaning
const TYPE_PATTERNS = [
    { type: 'FOUNDATION', regex: /^(\(재\)|재단법인\s*|재\))/ },
    { type: 'CORPORATION', regex: /^(\(주\)|주식회사\s*|주\))/ },
    { type: 'RELIGIOUS', regex: /^(\(종\)|종교법인\s*)/ },
    { type: 'ASSOCIATION', regex: /^(\(사\)|사단법인\s*)/ },
    { type: 'Public', regex: /공설/ }
];

function cleanName(rawName) {
    let name = rawName.trim();
    let detectedType = null;
    for (const p of TYPE_PATTERNS) {
        if (p.regex.test(name)) {
            detectedType = p.type;
            name = name.replace(p.regex, '').trim();
            break;
        }
    }
    return { name, type: detectedType };
}

const ARCHIVE_DIR = path.join(__dirname, '../archive');
const DATA_FILE = path.join(__dirname, '../data/facilities.json');
const PUBLIC_DIR = path.join(__dirname, '../public');

function convertM2ToPyung(text) {
    return text.replace(/([\d,.]+)\s*(m2|㎡)/gi, (match, numStr, unit) => {
        const num = parseFloat(numStr.replace(/,/g, ''));
        if (isNaN(num)) return match;
        const pyung = (num * 0.3025).toFixed(1);
        return `${pyung}평`;
    });
}

function parsePriceInfoFromText(text) {
    const lines = text.split('\n');
    const priceTable = {};

    lines.forEach(line => {
        const cleanLine = line.trim();
        if (!cleanLine) return;

        const convertedLine = convertM2ToPyung(cleanLine);

        let price = 0;
        let name = '';

        const manwonMatch = convertedLine.match(/([\d,]+)\s*만원/);
        const wonMatch = convertedLine.match(/([\d,]+)\s*원/);

        if (manwonMatch) {
            price = parseInt(manwonMatch[1].replace(/,/g, ''), 10) * 10000;
            name = convertedLine.replace(manwonMatch[0], '').trim();
        } else if (wonMatch) {
            const val = parseInt(wonMatch[1].replace(/,/g, ''), 10);
            if (val > 1000) {
                price = val;
                name = convertedLine.replace(wonMatch[0], '').trim();
            }
        }

        if (price > 0 && name.length > 1) {
            let namePart = name;
            let gradePart = '';

            const gradeMatch = namePart.match(/(\d+\s*(평|평형|년|위|기|분|실).*)/);
            if (gradeMatch) {
                gradePart = gradeMatch[1].trim();
                namePart = namePart.replace(gradeMatch[0], '').trim();
            }

            namePart = namePart.replace(/[|│]/g, ' ').replace(/\s+/g, ' ').trim();

            let type = 'PRODUCT';
            if (namePart.includes('벌초') || namePart.includes('제사')) type = 'MANAGEMENT';
            else if (namePart.includes('석물') || namePart.includes('작업') || namePart.includes('비석')) type = 'INSTALLATION';
            else if (namePart.includes('사용료') || namePart.includes('분양') || namePart.includes('기본') || namePart.startsWith('관리비')) type = 'BASIC_COST';

            let groupKey = '기본비용';
            if (type === 'MANAGEMENT') groupKey = '[안내] 관리비 및 용역비';
            else if (type === 'INSTALLATION') groupKey = '[별도] 시설설치 및 석물비용';
            else if (namePart.includes('봉안')) groupKey = '봉안당';
            else if (namePart.includes('수목') || namePart.includes('자연')) groupKey = '수목장';
            else if (namePart.includes('매장')) groupKey = '매장묘';

            if (!priceTable[groupKey]) {
                priceTable[groupKey] = { unit: '원', rows: [] };
            }

            priceTable[groupKey].rows.push({
                name: namePart,
                price: price,
                grade: gradePart
            });
        }
    });

    return { priceTable };
}

(async () => {
    console.log("Syncing '낙원추모공원' - RESTORING RAW NAME with Prefix...");

    // 1. Load JSON
    let jsonData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

    // 2. Archive Folder Map
    const folders = fs.readdirSync(ARCHIVE_DIR).filter(f => !f.startsWith('.'));
    const foldersMap = {};
    const cleanMap = {};

    folders.forEach(f => {
        const dotIndex = f.indexOf('.');
        if (dotIndex !== -1) {
            const rawName = f.substring(dotIndex + 1).trim(); // "(재)낙원추모공원"

            // Map rawName itself
            foldersMap[rawName] = f;

            // Map Cleaned Name
            const { name: cleanedName } = cleanName(rawName); // Use cleanName function
            cleanMap[cleanedName] = f;
        }
    });

    // 3. Find Target
    const TARGET_ID = "esky-2000000075";

    let updated = false;

    jsonData = jsonData.map(item => {
        // Match by ID
        if (item.id === TARGET_ID) {
            console.log(`Found item: ${item.name} (${item.id})`);

            // Find Folder using current name or logic (Try both matches)
            let folderName = foldersMap[item.name] || cleanMap[item.name];

            if (!folderName) {
                // Try fuzzy check or just look for "낙원추모공원" in cleanMap keys
                if (cleanMap["낙원추모공원"]) folderName = cleanMap["낙원추모공원"];
            }

            if (folderName) {
                console.log(`Matched Archive Folder: ${folderName}`);

                const rawName = folderName.split('.')[1].trim(); // "(재)낙원추모공원"

                // USE RAW NAME
                console.log(`Restoring Full Name to: ${rawName}`);
                item.name = rawName;

                // Still extract type for operatorType field
                const { type } = cleanName(rawName);
                if (type) item.operatorType = type;

                const facilityPath = path.join(ARCHIVE_DIR, folderName);

                // Re-sync Images
                const photosPath = path.join(facilityPath, 'photos');
                const targetUploadDir = path.join(PUBLIC_DIR, 'uploads', item.id);
                let localImages = [];
                if (fs.existsSync(photosPath)) {
                    if (!fs.existsSync(targetUploadDir)) fs.mkdirSync(targetUploadDir, { recursive: true });
                    const files = fs.readdirSync(photosPath).filter(f => !f.startsWith('.'));
                    files.forEach(file => {
                        const src = path.join(photosPath, file);
                        const dest = path.join(targetUploadDir, file);
                        fs.copyFileSync(src, dest);
                        localImages.push(`/uploads/${item.id}/${file}`);
                    });
                    if (localImages.length > 0) item.imageGallery = localImages;
                }

                // Re-parse Pricing
                const pdfPath = path.join(facilityPath, `${folderName}_price_info.pdf`);
                if (fs.existsSync(pdfPath)) {
                    const dataBuffer = fs.readFileSync(pdfPath);
                    return pdf(dataBuffer).then(data => {
                        const parsedInfo = parsePriceInfoFromText(data.text);
                        if (Object.keys(parsedInfo.priceTable).length > 0) {
                            item.priceInfo = parsedInfo;
                        }
                        updated = true;
                        return item;
                    });
                } else {
                    updated = true;
                    return Promise.resolve(item);
                }
            } else {
                console.log("Could not find matching archive folder for this item.");
            }
        }
        return Promise.resolve(item);
    });

    const resolvedData = await Promise.all(jsonData);

    if (updated) {
        fs.writeFileSync(DATA_FILE, JSON.stringify(resolvedData, null, 2));
        console.log("✅ Update Complete. Restored Clean Name.");
    } else {
        console.log("❌ Target facility item not found.");
    }

})();
