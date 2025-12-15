const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

// Paths
const BASE_LIST = path.join(__dirname, '../esky_full_with_details.json');
const ARCHIVE_DIR = path.join(__dirname, '../archive');
// CSV Pricing Data
const PRICE_CSV_FUNERAL = path.join(__dirname, '../plusplus/2.장례식장가격정보_20230601.csv');
const PRICE_CSV_OTHER = path.join(__dirname, '../plusplus/3.장사시설(장례식장제외)가격정보_20230601.csv');

const OUTPUT_FILE = path.join(__dirname, '../data/facilities.json');

// Category Mapping
const TYPE_MAP = {
    "CemeteryDet": "FAMILY_GRAVE",
    "CremationDet": "CREMATORIUM",
    "EnshrineDet": "CHARNEL_HOUSE",
    "NaturalBurialDet": "NATURAL_BURIAL",
    "FuneralHallDet": "FUNERAL_HOME"
};

// Helper: Read CSV
function readCsv(filePath) {
    if (!fs.existsSync(filePath)) return [];
    const buffer = fs.readFileSync(filePath);
    const decoder = new TextDecoder('euc-kr');
    const content = decoder.decode(buffer);
    const parsed = Papa.parse(content, { header: true, skipEmptyLines: true });
    return parsed.data;
}

// Helper: Normalize Name for Matching
function normalizeName(name) {
    if (!name) return "";
    return name
        .replace(/\(재\)/g, '')
        .replace(/^재\)/g, '')
        .replace(/\(주\)/g, '')
        .replace(/^주\)/g, '')
        .replace(/\(유\)/g, '')
        .replace(/\s+/g, '')
        .replace(/\(/g, '')
        .replace(/\)/g, '')
        .trim();
}

// Helper: Normalize Price
function normalizePrice(str) {
    if (!str) return 0;
    const num = parseInt(str.toString().replace(/,/g, ''), 10);
    return isNaN(num) ? 0 : num;
}

(async () => {
    console.log("Starting Restoration...");

    // 1. Load Base List
    const rawData = JSON.parse(fs.readFileSync(BASE_LIST, 'utf-8'));
    const list = rawData.list || rawData;
    console.log(`Loaded ${list.length} facilities from base list.`);

    // 2. Load Prices
    const funeralPrices = readCsv(PRICE_CSV_FUNERAL);
    const otherPrices = readCsv(PRICE_CSV_OTHER);
    const allPrices = [...funeralPrices, ...otherPrices];
    console.log(`Loaded ${allPrices.length} price records.`);

    // Index prices by Name for fast lookup
    const priceMap = {};
    allPrices.forEach(p => {
        const name = p['시설명'] || p['장사시설명'];
        if (!name) return;
        const cleanName = normalizeName(name);
        if (!priceMap[cleanName]) priceMap[cleanName] = [];
        priceMap[cleanName].push(p);
    });

    // 3. Process Items
    const output = list.map(item => {
        const id = String(item.rno);
        const name = item.companyname;
        const cleanName = normalizeName(name);

        // Category
        let category = "OTHER";
        // Prefer explicit type mapping from crawling if available
        if (TYPE_MAP[item.type]) {
            category = TYPE_MAP[item.type];
        } else {
            // Fallback
            if (name.includes('장례식장')) category = "FUNERAL_HOME";
            else if (name.includes('추모공원') || name.includes('묘지')) category = "FAMILY_GRAVE";
            else if (name.includes('봉안') || name.includes('납골')) category = "CHARNEL_HOUSE";
            else if (name.includes('화장')) category = "CREMATORIUM";
            else if (name.includes('자연장')) category = "NATURAL_BURIAL";
        }

        // Image Count
        // Folder names in archive are exactly "RNO.CompanyName"
        // Need to be careful about spaces or special chars if they were changed during folder creation/renaming.
        // We know 'archive' has names like "1.(재)낙원추모공원"
        const folderName = `${id}.${name}`;
        const photosPath = path.join(ARCHIVE_DIR, folderName, 'photos');
        let imageCount = 0;
        let mainImage = item.fileurl || "";

        if (fs.existsSync(photosPath)) {
            const files = fs.readdirSync(photosPath).filter(f => !f.startsWith('.'));
            imageCount = files.length;
        }

        // Price Matching
        const matchedPrices = priceMap[cleanName] || [];
        let minPrice = 0;
        let maxPrice = 0;

        if (matchedPrices.length > 0) {
            // Filter out Management Fees and very low prices (likely fees)
            // '관리비', '화장', '안치료'(maybe?)
            // User wants the main "Usage Fee" or "Price".
            // Generally Usage Fee > 50,000 KRW (5 Man-won). 
            // Management fees are usually 10k~50k/year.
            const validPrices = matchedPrices
                .filter(p => {
                    const itemName = p['품목'] || '';
                    const isMgmt = itemName.includes('관리비') || itemName.includes('석물');
                    return !isMgmt;
                })
                .map(p => normalizePrice(p['금액']))
                .filter(p => p > 50000); // Filter out anything below 50k KRW (5 Man-won) to avoid misinterpretation

            if (validPrices.length > 0) {
                minPrice = Math.min(...validPrices);
                maxPrice = Math.max(...validPrices);

                // Unit conversion (Won -> Man-won if large)
                if (maxPrice > 10000) {
                    minPrice = Math.floor(minPrice / 10000);
                    maxPrice = Math.floor(maxPrice / 10000);
                }
            }
        }

        return {
            id: id,
            name: name,
            category: category,
            address: item.fulladdress || "",
            phone: item.telephone || "",
            priceRange: {
                min: minPrice,
                max: maxPrice
            },
            hasParking: item.parkyn === "TBC1300001",
            coordinates: {
                lat: parseFloat(item.latitude) || 0,
                lng: parseFloat(item.longitude) || 0
            },
            fileUrl: mainImage,
            imageCount: imageCount, // Vital for "이미지 N" chip
            // Include priceInfo detail if we want the detail tab to work?
            // For listing, priceRange is enough.
        };
    });

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
    console.log(`Successfully generated data/facilities.json with ${output.length} items.`);
})();
