const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/facilities.json');
const PRICE_FILE = path.join(__dirname, '../facilities_3_to_10_prices.json');

console.log('=== 3~10번 가격 정확히 수정 ===\n');

const facilities = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
const priceData = JSON.parse(fs.readFileSync(PRICE_FILE, 'utf-8'));

// 가격 매핑
const priceMap = {
    3: 160,  // 삼덕
    4: 495,  // 울산
    5: 85,   // 진주
    6: 107,  // 신불산
    7: 142,  // 예산
    10: 140  // 솥발산
};

Object.entries(priceMap).forEach(([num, price]) => {
    const idx = parseInt(num) - 1;
    const facility = facilities[idx];

    const oldPrice = facility.priceRange.min;
    facility.priceRange = {
        min: price,
        max: price
    };

    console.log(`${num}. ${facility.name}`);
    console.log(`   가격: ${oldPrice}만원 → ${price}만원 ✅`);
});

// 저장
fs.writeFileSync(DATA_FILE, JSON.stringify(facilities, null, 2));

console.log('\n✅ 가격 수정 완료!');
