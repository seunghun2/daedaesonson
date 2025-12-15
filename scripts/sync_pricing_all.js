const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

// Files
const CSV_PATH = path.join(__dirname, '../data/데이터 - data_on.csv');
const JSON_PATH = path.join(__dirname, '../data/facilities.json');

console.log("🚀 Starting Bulk Sync for 1,498 Facilities...");

// 1. Read CSV
console.log("📖 Reading CSV...");
const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
const rows = parse(csvContent, {
    columns: true,
    skip_empty_lines: true
});
console.log(`✅ Loaded ${rows.length} rows from CSV.`);

// 2. Read JSON
console.log("📖 Reading facilities.json...");
const facilities = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));
console.log(`✅ Loaded ${facilities.length} facilities.`);

// 3. Define Cleaning Rules
const DROP_KEYWORDS = [
    '작업비', '개장', '수선', '유골함', '석물', '석곽', '석봉분',
    '향로', '구판', '설치비', '각자대', '식당', '천막', '나무제거',
    '관리비', '사용료' // 관리비/사용료는 보통 별도 항목이라 일단 Pricing에서는 뺄 수도 있지만, 유저가 남겨달라고 했음. -> 코드에서 예외처리 필요
];
// User said: "사용료, 관리비 이것도 남겨줘"
// So we REMOVE '관리비', '사용료' from DROP_KEYWORDS
const REAL_DROP_KEYWORDS = DROP_KEYWORDS.filter(k => !['관리비', '사용료'].includes(k));

let updatedCount = 0;
let totalCleanedRows = 0;

// 4. Process Each Facility
facilities.forEach(f => {
    // Find matching rows in CSV (by parkId or Name)
    // parkId column in CSV maps to facility id? 
    // Usually: f.id is 'park-0001', CSV parkId is '1'

    // Extract number from f.id
    const fIdNum = f.id.replace(/\D/g, '');

    const facilityRows = rows.filter(r => {
        return r.parkId === fIdNum || r['시설명'] === f.name || (r.id && r.id === fIdNum);
    });

    if (facilityRows.length === 0) return;

    // Clean & Categorize
    const pricing = {};

    facilityRows.forEach(r => {
        const title = r['제목'] || '';
        const desc = r['설명'] || '';
        const priceStr = r['가격'] || '0';
        const price = parseInt(priceStr.replace(/,/g, ''), 10) || 0;

        const text = (title + desc).toLowerCase();

        // Drop check
        const shouldDrop = REAL_DROP_KEYWORDS.some(k => text.includes(k));
        if (shouldDrop) return;

        // Categorize
        let category = '기타';
        if (text.includes('매장') || text.includes('묘') || text.includes('봉분')) category = '매장묘';
        if (text.includes('봉안') || text.includes('단')) category = '봉안당';
        if (text.includes('수목') || text.includes('평장') || text.includes('자연') || text.includes('잔디')) category = '수목장';

        // English Handling (if any) -> UTF-8 is safe in JSON

        if (!pricing[category]) pricing[category] = { rows: [] };

        // Check duplicate
        const exists = pricing[category].rows.some(existing => existing.name === title && existing.description === desc);
        if (!exists) {
            pricing[category].rows.push({
                name: title,
                description: desc,
                price
            });
            totalCleanedRows++;
        }
    });

    if (Object.keys(pricing).length > 0) {
        f.pricing = pricing;
        updatedCount++;
    }
});

// 5. Save
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log(`\n🎉 DONE! Updated ${updatedCount} facilities.`);
console.log(`📊 Total Valid Pricing Items Synced: ${totalCleanedRows}`);
console.log(`💾 Saved to facilities.json`);
