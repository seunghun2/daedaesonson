const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const facility = facilities.find(f => f.id === 'park-0158');

if (!facility) {
    console.log('❌ park-0158 not found');
    process.exit(1);
}

// Item 839 데이터 입력
const rows매장묘 = [
    { name: '매장', price: 1200000, grade: '1기당', isRepresentative: true },
    { name: '관리비', price: 40000, grade: '년관리비', isRepresentative: false }
];

const rows봉안묘 = [
    { name: '납골', price: 600000, grade: '1기당', isRepresentative: true },
    { name: '관리비', price: 40000, grade: '년관리비', isRepresentative: false }
];

const payload = {
    id: facility.id,
    name: facility.name,
    address: facility.address,
    category: facility.category,
    coordinates: facility.coordinates,
    priceInfo: {
        priceTable: {
            매장묘: { unit: '원', rows: rows매장묘 },
            봉안묘: { unit: '원', rows: rows봉안묘 }
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
            console.log(`✅ park-0158: ${facility.name} (Item 839)`);
            console.log(`   매장묘: ${rows매장묘.length}개 행`);
            console.log(`   봉안묘: ${rows봉안묘.length}개 행`);
            console.log(`   총 ${rows매장묘.length + rows봉안묘.length}개 행`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

console.log('🚀 Item 839 (park-0158: 정주동산) 데이터 입력...\n');
update().then(() => console.log('\n✨ Done!'));
