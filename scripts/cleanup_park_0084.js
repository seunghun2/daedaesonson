const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const facility = facilities.find(f => f.id === 'park-0084');

if (!facility) {
    console.log('❌ park-0084 not found');
    process.exit(1);
}

// 단장형/합장형으로 재분류
const rows단장형 = [
    { name: '사용료', price: 70000, grade: '15년', isRepresentative: true },
    { name: '매장비', price: 158900, grade: '15년', isRepresentative: false },
    { name: '관리비', price: 153750, grade: '15년', isRepresentative: false }
];

const rows합장형 = [
    { name: '사용료', price: 105000, grade: '15년', isRepresentative: true },
    { name: '매장비', price: 198620, grade: '15년', isRepresentative: false },
    { name: '관리비', price: 208200, grade: '15년', isRepresentative: false }
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
            console.log(`✅ park-0084: ${facility.name}`);
            console.log(`   단장형: ${rows단장형.length}개 행`);
            console.log(`   합장형: ${rows합장형.length}개 행`);
            console.log(`\n   재구성: 매장묘 → 단장형/합장형 분리`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

console.log('🔧 park-0084 카테고리 재분류 (단장형/합장형)...\n');
update().then(() => console.log('\n✨ Done!'));
