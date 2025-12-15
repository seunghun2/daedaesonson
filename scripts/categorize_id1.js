const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../data/facilities.json');

console.log("🎨 Categorizing Pricing for ID 1...");

const facilities = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));
const fIndex = facilities.findIndex(f => f.id === 'park-0001');

if (fIndex === -1) {
    console.error("❌ Facility park-0001 not found!");
    process.exit(1);
}

const target = facilities[fIndex];
const oldPricing = target.pricing || {};

// Standard Categories
const STANDARD_CATS = {
    '수목장': ['수목', '평장', '잔디', '자연', '화초', '가족평장'],
    '봉안당': ['봉안', '단', '부부단', '개인단', '위패'],
    '매장묘': ['매장', '묘', '봉분', '합장', '기초', '석관'],
    '관리비': ['관리비'],
    '기타': [] // Fallback
};

// Flatten all rows first
let allRows = [];
Object.values(oldPricing).forEach(cat => {
    if (cat.rows) allRows = [...allRows, ...cat.rows];
});

// Re-categorize
const newPricing = {};

allRows.forEach(row => {
    const text = (row.name + (row.description || '')).toLowerCase();

    let bucket = '기타';

    // Check keywords for each standard category
    for (const [catName, keywords] of Object.entries(STANDARD_CATS)) {
        if (catName === '기타') continue;
        if (keywords.some(k => text.includes(k))) {
            bucket = catName;
            break;
        }
    }

    // Special Case: "사용료" usually goes with the main product type, but if ambiguous or standalone, maybe "기타" or specific bucket?
    // User requested "담백하게". If it's just "사용료", it's vague. But if "묘지사용료", it goes to 매장묘.
    // Let's stick to the keyword match above.

    if (!newPricing[bucket]) newPricing[bucket] = { rows: [] };

    // Sort logic within category? Or just push.
    newPricing[bucket].rows.push(row);
});

// Remove empty categories
Object.keys(newPricing).forEach(k => {
    if (newPricing[k].rows.length === 0) delete newPricing[k];
});

// Update
target.pricing = newPricing;

// Save
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));

console.log(`✅ Re-categorized ID 1.`);
console.log(`📂 New Categories:`, Object.keys(newPricing));
Object.keys(newPricing).forEach(k => {
    console.log(`   - ${k}: ${newPricing[k].rows.length} items`);
});
