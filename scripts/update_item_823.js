const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const facility = facilities.find(f => f.id === 'park-0138');

if (!facility) {
    console.log('❌ park-0138 not found');
    process.exit(1);
}

// Item 823 데이터 입력
const rows매장묘 = [
    { name: '사용료', price: 2000000, grade: '사용기간 30년', isRepresentative: true },
    { name: '관리비', price: 1000000, grade: '30년분', isRepresentative: false },
    { name: '용역비 기타', price: 900000, grade: '기타용역비', isRepresentative: false }
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
            console.log(`✅ park-0138: ${facility.name} (Item 823)`);
            console.log(`   매장묘: ${rows매장묘.length}개 행`);
            console.log(`   총 ${rows매장묘.length}개 행`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

console.log('🚀 Item 823 (park-0138: 가톨릭 군위묘원) 데이터 입력...\n');
update().then(() => console.log('\n✨ Done!'));
