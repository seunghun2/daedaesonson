const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../data/facilities.json');

console.log("🧹 Starting Deep Clean for ID 1...");

const facilities = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));
const fIndex = facilities.findIndex(f => f.id === 'park-0001');

if (fIndex === -1) {
    console.error("❌ Facility park-0001 not found!");
    process.exit(1);
}

const target = facilities[fIndex];
const oldPricing = target.pricing || {};

// Stronger Delete Keywords
const DELETE_KEYWORDS = [
    '작업비', '개장', '수선', '유골함', '석물', '석곽', '석봉분',
    '향로', '구판', '설치비', '각자대', '식당', '천막', '나무제거',
    '철거', '안치단', '상석', '비석', '걸방석', '성경책', '위패',
    '꽃병', '모시는글', '운구', '화장', '안치', '제례식', '코팅'
];

// Special Categories to Keep
const KEEP_CATEGORIES = ['매장묘', '수목장', '봉안당', '관리비', '사용료'];

const newPricing = {};
let deletedCount = 0;

Object.entries(oldPricing).forEach(([cat, content]) => {
    if (!content.rows) return;

    const validRows = content.rows.filter(r => {
        const text = (r.name + r.description).toLowerCase();

        // Check if it hits any delete keyword
        if (DELETE_KEYWORDS.some(k => text.includes(k))) {
            deletedCount++;
            return false;
        }
        return true;
    });

    if (validRows.length > 0) {
        newPricing[cat] = { rows: validRows };
    }
});

target.pricing = newPricing;

// Save
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));

console.log(`✅ Cleaned up ID 1.`);
console.log(`🗑️ Deleted ${deletedCount} useless rows.`);
console.log(`✨ Remaining Pricing Categories:`, Object.keys(newPricing));
