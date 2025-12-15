const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/facilities.json');

console.log('=== 표준화 검증 ===\n');

const facilities = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
const top10 = facilities.slice(0, 10);

top10.forEach((facility, idx) => {
    console.log(`${idx + 1}. ${facility.name}`);

    if (!facility.priceInfo || !facility.priceInfo.priceTable) {
        console.log('   ❌ 가격표 없음\n');
        return;
    }

    const priceTable = facility.priceInfo.priceTable;
    const categories = Object.keys(priceTable);

    console.log(`   카테고리: ${categories.join(', ')}`);

    categories.forEach(cat => {
        const count = priceTable[cat].rows.length;
        const dbCode = priceTable[cat].category;
        console.log(`     - ${cat}: ${count}개 항목 (DB: ${dbCode})`);

        // 샘플 항목 (처음 2개)
        priceTable[cat].rows.slice(0, 2).forEach(item => {
            console.log(`       · ${item.name}: ${item.price.toLocaleString()}원`);
        });
    });

    console.log('');
});

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✅ 검증 완료\n');
console.log('관리자 페이지에서 확인:');
console.log('http://localhost:3000/admin/upload');
