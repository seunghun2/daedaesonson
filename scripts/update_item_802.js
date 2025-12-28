const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const facility = facilities.find(f => f.id === 'park-0112');

if (!facility) {
    console.log('❌ park-0112 not found');
    process.exit(1);
}

// Item 802 데이터 입력
const rows매장묘 = [
    { name: '묘지사용료', price: 200000, grade: '1기당 기준면적(6.6㎡)', isRepresentative: true },
    { name: '묘지관리비', price: 250000, grade: '1기당 기준면적(6.6㎡)', isRepresentative: false },
    { name: '연장사용료', price: 200000, grade: '현행금액 징수', isRepresentative: false },
    { name: '연장관리비', price: 250000, grade: '현행금액 징수', isRepresentative: false }
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
            console.log(`✅ park-0112: ${facility.name} (Item 802)`);
            console.log(`   매장묘: ${rows매장묘.length}개 행`);
            console.log(`   총 ${rows매장묘.length}개 행`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

console.log('🚀 Item 802 (park-0112: 이천시설성공설공원묘지) 데이터 입력...\n');
update().then(() => console.log('\n✨ Done!'));
