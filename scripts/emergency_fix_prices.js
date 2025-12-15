const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/facilities.json');

console.log('=== 1~10번 가격 범위 긴급 수정 ===\n');

const facilities = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

// 정확한 가격 (이전에 추출한 데이터)
const correctPrices = {
    1: { min: 300, max: 300, name: '(재)낙원추모공원' },
    2: { min: 216, max: 216, name: '(재)실로암공원묘원' },
    3: { min: 160, max: 160, name: '(재)삼덕공원묘원' },
    4: { min: 495, max: 495, name: '재단법인울산공원묘원' },
    5: { min: 85, max: 85, name: '진주내동공원묘원' },
    6: { min: 107, max: 107, name: '신불산공원묘원' },
    7: { min: 142, max: 142, name: '예산군추모공원' },
    8: { min: 120, max: 120, name: '(재)대지공원묘원' },
    9: { min: 150, max: 150, name: '재단법인선산공원묘원' },
    10: { min: 140, max: 140, name: '재단법인 솥발산공원묘원' }
};

Object.entries(correctPrices).forEach(([num, data]) => {
    const idx = parseInt(num) - 1;
    const facility = facilities[idx];

    const oldPrice = facility.priceRange;
    facility.priceRange = {
        min: data.min,
        max: data.max
    };

    console.log(`${num}. ${facility.name}`);
    console.log(`   이전: ${oldPrice.min}~${oldPrice.max}만원`);
    console.log(`   수정: ${data.min}만원 ✅\n`);
});

// 저장
fs.writeFileSync(DATA_FILE, JSON.stringify(facilities, null, 2));

console.log('✅ 전체 가격 수정 완료!');
console.log('브라우저 새로고침(Cmd+Shift+R) 필수!');
