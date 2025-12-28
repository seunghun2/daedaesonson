const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const facility = facilities.find(f => f.id === 'park-0191');

if (!facility) {
    console.log('❌ park-0191 not found');
    process.exit(1);
}

// Item 901 데이터 입력
const rows단장형 = [
    { name: '묘지', price: 366120, grade: '1단', isRepresentative: true }
];

const rows합장형 = [
    { name: '묘지', price: 536970, grade: '1단', isRepresentative: true }
];

const payload = {
    id: facility.id,
    name: facility.name,
    address: facility.address,
    category: facility.category,
    coordinates: facility.coordinates,
    priceInfo: {
        priceTable: {
            단장형: { unit: '원', rows: rows단장형 },
            합장형: { unit: '원', rows: rows합장형 }
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
            console.log(`✅ park-0191: ${facility.name} (Item 901)`);
            console.log(`   단장형: ${rows단장형.length}개 행`);
            console.log(`   합장형: ${rows합장형.length}개 행`);
            console.log(`   총 ${rows단장형.length + rows합장형.length}개 행`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

console.log('🚀 Item 901 (park-0191: 양구군공설묘지) 데이터 입력...\n');
update().then(() => console.log('\n✨ Done!'));
