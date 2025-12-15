
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../esky_full_with_details.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf-8')).list || [];

// 모든 detail의 키를 수집
const allKeys = new Set();
data.forEach(item => {
    if (item.detail) {
        Object.keys(item.detail).forEach(k => allKeys.add(k));
    }
});

console.log('--- Detail Object Keys ---');
console.log(Array.from(allKeys).sort());

// 가격 관련 키와 값을 샘플링
console.log('\n--- Price Related Samples ---');
const priceSamples = data.filter(item => item.detail && Object.keys(item.detail).some(k => k.includes('amt') && item.detail[k] > 0)).slice(0, 5);

priceSamples.forEach((item, idx) => {
    console.log(`\n[${idx}] ${item.companyname} (${item.facilitygroupcd})`);
    const prices = {};
    Object.keys(item.detail).forEach(key => {
        if (key.includes('amt')) prices[key] = item.detail[key];
    });
    console.log(prices);
});
