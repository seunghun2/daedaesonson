const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));

const updates = [
    {
        itemNum: 659,
        id: 'park-0012',
        category: '매장묘',
        rows: [
            { name: '단장묘(6평형) 사용료', price: 5270000, grade: '19.8㎡', isRepresentative: true },
            { name: '단장묘(6평형) 관리비', price: 1730000, grade: '19.8㎡', isRepresentative: false },
            { name: '단장묘(6평형) 매장비', price: 350000, grade: '19.8㎡', isRepresentative: false },
            { name: '쌍분묘(6평형) 사용료', price: 8280000, grade: '19.8㎡', isRepresentative: false },
            { name: '쌍분묘(6평형) 관리비', price: 1730000, grade: '19.8㎡', isRepresentative: false },
            { name: '쌍분묘(6평형) 매장비', price: 500000, grade: '19.8㎡', isRepresentative: false }
        ]
    },
    {
        itemNum: 660,
        id: 'park-0013',
        category: '매장묘',
        rows: [
            { name: '매장묘(단분)', price: 14100000, grade: '단분/묘지사용료:평당 200만원/매장작업비150만원포함/5년관리비포함/석물비별도/각자료별도', isRepresentative: true },
            { name: '매장묘(합장)', price: 18300000, grade: '합장/묘지사용료:평당 200만원/매장작업비 150만원포함/5년관리비포함/석물비별도/각자료별도', isRepresentative: false },
            { name: '매장묘(쌍분)', price: 22500000, grade: '쌍분/묘지사용료:평당 200만원/매장작업비 150만원포함/5년관리비포함/석물비별도/각자료별도', isRepresentative: false }
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
            console.log(`✅ Item ${update.itemNum} (${update.id}): ${facility.name} - ${update.rows.length}개 행 수정 완료`);
        }
    } catch (error) {
        console.log(`❌ Item ${update.itemNum} (${update.id}): ${error.message}`);
    }
}

async function main() {
    console.log('🔧 Fixing Items 659-660 (가격 수정)...\n');

    for (const update of updates) {
        await updateFacility(update);
    }

    console.log('\n✨ Done!');
}

main();
