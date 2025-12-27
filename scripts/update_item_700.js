const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const facility = facilities.find(f => f.id === 'park-0154');

if (!facility) {
    console.log('❌ park-0154 not found');
    process.exit(1);
}

const payload = {
    id: facility.id,
    name: facility.name,
    address: facility.address,
    category: facility.category,
    coordinates: facility.coordinates,
    priceInfo: {
        priceTable: {
            매장묘: {
                unit: '원',
                rows: [
                    { name: '사용료', price: 600000, grade: '매장비(문의031-334-0807)', isRepresentative: true },
                    { name: '관리비(영구관리 묘지)', price: 10000, grade: '3.3㎡ (1평)/연간', isRepresentative: false },
                    { name: '관리비(기간제관리 묘지)', price: 20000, grade: '3.3㎡ (1평)/연간', isRepresentative: false }
                ]
            }
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
            console.log(`✅ Item 700 (park-0154): ${facility.name} - 3개 행 업데이트 완료`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

console.log('🚀 Updating Item 700...\n');
update().then(() => console.log('\n✨ Done!'));
