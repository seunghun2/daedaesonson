const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const facility = facilities.find(f => f.id === 'park-0069');

if (!facility) {
    console.log('❌ park-0069 not found');
    process.exit(1);
}

// Item 778 데이터 입력
const rows매장묘 = [
    { name: '매장묘사용료', price: 1000000, grade: '9.9㎡(3평) 분양중지', isRepresentative: true },
    { name: '매장묘관리비(연)', price: 6000, grade: '3.3㎡', isRepresentative: false },
    { name: '장례작업비', price: 500000, grade: '1인매장', isRepresentative: false },
    { name: '개장작업비', price: 500000, grade: '1인개장', isRepresentative: false },
    { name: '개장작업비', price: 800000, grade: '2인(합장)개장', isRepresentative: false }
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
            console.log(`✅ park-0069: ${facility.name} (Item 778)`);
            console.log(`   매장묘: ${rows매장묘.length}개 행`);
            console.log(`   총 ${rows매장묘.length}개 행`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

console.log('🚀 Item 778 (park-0069: 천주교평내공원묘원) 데이터 입력...\n');
update().then(() => console.log('\n✨ Done!'));
