const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const facility = facilities.find(f => f.id === 'park-0221');

if (!facility) {
    console.log('❌ park-0221 not found');
    process.exit(1);
}

// Item 957 데이터 입력
const rows매장묘 = [
    { name: '묘지사용료', price: 900000, grade: '30년/3.3㎡(평당)', isRepresentative: true },
    { name: '관리비', price: 13000, grade: '년/3.3㎡(평당)', isRepresentative: false }
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
            console.log(`✅ park-0221: ${facility.name} (Item 957)`);
            console.log(`   매장묘: ${rows매장묘.length}개 행`);
            console.log(`   총 ${rows매장묘.length}개 행`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

console.log('🚀 Item 957 (park-0221: 금산공원묘원) 데이터 입력...\n');
update().then(() => console.log('\n✨ Done!'));
