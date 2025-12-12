
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const Papa = require('papaparse');

const EXCEL_FILE = path.join(__dirname, '../plusplus/1.장사시설 현황_20230601.xlsx');
const PRICE_CSV_FUNERAL = path.join(__dirname, '../plusplus/2.장례식장가격정보_20230601.csv');
const PRICE_CSV_OTHER = path.join(__dirname, '../plusplus/3.장사시설(장례식장제외)가격정보_20230601.csv');
const OUTPUT_FILE = path.join(__dirname, '../data/facilities.json');

const CATEGORY_MAP = {
    '장례식장': 'FUNERAL_HOME',
    '화장시설': 'CREMATORIUM',
    '봉안시설': 'CHARNEL_HOUSE',
    '자연장지': 'NATURAL_BURIAL',
    '묘지': 'FAMILY_GRAVE'
};

function readCsv(filePath) {
    console.log(`Reading CSV: ${filePath}`);
    const buffer = fs.readFileSync(filePath);
    const decoder = new TextDecoder('euc-kr');
    const content = decoder.decode(buffer);
    const parsed = Papa.parse(content, { header: true, skipEmptyLines: true });
    return parsed.data;
}

function normalizePrice(str) {
    if (!str) return 0;
    // Remove commas and non-numeric characters except digits
    const num = parseInt(str.toString().replace(/,/g, ''), 10);
    return isNaN(num) ? 0 : num;
}

async function main() {
    console.log('🚀 Starting Data Import...');

    // 1. Read Master Facility Data (Excel)
    const workbook = XLSX.readFile(EXCEL_FILE);
    let allFacilities = [];

    workbook.SheetNames.forEach(sheetName => {
        // SKIP Funeral Homes
        if (sheetName === '장례식장') return;

        const category = CATEGORY_MAP[sheetName] || 'OTHER';
        console.log(`Processing Sheet: ${sheetName} -> ${category}`);

        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        rows.forEach((row, index) => {
            // Basic mapping
            const facility = {
                id: `real-${category}-${index}-${Date.now()}`, // Temporary ID
                name: row['시설명'] || row['장사시설명'] || `Unknown-${index}`,
                category: category,
                address: row['주소'] || '',
                phone: row['전화번호'] || '',
                isPublic: (row['운영형태'] || '').includes('공설') || (row['구분'] || '').includes('공설'),

                // Details
                hasParking: (row['주차장'] || '').includes('설치') || parseInt(row['주차가능대수']) > 0,
                hasRestaurant: (row['식당'] || '').includes('설치'),
                hasStore: (row['매점'] || '').includes('설치'),
                hasAccessibility: (row['장애인편의시설'] || '').includes('설치'),

                // Coordinates (Placeholder)
                coordinates: { lat: 0, lng: 0 },

                // Initial Price Range
                priceRange: { min: 0, max: 0 },

                // Extra info
                updatedAt: new Date().toISOString()
            };

            // Clean ID (remove spaces)
            facility.id = facility.id.replace(/\s+/g, '');

            allFacilities.push(facility);
        });
    });

    console.log(`✅ Total Facilities Loaded: ${allFacilities.length}`);

    // 2. Read Pricing Data (CSV) - ONLY Other Facilities
    // const funeralPrices = readCsv(PRICE_CSV_FUNERAL); // Exclude Funeral Home Data
    const otherPrices = readCsv(PRICE_CSV_OTHER);
    const allPrices = [...otherPrices];

    console.log(`✅ Total Price Records: ${allPrices.length}`);

    // 3. Merge Prices
    let matchedCount = 0;

    // Group prices by facility name first
    const priceMap = {};
    allPrices.forEach(p => {
        const name = p['장사시설명'];
        if (!name) return;

        if (!priceMap[name]) priceMap[name] = [];
        priceMap[name].push(p);
    });

    allFacilities = allFacilities.map(f => {
        const rawPrices = priceMap[f.name];

        // Initialize priceInfo
        f.priceInfo = { priceTable: {} };

        if (rawPrices && rawPrices.length > 0) {
            matchedCount++;

            // Group by '품목분류' (e.g. 사용료, 관리비)
            const grouped = {};
            const allLinkablePrices = [];

            rawPrices.forEach(p => {
                const category = p['품목분류'] || '기타'; // Tab Name
                const name = p['품목'] || '기본';
                const grade = p['규격'] || '';
                const price = normalizePrice(p['금액']);

                if (!grouped[category]) {
                    grouped[category] = [];
                }

                grouped[category].push({
                    name: name,
                    grade: grade,
                    price: price,
                    count: 1
                });

                if (price > 0) allLinkablePrices.push(price);
            });

            // Convert grouped data to PriceTable structure
            Object.keys(grouped).forEach(catKey => {
                f.priceInfo.priceTable[catKey] = {
                    unit: '원',
                    category: catKey,
                    rows: grouped[catKey]
                };
            });

            // Calculate Min/Max Price for the Card View
            if (allLinkablePrices.length > 0) {
                // Determine unit scale (Won vs Man-won)
                // If max price is huge (e.g. > 1,000,000), assume Won and convert to Man-won
                // Logic: If min > 10000, divide by 10000.

                const minRaw = Math.min(...allLinkablePrices);
                const maxRaw = Math.max(...allLinkablePrices);

                f.priceRange = {
                    min: Math.floor(minRaw / 10000),
                    max: Math.floor(maxRaw / 10000)
                };
            }
        }
        return f;
    });

    console.log(`✅ Matched Prices for ${matchedCount} facilities.`);

    // Filter out facilities with no price info if needed? 
    // User didn't ask to filter empty ones, just to include price info.
    // However, user said "우리 넘버링에 맞는 시설들에서", implying mapping.

    // 4. Save to JSON
    fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allFacilities, null, 2));

    console.log(`🎉 Successfully saved to ${OUTPUT_FILE}`);
}

main().catch(console.error);
