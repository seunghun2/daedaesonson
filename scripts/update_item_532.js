const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const facility = facilities.find(f => f.id === 'park-0857');

if (!facility) {
    console.log('❌ park-0857 not found');
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
            봉안당: {
                unit: '원',
                rows: [{
                    name: '납골단',
                    price: 2000000,
                    grade: '목재',
                    isRepresentative: true
                }]
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
            console.log(`✅ Item 532 (park-0857): ${facility.name}`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

console.log('🚀 Updating Item 532...\n');
update().then(() => console.log('\n✨ Done!'));
