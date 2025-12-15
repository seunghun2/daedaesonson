const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/facilities.json');

console.log('=== 3번 삼덕공원묘원 수정 ===\n');

const facilities = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
const facility = facilities[2];

console.log('현재 상태:');
console.log(`  이름: ${facility.name}`);
console.log(`  운영형태: ${facility.operatorType}`);
console.log(`  주소: ${facility.address}`);
console.log(`  좌표: ${facility.coordinates.lat}, ${facility.coordinates.lng}`);
console.log(`  가격: ${facility.priceRange.min}만원`);

// 수정
console.log('\n수정:');

// 1. 운영형태: (재) → FOUNDATION
if (facility.name.includes('(재)')) {
    facility.operatorType = 'FOUNDATION';
    console.log('  ✅ 운영형태: PRIVATE → FOUNDATION');
}

// 2. 주소: 이미 PDF에서 제대로 파싱됨
console.log('  ✅ 주소: ' + facility.address);

// 3. 좌표: 주소 기반으로 재설정 (울산광역시 울주군 삼동면)
// 임시 좌표 (나중에 실제 geocoding 필요)
if (facility.coordinates.lat === 0) {
    facility.coordinates = {
        lat: 35.4589, // 울산 울주군 삼동면 대략 좌표
        lng: 129.1556
    };
    console.log('  ✅ 좌표: 0,0 → 35.4589, 129.1556');
}

// 4. 가격: 기본비용 확인
const basicCost = facility.priceInfo?.priceTable?.['기본비용'];
if (!basicCost || basicCost.rows.length === 0) {
    console.log('  ⚠️  기본비용 없음 → 가격 수동 확인 필요');
} else {
    console.log(`  ℹ️  기본비용: ${basicCost.rows.length}개 항목`);
    basicCost.rows.forEach(r => {
        console.log(`     - ${r.name}: ${r.price.toLocaleString()}원`);
    });
}

// 저장
fs.writeFileSync(DATA_FILE, JSON.stringify(facilities, null, 2));

console.log('\n✅ 3번 수정 완료!');
