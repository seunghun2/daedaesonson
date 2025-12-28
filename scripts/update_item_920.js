const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const facility = facilities.find(f => f.id === 'park-0198');

if (!facility) {
    console.log('❌ park-0198 not found');
    process.exit(1);
}

// Item 920 데이터 입력
const rows매장묘 = [
    { name: '묘지 사용료 (1등지)', price: 25000, grade: '3.3㎡당', isRepresentative: true },
    { name: '묘지 사용료 (2등지)', price: 15000, grade: '3.3㎡당', isRepresentative: false },
    { name: '묘지 사용료 (3등지)', price: 5000, grade: '3.3㎡당', isRepresentative: false },
    { name: '묘지 관리비', price: 2000, grade: '1기당', isRepresentative: false }
];

const payload = {
    id: facility.id,
    name: facility.name,
    address: facility.address,
    category: facility.category,
    coordinates: facility.coordinates,
    priceInfo: {
        priceTable: {
            매장묘: { unit: '원', rows: rows매장묘 }
        }
    }
};

async function update() {
    try {
        const response = await fetch('http://localhost:3000/api/facilities', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.error) {
            console.log(`❌ 업데이트 실패: ${result.error}`);
        } else {
            console.log(`✅ park-0198: ${facility.name} (Item 920)`);
            console.log(`   매장묘: ${rows매장묘.length}개 행`);
            console.log(`   총 ${rows매장묘.length}개 행`);
            console.log(`   등급별 가격: 1등지 25,000원 / 2등지 15,000원 / 3등지 5,000원`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

console.log('🚀 Item 920 (park-0198: 영덕군삼계공설묘지) 데이터 입력...\n');
update().then(() => console.log('\n✨ Done!'));
