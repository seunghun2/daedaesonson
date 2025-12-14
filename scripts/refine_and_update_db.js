const fs = require('fs');
const path = require('path');

const RAW_DATA_PATH = '/Users/el/Desktop/daedaesonson/data/pdf_extracted_pricing.json';
const FACILITIES_DATA_PATH = '/Users/el/Desktop/daedaesonson/data/facilities.json';
const CURRENT_DB_PATH = '/Users/el/Desktop/daedaesonson/data/pricing_db.json';
const BACKUP_DB_PATH = '/Users/el/Desktop/daedaesonson/data/pricing_db.backup.json';

// --- CONFIG ---
const PRICE_THRESHOLD = 10000; // Min price
const BLACKLIST = [
    '식대', '식사', '관리비', '작업', '천막', '운구', '증명서',
    '철거', '이장', '개장', '파묘', '각자', '명패', '유골함', '부대비용', '용품', '제거',
    '전지', '벌초', '화장', '안치', '시설이용료', '사용료반환', '수선', '합계', 'Total',
    '석물', '비석', '상석' // Be careful with these, they might be part of a package description
];

// Keywords that indicate a REAL product, even if blacklist words are present in description
const WHITELIST = [
    '사용료', '분양', '매장', '봉안', '납골', '수목', '자연', '평장', '가족', '부부', '개인'
];

// Load Data
console.log('🔄 Loading data...');
const rawData = JSON.parse(fs.readFileSync(RAW_DATA_PATH, 'utf8'));
const facilitiesData = JSON.parse(fs.readFileSync(FACILITIES_DATA_PATH, 'utf8'));

// Facility Meta Map
const facilityMap = {};
facilitiesData.forEach(f => {
    facilityMap[f.id] = f;
});

// Helper: Institution Type
function getInstitutionType(name, metaType) {
    if (metaType) return metaType;
    if (name.includes('시립') || name.includes('군립') || name.includes('공설') || name.includes('추모공원')) return '공설';
    return '사설';
}

// Helper: Clean Price (The "0,001 -> 0,000" Filter)
function cleanPrice(price) {
    if (!price) return 0;
    // Floor to nearest 10 (removes 1s digit noise)
    return Math.floor(price / 10) * 10;
}

// Helper: Determine Category (Strict 3 Types: 봉안당, 수목장, 공원묘지)
function determineCategory(text, facilityCategory) {
    // 1. Text-based Classification (Priority)
    if (text.includes('수목') || text.includes('자연') || text.includes('잔디') || text.includes('화초')) return '수목장';
    if (text.includes('봉안') || text.includes('납골') || text.includes('담')) return '봉안당';
    if (text.includes('매장') || text.includes('묘지') || text.includes('봉분') || text.includes('평장') || text.includes('합장') || text.includes('쌍분')) return '공원묘지';

    // 2. Fallback to Facility Metadata (If text is ambiguous like "Couple Type 5M")
    if (facilityCategory) {
        if (facilityCategory.includes('자연') || facilityCategory.includes('수목')) return '수목장';
        if (facilityCategory.includes('봉안') || facilityCategory.includes('납골')) return '봉안당';
        if (facilityCategory.includes('묘지') || facilityCategory.includes('매장')) return '공원묘지';
    }

    // Default
    return '기타';
}

function determineCategory2(text) {
    if (text.includes('부부')) return '부부단';
    if (text.includes('가족')) return '가족단';
    if (text.includes('개인') || text.includes('1위') || text.includes('1인')) return '개인단';
    return '';
}

// --- MAIN LOGIC ---
console.log('🧹 Refining & Categorizing...');

// Backup first
if (fs.existsSync(CURRENT_DB_PATH)) {
    fs.copyFileSync(CURRENT_DB_PATH, BACKUP_DB_PATH);
    console.log(`📦 Backup created at ${BACKUP_DB_PATH}`);
}

let newData = [];
let currentFacilityId = null;
let currentCat3 = ''; // Context propagation

