const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const facility = facilities.find(f => f.id === 'park-0080');

if (!facility) {
    console.log('❌ park-0080 not found');
    process.exit(1);
}

// 단장형/합장형으로 재분류
const rows단장형 = [
    { name: '분묘 사용료', price: 2000000, grade: '', isRepresentative: true },
    { name: '석물 및 매장비', price: 1970000, grade: '하절기(3월~11월)', isRepresentative: false },
    { name: '석물 및 매장비', price: 2046000, grade: '동절기(12월~2월)', isRepresentative: false }
];

const rows합장형 = [
    { name: '분묘 사용료', price: 3000000, grade: '', isRepresentative: true },
    { name: '석물 및 매장비', price: 2140000, grade: '하절기(3월~11월)', isRepresentative: false },
    { name: '석물 및 매장비', price: 2216000, grade: '동절기(12월~2월)', isRepresentative: false }
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
            console.log(`✅ park-0080: ${facility.name}`);
            console.log(`   단장형: ${rows단장형.length}개 행`);
            console.log(`   합장형: ${rows합장형.length}개 행`);
            console.log(`\n   재구성: 매장묘 → 단장형/합장형 분리`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

console.log('🔧 park-0080 카테고리 재분류 (단장형/합장형)...\n');
update().then(() => console.log('\n✨ Done!'));
