const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const XLSX = require('xlsx');

const ARCHIVE_DIR = path.join(__dirname, '../archive');
const ARCHIVE3_DIR = path.join(__dirname, '../archive3');
const DATA_FILE = path.join(__dirname, '../data/facilities.json');

// Category Mapping
const CATEGORY_MAP = {
    'CHARNEL_HOUSE': '봉안당',
    'NATURAL_BURIAL': '수목장',
    'CEMETERY': '공원묘지',
    'FAMILY_GRAVE': '공원묘지',
    'FUNERAL_HOME': '기타', // Assuming these might not be the main target for price tables but included
};

function getCategoryFolder(category) {
    return CATEGORY_MAP[category] || '기타';
}

function convertM2ToPyung(text) {
    return text.replace(/([\d,.]+)\s*(m2|㎡)/gi, (match, numStr, unit) => {
        const num = parseFloat(numStr.replace(/,/g, ''));
        if (isNaN(num)) return match;
        const pyung = (num * 0.3025).toFixed(1);
        return `${pyung}평`;
    });
}

function parsePriceItems(text) {
    const lines = text.split('\n');
    const items = {}; // Key: Item Name (e.g. "관리비"), Value: Price

    lines.forEach(line => {
        const cleanLine = line.trim();
        if (!cleanLine) return;

        const convertedLine = convertM2ToPyung(cleanLine);

        // Simple Heuristic Extraction
        const manwonMatch = convertedLine.match(/([\d,]+)\s*만원/);
        const wonMatch = convertedLine.match(/([\d,]+)\s*원/);

        let price = 0;
        let name = '';

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

        // Clean Name
        if (price > 0 && name.length > 1) {
            name = name.replace(/[|│]/g, ' ').replace(/\s+/g, ' ').trim();
            // Remove digits/dimensions from name start (e.g. "1평") for better clustering?
            // User wants "Common Denominators".
            // e.g. "관리비" (Management), "사용료" (Usage).
            // Usually specific names like "소나무 1위" are unique.
            // We'll store the full name for now, but also try to detect keywords.
            items[name] = price;
        }
    });
    return items;
}

(async () => {
    console.log("Starting Analysis & Migration to archive3...");

    // 1. Prepare Dirs
    if (!fs.existsSync(ARCHIVE3_DIR)) fs.mkdirSync(ARCHIVE3_DIR);
    ['봉안당', '수목장', '공원묘지', '기타'].forEach(cat => {
        const dir = path.join(ARCHIVE3_DIR, cat);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    });

    // 2. Load Data
    const facilities = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

    // 3. Map Folders
    const archiveFolders = fs.readdirSync(ARCHIVE_DIR);
    const folderMap = {}; // CleanName -> Folder
    const rawMap = {}; // RawName -> Folder
    archiveFolders.forEach(f => {
        if (f.startsWith('.')) return;
        const dotIndex = f.indexOf('.');
        if (dotIndex !== -1) {
            const raw = f.substring(dotIndex + 1).trim();
            rawMap[raw] = f;
            // Clean logic (duplicate from previous script, just to match)
            const clean = raw.replace(/^(\(재\)|재단법인\s*|재\))/, '').replace(/^(\(주\)|주식회사\s*|주\))/, '').trim();
            folderMap[clean] = f;
        }
    });

    // Data Structures for Analysis
    // structure: { '봉안당': [ { name: '...', file: '...', items: { '관리비': 50000, ... } } ] }
    const analysisData = {
        '봉안당': [],
        '수목장': [],
        '공원묘지': [],
        '기타': []
    };

    const allItemKeys = {
        '봉안당': new Set(),
        '수목장': new Set(),
        '공원묘지': new Set(),
        '기타': new Set()
    };

    let processedCount = 0;

    for (const facility of facilities) {
        // Find Folder
        // Try Raw Name match first (since we just restored raw names)
        let folderName = rawMap[facility.name] || folderMap[facility.name];

        // If facility.name is clean "낙원추모공원" but raw is "(재)낙원추모공원", checking rawMap["낙원"] fails.
        // Checking folderMap["낙원"] works.
        // If facility.name is Raw "(재)낙원...", rawMap works.

        if (!folderName) {
            // Try cleaning facility name if it has prefix
            const clean = facility.name.replace(/^(\(재\)|재단법인\s*|재\))/, '').replace(/^(\(주\)|주식회사\s*|주\))/, '').trim();
            folderName = folderMap[clean];
        }

        if (!folderName) continue;

        const catFolder = getCategoryFolder(facility.category);
        const srcPdf = path.join(ARCHIVE_DIR, folderName, `${folderName}_price_info.pdf`);

        if (fs.existsSync(srcPdf)) {
            // Copy
            const safeName = facility.name.replace(/\//g, '_');
            const destName = `${safeName}_${facility.id}_price.pdf`;
            const destPath = path.join(ARCHIVE3_DIR, catFolder, destName);

            fs.copyFileSync(srcPdf, destPath);

            // Parse
            try {
                const dataBuffer = fs.readFileSync(destPath);
                const pdfData = await pdf(dataBuffer);
                const items = parsePriceItems(pdfData.text);

                // Track Keys
                Object.keys(items).forEach(k => allItemKeys[catFolder].add(k));

                analysisData[catFolder].push({
                    name: facility.name,
                    id: facility.id,
                    items: items
                });
            } catch (e) {
                console.error(`Error parsing ${destName}:`, e.message);
            }

            processedCount++;
            if (processedCount % 50 === 0) process.stdout.write('.');
        }
    }

    console.log(`\nProcessed ${processedCount} PDFs.`);
    console.log("Generating Excel Report...");

    // 4. Generate Excel
    const wb = XLSX.utils.book_new();

    for (const [cat, facList] of Object.entries(analysisData)) {
        if (facList.length === 0) continue;

        // Determine "Common Denominators" (Top frequent keys)
        // Or just list ALL keys columns?
        // Let's list all keys found in this category, sorted by frequency?
        // Or just alphabetical for now.
        // Actually, frequency is better to find "Common".
        const keyFreq = {};
        facList.forEach(f => {
            Object.keys(f.items).forEach(k => {
                keyFreq[k] = (keyFreq[k] || 0) + 1;
            });
        });

        // Filter keys that appear specific number of times? Or take Top 50?
        // Let's take keys that appear at least in 2 facilities to avoid specific junk
        const sortedKeys = Object.keys(keyFreq)
            .filter(k => keyFreq[k] > 1 || facList.length < 5)
            .sort((a, b) => keyFreq[b] - keyFreq[a]); // Descending Freq

        // Limit columns to avoid Excel explosion? 100 columns.
        const topKeys = sortedKeys.slice(0, 100);

        // Build Row Data
        const rows = facList.map(f => {
            const row = {
                '시설명': f.name,
                'ID': f.id
            };
            topKeys.forEach(k => {
                if (f.items[k]) row[k] = f.items[k];
            });
            return row;
        });

        const ws = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, cat);

        // Also create a "Stats" sheet for this category?
        // "Common_Stats"
        const statsRows = sortedKeys.map(k => ({ 'Item': k, 'Frequency': keyFreq[k] }));
        const wsStats = XLSX.utils.json_to_sheet(statsRows);
        XLSX.utils.book_append_sheet(wb, wsStats, `${cat}_통계`);
    }

    const excelPath = path.join(ARCHIVE3_DIR, 'price_analysis_report.xlsx');
    XLSX.writeFile(wb, excelPath);
    console.log(`✅ Excel Saved: ${excelPath}`);

})();