rawData.forEach(item => {
    // 1. Reset Context on new facility
    if (item.id !== currentFacilityId) {
        currentFacilityId = item.id;
        currentCat3 = '';
    }

    const rawLower = (item.rawText || '').toLowerCase();
    const nameLower = (item.itemName2 || '').toLowerCase();

    // 2. Smart Filtering (Whitelist vs Blacklist)
    const isWhitelisted = WHITELIST.some(w => rawLower.includes(w) || nameLower.includes(w));
    const isBlacklisted = BLACKLIST.some(k => rawLower.includes(k) || nameLower.includes(k));

    // If it's blacklisted AND NOT whitelisted, drop it.
    // (i.e., if it has "meal fee" but NOT "grave usage fee", drop it. 
    //  But if it has "grave usage fee including management fee", KEEP it.)
    if (isBlacklisted && !isWhitelisted) return;

    // 3. Price Filter & Cleaning
    let price = cleanPrice(item.price);
    if (price < PRICE_THRESHOLD) return;

    // 4. Category Context Propagation (Local/Non-local)
    // If line explicitly says "Local", set context.
    if (rawLower.includes('관내') || rawLower.includes('군민') || rawLower.includes('시민')) currentCat3 = '관내';
    else if (rawLower.includes('관외') || rawLower.includes('타지역')) currentCat3 = '관외';

    // Use current context if item doesn't have one
    let cat3 = item.category3 || currentCat3;

    // 5. Determine Categories
    const facility = facilityMap[item.id] || {};
    const cat1 = determineCategory(rawLower, facility.category);
    const cat2 = determineCategory2(rawLower);

    // STRICT FILTER: If category is '기타' (Other), it means it's likely a miscellaneous fee (stone, food, etc.)
    // Drop it to keep the DB clean.
    if (cat1 === '기타') return;

    // 6. Generate Representative Name (Example: "[관내] 매장묘 300만원")
    let area = '';
    const pyungMatch = rawLower.match(/([0-9.]+)평/);
    if (pyungMatch) area = `${pyungMatch[1]}평`;

    let itemName1 = '';
    // Optional: Only set itemName1 if it looks like a main product?
    // User wants "Our Style". Let's format it.
    let prefix = cat3 ? `[${cat3}]` : '';
    let suffix = Math.round(price / 10000) + '만원';

    // Clean suffix (remove '0만원' if rounding failed/small) - but we filtered <10000
    if (price >= 10000) {
        itemName1 = `${prefix} ${cat1} ${area} ${suffix}`.replace(/\s+/g, ' ').trim();
    }

    const instType = getInstitutionType(item.parkName, facility.institutionType);

    newData.push({
        id: `${item.id}_${newData.length}`, // Unique ID: FacilityID_GlobalIndex or FacilityID_LocalIndex
        parkId: item.id, // Keep original facility ID
        parkName: item.parkName,
        institutionType: instType,
        category: cat1, // Legacy field
        category1: cat1,
        category2: cat2,
        category3: cat3,
        itemName: item.itemName2, // Legacy field (keep original name)
        itemName1: itemName1,
        itemName2: item.itemName2,
        rawText: item.rawText,
        price: String(price), // React app expects string often
    });
});

// --- RE-INSERT MISSING FACILITIES & SORT ---
// First, Calculate Category 0 (Aggregated Types per Facility)
const facilityCategoriesMap = {};
newData.forEach(item => {
    // Robust parkId handling
    const parkIdClean = String(item.parkId).replace(/[^0-9]/g, '');

    if (!facilityCategoriesMap[parkIdClean]) {
        facilityCategoriesMap[parkIdClean] = new Set();
    }
    if (item.category1) {
        facilityCategoriesMap[parkIdClean].add(item.category1);
    }
});

// Helper to format Category 0
function getCategory0(parkId) {
    const parkIdClean = String(parkId).replace(/[^0-9]/g, '');
    const types = facilityCategoriesMap[parkIdClean];
    if (!types || types.size === 0) return '';
    // Priority Sort: 공원묘지 > 봉안당 > 수목장
    const order = ['공원묘지', '봉안당', '수목장'];
    const sorted = Array.from(types).sort((a, b) => {
        return order.indexOf(a) - order.indexOf(b);
    });
    return sorted.join(', ');
}

// Add Missing Facilities
// We need to match based on CLEAN numeric ID to avoid "park-123" vs "123" mismatch
const processedIds = new Set(newData.map(d => String(d.parkId).replace(/[^0-9]/g, '')));
const sortedFacilities = facilitiesData.sort((a, b) => {
    const idA = parseInt(String(a.id).replace(/[^0-9]/g, '')) || 0;
    const idB = parseInt(String(b.id).replace(/[^0-9]/g, '')) || 0;
    return idA - idB;
});

sortedFacilities.forEach(f => {
    const fIdClean = String(f.id).replace(/[^0-9]/g, '');
    if (!processedIds.has(fIdClean)) {
        newData.push({
            id: `${fIdClean}_0`, // Unique ID
            parkId: fIdClean,     // Standardized Numeric ID
            parkName: f.name,
            institutionType: getInstitutionType(f.name, f.institutionType),
            category: '',
            category1: '',
            category2: '',
            category3: '',
            itemName: '',
            itemName1: '',
            itemName2: '',
            rawText: '(가격 정보 없음)',
            price: '0'
        });
    }
});

// Final Pass: Inject Category 0 & Fix ID
newData.forEach((item, index) => {
    // Standardize Park ID
    item.parkId = String(item.parkId).replace(/[^0-9]/g, '');
    item.category0 = getCategory0(item.parkId);

    // ENSURE UNIQUE ID for React Key (CRITICAL)
    // Format: parkId_uniqueIndex
    item.id = `${item.parkId}_${index}`;
});

// Sort Final Data by Park ID
newData.sort((a, b) => {
    const idA = parseInt(a.parkId) || 0;
    const idB = parseInt(b.parkId) || 0;
    if (idA !== idB) return idA - idB;
    return (parseInt(a.price) || 0) - (parseInt(b.price) || 0);
});

console.log(`✨ Generated ${newData.length} refined items (including empty facilities).`);

if (newData.length > 0) {
    console.log('Sample Data:', newData[0]);
}

// Save
fs.writeFileSync(CURRENT_DB_PATH, JSON.stringify(newData, null, 2));
console.log('💾 Database updated!');
