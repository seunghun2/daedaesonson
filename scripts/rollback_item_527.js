const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const facility = facilities.find(f => f.id === 'park-0573');

if (!facility) {
    console.log('❌ park-0573 not found');
    process.exit(1);
}

const payload = {
    id: facility.id,
    name: facility.name,
    address: facility.address,
    category: facility.category,
    coordinates: facility.coordinates,
    priceInfo: null
};

async function rollback() {
    try {
        const response = await fetch('http://localhost:3000/api/facilities', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.error) {
            console.log(`❌ Rollback failed: ${result.error}`);
        } else {
            console.log(`✅ Item 527 (park-0573) 롤백 완료: ${facility.name}`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

console.log('🔄 Rolling back Item 527...\n');
rollback().then(() => console.log('\n✨ Done!'));
