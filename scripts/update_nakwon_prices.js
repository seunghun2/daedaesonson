const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/facilities.json');
const EASY_DATA = path.join(__dirname, '../nakwon_easy.json');

(async () => {
    console.log('=== 낙원추모공원(No.1) 가격표 업데이트 ===\n');

    // 1. Load data
    const facilities = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    const easyPriceTable = JSON.parse(fs.readFileSync(EASY_DATA, 'utf-8'));

    // 2. Find No.1 facility (첫 번째 항목)
    const nakwon = facilities[0];

    console.log(`대상 시설: ${nakwon.name}`);
    console.log(`시설 ID: ${nakwon.id}\n`);

    // 3. Initialize priceInfo if not exists
    if (!nakwon.priceInfo) {
        nakwon.priceInfo = {};
    }

    // 4. Update priceTable
    nakwon.priceInfo.priceTable = easyPriceTable;

    // 5. Update priceRange (기본비용에서 추출)
    const basicCost = easyPriceTable['기본비용'];
    if (basicCost && basicCost.rows) {
        const usageFee = basicCost.rows.find(r => r.name.includes('사용료') && r.price > 0);
        if (usageFee) {
            nakwon.priceRange = {
                min: usageFee.price / 10000, // 만원 단위
                max: usageFee.price / 10000
            };
        }
    }

    // 6. Save
    fs.writeFileSync(DATA_FILE, JSON.stringify(facilities, null, 2));

    console.log('✅ 업데이트 완료!\n');
    console.log('적용된 카테고리:');
    Object.keys(easyPriceTable).forEach(category => {
        const count = easyPriceTable[category].rows.length;
        console.log(`  - ${category}: ${count}개 항목`);
    });

    console.log('\n관리자 페이지에서 확인하세요:');
    console.log('http://localhost:3000/admin/upload');
    console.log('→ No.1 낙원추모공원 클릭 → 가격표 관리 탭');

})();
