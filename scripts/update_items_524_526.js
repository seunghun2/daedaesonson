const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));

const updates = [
    {
        itemNum: 524,
        id: 'park-0873',
        rows: [{
            name: '15년 사용',
            price: 800000,
            grade: '15년 사용료+관리비',
            isRepresentative: true
        }]
    },
    {
        itemNum: 525,
        id: 'park-0870',
        rows: [{
            name: '개인단',
            price: 200000,
            grade: '최초 15년 사용 후 10년씩 3번 연장가능',
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
            console.log(`✅ Item ${update.itemNum} (${update.id}): ${facility.name} - ${update.rows.length} rows`);
        }
    } catch (error) {
        console.log(`❌ Item ${update.itemNum} (${update.id}): ${error.message}`);
    }
}

async function main() {
    console.log('🚀 Updating Items 524-525...\n');
    console.log('⏭️  Item 526: 상락향 사설봉안탑 - SKIP (가격 0원, 이용불가)\n');

    for (const update of updates) {
        await updateFacility(update);
    }

    console.log('\n✨ Done!');
}

main();
