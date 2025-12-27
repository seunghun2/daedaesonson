const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));

const updates = [
    {
        itemNum: 710,
        id: 'park-0205',
        category: '매장묘',
        rows: [
            { name: '군립묘원 사용료', price: 1900000, grade: '묘지 1기(10m2),30년', isRepresentative: true },
            { name: '군립묘원 관리비', price: 600000, grade: '묘지 1기(10m2), 30년', isRepresentative: false }
        ]
    },
    {
        itemNum: 720,
        id: 'park-0266',
        category: '매장묘',
        rows: [
            { name: '묘지사용료', price: 900000, grade: '3.3m2', isRepresentative: true },
            { name: '묘지관리비', price: 13000, grade: '3.3m2', isRepresentative: false }
        ]
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
                [update.category]: {
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
            console.log(`✅ Item ${update.itemNum} (${update.id}): ${facility.name} - ${update.rows.length}개 행`);
        }
    } catch (error) {
        console.log(`❌ Item ${update.itemNum} (${update.id}): ${error.message}`);
    }
}

async function main() {
    console.log('🚀 Processing Items 710, 720...\n');
    console.log('⏭️  Item 740: 동산추모공원 - 확인 필요 (38개 행)\n');

    for (const update of updates) {
        await updateFacility(update);
    }

    console.log('\n✨ Done!');
}

main();
