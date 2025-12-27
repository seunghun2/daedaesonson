const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const facility = facilities.find(f => f.id === 'park-0769');

if (!facility) {
    console.log('❌ park-0769 not found');
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
            봉안탑: {
                unit: '원',
                rows: [
                    { name: '봉안탑', price: 6500000, grade: '소', isRepresentative: true },
                    { name: '봉안탑', price: 7500000, grade: '중', isRepresentative: false },
                    { name: '봉안탑', price: 10000000, grade: '대', isRepresentative: false }
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
            console.log(`✅ Item 603 (park-0769): ${facility.name} - 3개 행 업데이트 완료`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

console.log('🚀 Updating Item 603...\n');
update().then(() => console.log('\n✨ Done!'));
