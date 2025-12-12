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
    const rows = [];

    lines.forEach(line => {
        const cleanLine = line.trim();
        if (!cleanLine) return;

        // 1. Convert m2 -> pyung immediately
        const convertedLine = convertM2ToPyung(cleanLine);

        // 2. Simple Price Detection
        // Looking for the last distinct number string that looks like price
        // Matches "3000000원", "300만원", "3,000,000"

        // Strategy: Look for "Man-won" pattern first as it is distinct
        let price = 0;
        let name = '';

        const manwonMatch = convertedLine.match(/([\d,]+)\s*만원/);
        const wonMatch = convertedLine.match(/([\d,]+)\s*원/); // Can be risky if phone number

        if (manwonMatch) {
            price = parseInt(manwonMatch[1].replace(/,/g, ''), 10) * 10000;
            name = convertedLine.replace(manwonMatch[0], '').trim();
        } else if (wonMatch) {
            // Check if it really looks like a price (e.g. > 1000)
            const val = parseInt(wonMatch[1].replace(/,/g, ''), 10);
            if (val > 1000) {
                price = val;
                name = convertedLine.replace(wonMatch[0], '').trim();
            }
        } else {
            // Fallback: Check for number at end of line if keywords present
            // Omitted for safety to avoid phone numbers
        }

        if (price > 0 && name.length > 1) {
            // Clean Name
            name = name.replace(/[|│]/g, ' ').replace(/\s+/g, ' ').trim();

            // Classify
            let type = 'PRODUCT';
            if (name.includes('관리비') || name.includes('벌초')) type = 'MANAGEMENT';
            else if (name.includes('석물') || name.includes('작업') || name.includes('비석') || name.includes('각자')) type = 'INSTALLATION';
            else if (name.includes('사용료') || name.includes('분양') || name.includes('기본')) type = 'BASIC_COST';

            // Determine Group Key
            let groupKey = '기본비용'; // or '기본 사용료'

            if (type === 'MANAGEMENT') groupKey = '[안내] 관리비 및 용역비';
            else if (type === 'INSTALLATION') groupKey = '[별도] 시설설치 및 석물비용';
            else if (name.includes('봉안')) groupKey = '봉안당';
            else if (name.includes('수목') || name.includes('자연')) groupKey = '수목장';
            else if (name.includes('매장')) groupKey = '매장묘';
            else if (name.includes('평장')) groupKey = '평장묘';

            // If Basic Cost and User requested separation or grouping
            // User requested "Usage and Management" as set.
            // If we found 'Management Fee' here, we put it in separate group normally,
            // BUT our parsing logic in Admin Page was merging them.
            // Here we are generating JSON directly.
            // If we want them grouped in UI, we should put them in '기본비용' group?
            // Let's stick to standard grouping for now, but if it is 'Basic Management Fee', maybe put in '기본비용'?
            // Currently logic puts it in 'Management'.
            // Let's adjust: if name is strictly '관리비' or '연관리비', put in '기본비용' to match user wish.
            if (name === '관리비' || name === '연관리비' || name === '1년관리비') {
                groupKey = '기본비용';
            }

            if (!priceTable[groupKey]) {
                priceTable[groupKey] = { unit: '원', rows: [] };
            }

            priceTable[groupKey].rows.push({
                name: name,
                price: price,
                grade: '' // Extracted from name potentially? leave empty for now
            });
        }
    });

    return { priceTable };
}

(async () => {
    console.log("Starting Full Sync from Archive (with PDF Parsing)...");

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
    const foldersMap = {}; // Name -> FolderName

    folders.forEach(f => {
        const dotIndex = f.indexOf('.');
        if (dotIndex !== -1) {
            const namePart = f.substring(dotIndex + 1).trim();
            foldersMap[namePart] = f;
        }
    });

    // 3. Serial Loop
    let updatedCount = 0;
    const newJsonData = [];

    for (const item of jsonData) {
        // Match by Name
        const folderName = foldersMap[item.name.trim()];

        let newItem = { ...item };

        if (!folderName) {
            newJsonData.push(newItem);
            continue;
        }

        updatedCount++;
        const facilityPath = path.join(ARCHIVE_DIR, folderName);

        // A. Name & Type Cleaning
        const { name: clean, type } = cleanName(item.name);
        newItem.name = clean;
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
            // newItem.fileUrl = localImages[0]; // If main image needs update
        }

        // C. PDF Parsing
        const pdfPath = path.join(facilityPath, `${folderName}_price_info.pdf`);
        if (fs.existsSync(pdfPath)) {
            try {
                const dataBuffer = fs.readFileSync(pdfPath);

                // Using pdf-parse (function style)
                const data = await pdf(dataBuffer);
                const text = data.text;

                if (text && text.length > 50) {
                    const parsedInfo = parsePriceInfoFromText(text);
                    if (Object.keys(parsedInfo.priceTable).length > 0) {
                        newItem.priceInfo = parsedInfo;
                    }
                }
            } catch (e) {
                // console.error(`Error parsing PDF for ${item.name}:`, e.message);
            }
        }

        newJsonData.push(newItem);
        if (updatedCount % 50 === 0) process.stdout.write('.');
    }

    // 4. Save
    fs.writeFileSync(DATA_FILE, JSON.stringify(newJsonData, null, 2));
    console.log(`\n✅ Synced ${updatedCount} facilities. Cleaned names, copied images, parsed prices.`);

})();
