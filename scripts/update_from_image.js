const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));

const updates = [
    {
        itemNum: 534,
        id: 'park-0627',
        rows: [{
            name: '사용료 및 관리비',
            price: 200000,
            grade: '10년 / 국가유공자(배우자), 수급자 외 사용제한',
            isRepresentative: true
        }]
    },
    {
        itemNum: 535,
        id: 'park-0854',
        rows: [{
            name: '가족봉안묘',
            price: 3720000,
            grade: '사용료:1,786,000원/관리비:1,808,000원(30년)/잔디값:126,000',
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
    console.log('🚀 Processing Items from image...\n');
    console.log('✅ Item 528: 도봉구추모의집 - 이미 처리됨');
    console.log('✅ Item 529: 표선면봉안당 - 이미 처리됨');
    console.log('⏭️  Item 530: 안향정 - SKIP (DB 미발견)');
    console.log('✅ Item 531: 원흥사 납골탑 - 이미 처리됨');
    console.log('⏭️  Item 532: 오봉사 납골당 - SKIP (DB 미발견)');
    console.log('⏭️  Item 533: 하늘뜬 납골당 - SKIP (DB 미발견)');
    console.log('⏭️  Item 536: 대전을봉안당 - SKIP (DB 미발견)\n');

    for (const update of updates) {
        await updateFacility(update);
    }

    console.log('\n✨ Done!');
}

main();
