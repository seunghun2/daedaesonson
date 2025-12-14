const fs = require('fs');
const path = require('path');

const RAW_DATA_PATH = '/Users/el/Desktop/daedaesonson/data/pdf_extracted_pricing.json';
const FACILITIES_DATA_PATH = '/Users/el/Desktop/daedaesonson/data/facilities.json';
const OUTPUT_CSV_PATH = '/Users/el/Desktop/daedaesonson/data/pricing_class_final.csv';
const OUTPUT_JSON_PATH = '/Users/el/Desktop/daedaesonson/data/pricing_class_final.json';

// Load Data
const rawData = JSON.parse(fs.readFileSync(RAW_DATA_PATH, 'utf8'));
let facilitiesData = [];
try {
    facilitiesData = JSON.parse(fs.readFileSync(FACILITIES_DATA_PATH, 'utf8'));
} catch (e) {
    console.warn("Facilities data not found, institution type will be 'Unknown'");
}

// Map Facilities by ID
const facilityMap = {};
facilitiesData.forEach(f => {
    facilityMap[f.id] = f;
});

// Helper: Determine Institution Type from Name if Metadata missing
function getInstitutionType(name, metaType) {
    if (metaType) return metaType;
    if (name.includes('시립') || name.includes('군립') || name.includes('공설') || name.includes('추모공원')) return '공설'; // Heuristic
    return '사설';
}

// Helper: Generate itemName1 (Standard Representative Name)
// Logic adapted from previous powerful script
function generateStandardName(item, instType) {
    const raw = (item.rawText || '').replace(/\s+/g, ' ').trim();
    const itemName = (item.itemName2 || '').trim();
    const price = item.price;
    const cat1 = item.category1;

    // 1. Blacklist Check
    const BLACKLIST = ['관리비', '작업', '석물', '식대', '사용료', '임대', '전지', '벌초', '화장', '안치', '제거'];
    if (BLACKLIST.some(k => raw.includes(k) || itemName.includes(k))) return '';

    // 2. Area Detection (pyeong)
    let area = '';
    const pyungMatch = raw.match(/([0-9.]+)평/);
    if (pyungMatch) area = `${pyungMatch[1]}평`;

    // 3. Format
    // Format: "Category Area Price" => "매장 3평 300만원"
    let typeStr = cat1 === '기타' ? '' : cat1 + ' ';
    if (area) typeStr += `(${area}) `;

    // Price formatting
    const priceManwon = Math.round(price / 10000);
    return `${typeStr}${priceManwon}만원`.trim();
}


// --- MAIN PROCESSING ---
console.log('Processing extracted data...');

const refinedData = rawData.map(item => {
    const facility = facilityMap[item.id] || {};
    const institutionType = getInstitutionType(item.parkName, facility.institutionType);

    // Refine Category 3 (Logic Enforced)
    let cat3 = item.category3;
    if (!cat3) {
        if (item.rawText.includes('관내') || item.rawText.includes('지역주민')) cat3 = '관내';
        else if (item.rawText.includes('관외') || item.rawText.includes('타지역')) cat3 = '관외';
    }

    // Generate ItemName1
    const itemName1 = generateStandardName(item, institutionType);

    // Filter out rows that failed standard name generation (likely garbage or fees)
    // User wants "ALL" from PDF, but organized. So we keep it even if itemName1 is empty?
    // User Request: "pdf 하나하나 가격표 확인해서 엑셀 다시 만들어줘"
    // Let's keep everything valid (Price > 10000) but mark itemName1 only for good ones.

    return {
        id: item.id,
        parkName: item.parkName,
        institutionType: institutionType,
        category1: item.category1,
        category2: item.category2,
        category3: cat3,
        itemName1: itemName1, // Representative Name
        itemName2: item.itemName2, // Original Product Name (Cleaned)
        rawText: item.rawText, // Full Text
        price: item.price
    };
}).filter(item => item.price >= 10000); // Minimum 10,000 KRW

// Sort by Facility ID, then Price
refinedData.sort((a, b) => {
    if (a.id !== b.id) return parseInt(a.id) - parseInt(b.id);
    return a.price - b.price;
});


// CSV Generation
console.log(`Generating CSV for ${refinedData.length} items...`);
const csvHeader = 'ID,시설명,기관,분류 1,분류 2,분류 3,항목명 1(대표),항목명 2(상세),비고/설명,가격\n';
const csvRows = refinedData.map(d => {
    // Escape quotes for CSV
    const safe = (val) => `"${String(val || '').replace(/"/g, '""')}"`;
    return [
        safe(d.id),
        safe(d.parkName),
        safe(d.institutionType),
        safe(d.category1),
        safe(d.category2),
        safe(d.category3),
        safe(d.itemName1),
        safe(d.itemName2),
        safe(d.rawText),
        d.price
    ].join(',');
});

fs.writeFileSync(OUTPUT_CSV_PATH, csvHeader + csvRows.join('\n'));
fs.writeFileSync(OUTPUT_JSON_PATH, JSON.stringify(refinedData, null, 2));

console.log('Complete!');
console.log(`CSV Saved: ${OUTPUT_CSV_PATH}`);
console.log(`JSON Saved: ${OUTPUT_JSON_PATH}`);
