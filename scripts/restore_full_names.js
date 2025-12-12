const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse'); // Use version 1.1.1 (simple function)

const ARCHIVE_DIR = path.join(__dirname, '../archive');
const DATA_FILE = path.join(__dirname, '../data/facilities.json');
const PUBLIC_DIR = path.join(__dirname, '../public');

// Regex Patterns
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

        // 1. Convert m2 -> pyung immediately
        const convertedLine = convertM2ToPyung(cleanLine);

        // 2. Simple Price Detection
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

            // Extract Grade (e.g. "1평형 기준", "1평형/1년 기준", "1위")
            // Strict regex for common patterns
            const gradeMatch = namePart.match(/(\d+\s*(평|평형|년|위|기|분|실).*)/);
            if (gradeMatch) {
                gradePart = gradeMatch[1].trim();
                namePart = namePart.replace(gradeMatch[0], '').trim();
            }

            // Cleanup Name
            namePart = namePart.replace(/[|│]/g, ' ').replace(/\s+/g, ' ').trim();

            let type = 'PRODUCT';
            // User Request: "관리비" (Management Fee) should be paired with Basic Cost.
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
    console.log("Starting Full Sync from Archive (Restoring Raw Names)...");

    // 1. Load JSON
    let jsonData = [];
    if (fs.existsSync(DATA_FILE)) {
        jsonData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    } else {
        console.error("No facilities.json found!");
        process.exit(1);
    }

    // 2. Read All Archive Folders
    const folders = fs.readdirSync(ARCHIVE_DIR).filter(f => !f.startsWith('.'));
    const foldersMap = {}; // Cleaned Name -> FolderName (to match existing data)
    const rawToFolderMap = {}; // Raw Name -> FolderName (for direct match if needed)

    folders.forEach(f => {
        const dotIndex = f.indexOf('.');
        if (dotIndex !== -1) {
            const rawName = f.substring(dotIndex + 1).trim(); // "(재)낙원추모공원"

            // Map plain raw name
            rawToFolderMap[rawName] = f;

            // Map cleaned name (key for current JSON)
            const { name: cleaned } = cleanName(rawName);
            foldersMap[cleaned] = f;
        }
    });

    // 3. Serial Loop
    let updatedCount = 0;
    const newJsonData = [];

    for (const item of jsonData) {
        // Try to find folder by Clean Name (current JSON state)
        // OR by Raw Name (if some are still raw)
        // OR by ID if we had ID mapping (but we rely on name now)

        let folderName = foldersMap[item.name.trim()] || rawToFolderMap[item.name.trim()];

        // Fallback: If item name is already cleaned "낙원추모공원", foldersMap["낙원추모공원"] should find it.
        // If foldersMap doesn't find it, maybe try to cleaning item.name again?
        if (!folderName) {
            const { name: reCleaned } = cleanName(item.name);
            folderName = foldersMap[reCleaned];
        }

        let newItem = { ...item };

        if (!folderName) {
            newJsonData.push(newItem);
            continue; // Skip if no archive found
        }

        updatedCount++;
        const facilityPath = path.join(ARCHIVE_DIR, folderName);

        // A. RESTORE RAW NAME & Set Badge Type
        // folderName is like "1.(재)낙원추모공원"
        const rawNameFromFolder = folderName.split('.')[1].trim(); // "(재)낙원추모공원"

        newItem.name = rawNameFromFolder; // Restoring Raw Name!

        const { type } = cleanName(rawNameFromFolder);
        if (type) newItem.operatorType = type;

        // B. Images
        const photosPath = path.join(facilityPath, 'photos');
        const targetUploadDir = path.join(PUBLIC_DIR, 'uploads', item.id);
        let localImages = [];

        if (fs.existsSync(photosPath)) {
            if (!fs.existsSync(targetUploadDir)) {
                fs.mkdirSync(targetUploadDir, { recursive: true });
            }
            const files = fs.readdirSync(photosPath).filter(f => !f.startsWith('.'));
            files.forEach(file => {
                const src = path.join(photosPath, file);
                const dest = path.join(targetUploadDir, file);
                fs.copyFileSync(src, dest);
                localImages.push(`/uploads/${item.id}/${file}`);
            });
        }

        if (localImages.length > 0) {
            newItem.imageGallery = localImages;
        }

        // C. PDF Parsing (With improved logic)
        const pdfPath = path.join(facilityPath, `${folderName}_price_info.pdf`);
        if (fs.existsSync(pdfPath)) {
            try {
                const dataBuffer = fs.readFileSync(pdfPath);
                const data = await pdf(dataBuffer);
                const text = data.text;

                if (text && text.length > 50) {
                    const parsedInfo = parsePriceInfoFromText(text);
                    if (Object.keys(parsedInfo.priceTable).length > 0) {
                        newItem.priceInfo = parsedInfo;
                    }
                }
            } catch (e) {
                // Ignore PDF errors
            }
        }

        newJsonData.push(newItem);
        if (updatedCount % 50 === 0) process.stdout.write('.');
    }

    // 4. Save
    fs.writeFileSync(DATA_FILE, JSON.stringify(newJsonData, null, 2));
    console.log(`\n✅ Synced ${updatedCount} facilities. Restored Raw Names, copied images, parsed prices (improved).`);

})();
