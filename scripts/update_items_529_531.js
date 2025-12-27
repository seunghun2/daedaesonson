const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));

const updates = [
    {
        itemNum: 529,
        id: 'park-0867',
        rows: [{
            name: '개인단',
            price: 20000,
            grade: '도내 2만원 도외5만원',
            isRepresentative: true
        }]
    },
    {
        itemNum: 531,
        id: 'park-0871',
        rows: [{
            name: '납골당 비용',
            price: 4000000,
            grade: '',
            isRepresentative: true
        }]
    }
];

async function updateFacility(update) {
    const facility = facilities.find(f => f.id === update.id);
    if (!facility) {
        console.log(`❌ Item ${update.itemNum}: ${update.id} not found`);
        return;
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
                    rows: update.rows
                }
            }
        }
    };

    try {
        const response = await fetch('http://localhost:3000/api/facilities', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.error) {
            console.log(`❌ Item ${update.itemNum} (${update.id}): ${result.error}`);
        } else {
            console.log(`✅ Item ${update.itemNum} (${update.id}): ${facility.name}`);
        }
    } catch (error) {
        console.log(`❌ Item ${update.itemNum} (${update.id}): ${error.message}`);
    }
}

async function main() {
    console.log('🚀 Processing Items 529-531...\n');
    console.log('✅ Item 528 (park-0872): 도봉구추모의집 - 이미 처리됨');
    console.log('⏭️  Item 530: 안향정 - SKIP (DB 미발견)\n');

    for (const update of updates) {
        await updateFacility(update);
    }

    console.log('\n✨ Done!');
}

main();
