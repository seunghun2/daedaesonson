const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/facilities.json');
const INPUT_FILE = path.join(__dirname, '../facility_2_categorized.json');

console.log('=== 2번 시설 가격표 적용 ===\n');

const facilities = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
const priceData = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));

// 2번 시설 (index 1)
const facility = facilities[1];

console.log(`적용 대상: ${facility.name}`);

// 가격표 적용
facility.priceInfo = {
    priceTable: priceData
};

// 가격 범위 설정 (기본비용 → 사용료)
const basicCost = priceData['기본비용'];
if (basicCost && basicCost.rows) {
    const usageFee = basicCost.rows.find(r => r.name === '사용료' || r.name.includes('사용료'));
    if (usageFee) {
        facility.priceRange = {
            min: Math.round(usageFee.price / 10000),
            max: Math.round(usageFee.price / 10000)
        };
        console.log(`가격: ${facility.priceRange.min}만원`);
    }
}

console.log(`카테고리: ${Object.keys(priceData).length}개`);

// 저장
fs.writeFileSync(DATA_FILE, JSON.stringify(facilities, null, 2));

console.log('\n✅ 저장 완료!');
console.log('브라우저 새로고침 후 No.2 확인하세요!');
