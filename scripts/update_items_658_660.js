const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));

const updates = [
    {
        itemNum: 658,
        id: 'park-0010',
        category: '매장묘',
        rows: [
            { name: '묘지임대사용료', price: 1400000, grade: '3.3㎡ 묘지임대사용료', isRepresentative: true },
            { name: '묘지공동관리비', price: 20000, grade: '3.3㎡ 년간공동관리비', isRepresentative: false }
        ]
    },
    {
        itemNum: 659,
        id: 'park-0012',
        category: '매장묘',
        csvLines: [
            '659,화산추모공원(묘지),단장묘(6평형) 사용료,19.8㎡,\"5,270,000 원\"',
            '659,화산추모공원(묘지),단장묘(6평형) 관리비,19.8㎡,\"1,730,000 원\"',
            '659,화산추모공원(묘지),단장묘(6평형) 매장비,19.8㎡,\"350,000 원\"',
            '659,화산추모공원(묘지),쌍분묘(6평형) 사용료,19.8㎡,\"8,280,000 원\"',
            '659,화산추모공원(묘지),쌍분묘(6평형) 관리비,19.8㎡,\"1,730,000 원\"',
            '659,화산추모공원(묘지),쌍분묘(6평형) 매장비,19.8㎡,\"500,000 원\"'
        ]
    },
    {
        itemNum: 660,
        id: 'park-0013',
        category: '매장묘',
        csvLines: [
            '660,서울공원묘원,매장묘(단분),\"단분/묘지사용료:평당 200만원/매장작업비150만원포함/5년관리비포함/석물비별도/각자료별도/총계 14,100,000원\",\"14,100,000 원\"',
            '660,서울공원묘원,매장묘(합장),\"합장/묘지사용료:평당 200만원/매장작업비 150만원포함/5년관리비포함/석물비별도/각자료별도/총계 18,300,000원\",\"18,300,000 원\"',
            '660,서울공원묘원,매장묘(쌍분),\"쌍분/묘지사용료:평당 200만원/매장작업비 150만원포함/5년관리비포함/석물비별도/각자료별도/총계 22,500,000원\",\"22,500,000 원\"'
        ]
    }
];

// CSV 라인을 rows로 변환
updates.forEach(update => {
    if (update.csvLines) {
        update.rows = update.csvLines.map((line, idx) => {
            const parts = line.split(',');
            const name = parts[2];
            const grade = parts[3];
            const priceStr = parts[4]?.replace(/['"원,]/g, '').trim();
            const price = parseInt(priceStr) || 0;
            return {
                name,
                price,
                grade,
                isRepresentative: idx === 0
            };
        });
        delete update.csvLines;
    }
});

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
    console.log('🚀 Processing Items 658-660...\n');

    for (const update of updates) {
        await updateFacility(update);
    }

    console.log('\n✨ Done!');
}

main();
