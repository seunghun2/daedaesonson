const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const facility = facilities.find(f => f.id === 'park-0482');

if (!facility) {
    console.log('❌ park-0482 not found');
    process.exit(1);
}

// Item 790 데이터 입력
const rows매장묘 = [
    { name: '매장묘지 사용료', price: 10000, grade: '3.3㎡', isRepresentative: true }
];

const rows평장묘 = [
    { name: '평장묘 묘지사용료', price: 3500000, grade: '3.3㎡', isRepresentative: true },
    { name: '평장묘 관리비', price: 20000, grade: '3.3㎡', isRepresentative: false }
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
            평장묘: { unit: '원', rows: rows평장묘 }
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
            console.log(`✅ park-0482: ${facility.name} (Item 790)`);
            console.log(`   매장묘: ${rows매장묘.length}개 행`);
            console.log(`   평장묘: ${rows평장묘.length}개 행`);
            console.log(`   총 ${rows매장묘.length + rows평장묘.length}개 행`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

console.log('🚀 Item 790 (park-0482: 청량리다볼산묘지) 데이터 입력...\n');
update().then(() => console.log('\n✨ Done!'));
