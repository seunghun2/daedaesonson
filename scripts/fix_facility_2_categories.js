const fs = require('fs');
const path = require('path');

const INPUT_FILE = path.join(__dirname, '../facility_2_categorized.json');
const OUTPUT_FILE = path.join(__dirname, '../facility_2_fixed.json');

console.log('=== 2번 시설 카테고리 수정 ===\n');

const data = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));

// 기본비용에서 매장묘 세트 추출
const basicCost = data['기본비용'].rows;
const realBasic = basicCost.filter(r => !r.name.includes('매장묘'));
const graveSets = basicCost.filter(r => r.name.includes('매장묘'));

console.log(`기본비용: ${basicCost.length}개 → ${realBasic.length}개`);
console.log(`매장묘 세트: ${graveSets.length}개 추출`);

// 매장묘 카테고리 생성
data['기본비용'].rows = realBasic;
data['매장묘'] = {
    unit: '원',
    category: 'grave',
    rows: graveSets.sort((a, b) => a.price - b.price) // 가격 낮은 순
};

console.log('\n수정된 카테고리:');
Object.keys(data).forEach(cat => {
    console.log(`  ${cat}: ${data[cat].rows.length}개`);
});

// 저장
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2));

console.log(`\n💾 저장: ${OUTPUT_FILE}`);
