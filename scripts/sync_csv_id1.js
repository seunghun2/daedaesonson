const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

// Files
const CSV_PATH = path.join(__dirname, '../data/데이터 - data_on.csv');
const JSON_PATH = path.join(__dirname, '../data/facilities.json');

// 1. Read CSV
const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
const rows = parse(csvContent, {
    columns: true,
    skip_empty_lines: true
});

// 2. Filter ID 1
const targetRows = rows.filter(r => r.id === '1' || r.parkId === '1' || r['시설명'].includes('낙원추모공원'));
console.log(`Found ${targetRows.length} rows for ID 1 in CSV.`);

// 3. Define Cleaning Rules
const DROP_KEYWORDS = ['작업비', '개장', '수선', '유골함', '석물', '석곽', '석봉분', '향로', '구판', '설치비', '각자대', '식당', '천막', '나무제거'];
const KEEP_KEYWORDS = ['사용료', '관리비', '매장묘', '봉안', '수목', '평장', '잔디', '부부', '가족', '개인', '단형', '월석'];

// 4. Process Rows
const cleanedRows = [];
const droppedRows = [];

targetRows.forEach(r => {
    const title = r['제목'] || '';
    const desc = r['설명'] || '';
    const priceStr = r['가격'] || '0';
    const price = parseInt(priceStr.replace(/,/g, ''), 10) || 0;

    const text = (title + desc).toLowerCase();

    // Check Drop
    const shouldDrop = DROP_KEYWORDS.some(k => text.includes(k));

    if (shouldDrop) {
        droppedRows.push(title);
        return;
    }

    // Categorize
    let category = '기타'; // Default
    if (text.includes('매장') || text.includes('묘') || text.includes('봉분')) category = '매장묘';
    if (text.includes('봉안') || text.includes('단')) category = '봉안당';
    if (text.includes('수목') || text.includes('평장') || text.includes('자연') || text.includes('잔디')) category = '수목장';

    cleanedRows.push({
        category,
        name: title,
        description: desc,
        price
    });
});

console.log(`Dropped ${droppedRows.length} junk rows.`);
console.log(`Kept ${cleanedRows.length} valid rows.`);

// 5. Update facilities.json
const facilities = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));
const fIndex = facilities.findIndex(f => f.id === 'park-0001' || f.name.includes('낙원추모공원'));

if (fIndex === -1) {
    console.error("Could not find ID 1 in facilities.json");
    process.exit(1);
}

// Group by category
const pricing = {};
cleanedRows.forEach(r => {
    if (!pricing[r.category]) pricing[r.category] = { rows: [] };
    pricing[r.category].rows.push({
        name: r.name,
        description: r.description,
        price: r.price
    });
});

// Update
facilities[fIndex].pricing = pricing;

// Save
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log("✅ Successfully synced cleaned CSV data to facilities.json!");
console.log("Categories updated:", Object.keys(pricing));
