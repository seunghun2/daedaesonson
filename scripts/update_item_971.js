const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const facility = facilities.find(f => f.id === 'park-0092');

if (!facility) {
    console.log('❌ park-0092 not found');
    process.exit(1);
}

// Item 971 데이터 입력
const rows매장묘 = [
    { name: '공설묘지 사용료', price: 40000, grade: '15년 3회연장가능', isRepresentative: true },
    { name: '공설묘지 관리비', price: 50000, grade: '15년 3회연장가능', isRepresentative: false }
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
            console.log(`✅ park-0092: ${facility.name} (Item 971)`);
            console.log(`   매장묘: ${rows매장묘.length}개 행`);
            console.log(`   총 ${rows매장묘.length}개 행`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

console.log('🚀 Item 971 (park-0092: 선단동공설묘지) 데이터 입력...\n');
update().then(() => console.log('\n✨ Done!'));
