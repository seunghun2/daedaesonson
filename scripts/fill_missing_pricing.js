const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
const pdf = require('pdf-parse');

const ARCHIVE_DIR = path.join(__dirname, '../archive');
const DATA_DIR = path.join(__dirname, '../data');
const FACILITIES_JSON_PATH = path.join(__dirname, '../data/facilities.json');

// 카테고리별 매핑
const CATEGORY_TO_FILE = {
    'CHARNEL_HOUSE': 'pricing_enshrinement.csv',
    'NATURAL_BURIAL': 'pricing_natural.csv',
    'FAMILY_GRAVE': 'pricing_cemetery.csv',
    'CREMATORIUM': 'pricing_cremation.csv',
    'FUNERAL_HOME': 'pricing_cemetery.csv', // Fallback
    'OTHER': 'pricing_cemetery.csv' // Fallback
};

// CSV 파일 컬럼 정의
// ParkID,ParkName,Category,ItemName,Price,RawText

async function run() {
    console.log('🚀 Filling Missing Pricing Data from Archive...\n');

    // 1. Load Facilities Master Data
    if (!fs.existsSync(FACILITIES_JSON_PATH)) {
        console.error('Facilities JSON not found!');
        return;
    }
    const facilitiesData = JSON.parse(fs.readFileSync(FACILITIES_JSON_PATH, 'utf-8'));
    const facilityMap = new Map();
    facilitiesData.forEach(f => {
        const idNum = parseInt(f.id.replace('park-', ''), 10);
        facilityMap.set(idNum, f);
    });

    // 2. Identify Missing IDs
    const pricingFiles = [
        'pricing_cemetery.csv',
        'pricing_cremation.csv',
        'pricing_enshrinement.csv',
        'pricing_natural.csv'
    ];

    const existingIds = new Set();
    pricingFiles.forEach(filename => {
        const filePath = path.join(DATA_DIR, filename);
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf-8');
            const parsed = Papa.parse(content, { header: true, skipEmptyLines: true });
            parsed.data.forEach(r => {
                const match = r.ParkID.match(/park-(\d+)/);
                if (match) existingIds.add(parseInt(match[1], 10));
            });
        }
    });

    const maxId = Math.max(...Array.from(existingIds));
    const missingIds = [];
    for (let i = 1; i <= maxId; i++) {
        if (!existingIds.has(i)) missingIds.push(i);
    }
    console.log(`Target Missing Count: ${missingIds.length}`);

    // 3. Process Archive & Create New Rows
    const newRowsByFile = {}; // filename -> array of rows
    const folderDirs = fs.readdirSync(ARCHIVE_DIR);

    for (const id of missingIds) {
        const facility = facilityMap.get(id);
        if (!facility) {
            console.warn(`No facility info for ID ${id} in JSON.`);
            continue;
        }

        // Folder Search
        const folderName = folderDirs.find(d => d.startsWith(`${id}.`));
        if (!folderName) {
            console.warn(`No archive folder for ID ${id}.`);
            continue;
        }

        // PDF Check
        const folderPath = path.join(ARCHIVE_DIR, folderName);
        let files = [];
        try {
            files = fs.readdirSync(folderPath);
        } catch (e) { continue; }

        const pdfFile = files.find(f => f.toLowerCase().endsWith('.pdf'));

        // Prepare Row Data
        const targetFilename = CATEGORY_TO_FILE[facility.category] || 'pricing_cemetery.csv';
        const parkIdStr = `park-${String(id).padStart(4, '0')}`;

        let extractedText = "PDF found but text extraction failed";
        let hasPrice = false;

        // Try extracting text (simple check for "원" or numbers)
        if (pdfFile) {
            try {
                const pdfBuffer = fs.readFileSync(path.join(folderPath, pdfFile));
                const data = await pdf(pdfBuffer);
                if (data.text && data.text.length > 10) {
                    extractedText = data.text.substring(0, 100).replace(/\n/g, ' ') + "..."; // First 100 chars
                }
            } catch (e) {
                // PDF error, ignore
            }
        }

        // Create the ROW
        // User Requirement: "Category넣고 나머지는 정보없음"
        const newRow = {
            ParkID: parkIdStr,
            ParkName: facility.name,
            Category: facility.category || '기타',
            ItemName: '정보없음',
            Price: '0',
            RawText: `Archive processed: ${folderName}`
        };

        if (!newRowsByFile[targetFilename]) {
            newRowsByFile[targetFilename] = [];
        }
        newRowsByFile[targetFilename].push(newRow);
    }

    // 4. Append and Sort
    for (const filename of Object.keys(newRowsByFile)) {
        const rowsToAdd = newRowsByFile[filename];
        if (rowsToAdd.length === 0) continue;

        console.log(`Adding ${rowsToAdd.length} rows to ${filename}...`);

        const filePath = path.join(DATA_DIR, filename);
        let existingRows = [];
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf-8');
            // quotes: false to avoid parsing issues with simple structure, but safety first
            existingRows = Papa.parse(content, { header: true, skipEmptyLines: true }).data;
        }

        const combined = [...existingRows, ...rowsToAdd];

        // SORT
        combined.sort((a, b) => {
            const numA = parseInt(a.ParkID.replace('park-', '') || '0', 10);
            const numB = parseInt(b.ParkID.replace('park-', '') || '0', 10);
            return numA - numB;
        });

        // WRITE
        const csvOutput = Papa.unparse(combined, { header: true, quotes: false });
        fs.writeFileSync(filePath, csvOutput);
        console.log(`✅ Updated & Sorted ${filename}`);
    }

    console.log('\nAll missing data injected as "정보없음".');
}

run();
