const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const facility = facilities.find(f => f.id === 'park-0055');

if (!facility) {
    console.log('❌ park-0055 not found');
    process.exit(1);
}

// 단장형/합장형으로 카테고리 분리
const rows단장형 = [
    { name: '사용료', price: 660000, grade: '동해시민, 15년', isRepresentative: true },
    { name: '관리비', price: 240000, grade: '', isRepresentative: false },
    { name: '석물비', price: 938000, grade: '', isRepresentative: false },
    { name: '매장비 (하절기)', price: 360000, grade: '동해시민, 15년', isRepresentative: false },
    { name: '매장비 (동절기)', price: 400000, grade: '동해시민, 15년', isRepresentative: false }
];

const rows합장형 = [
    { name: '사용료', price: 960000, grade: '동해시민, 15년', isRepresentative: true },
    { name: '관리비', price: 360000, grade: '', isRepresentative: false },
    { name: '석물비', price: 1060000, grade: '', isRepresentative: false },
    { name: '매장비 (하절기)', price: 360000, grade: '동해시민, 15년', isRepresentative: false },
    { name: '매장비 (동절기)', price: 400000, grade: '동해시민, 15년', isRepresentative: false }
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
            console.log(`✅ park-0055: ${facility.name}`);
            console.log(`   단장형: ${rows단장형.length}개 행`);
            console.log(`   합장형: ${rows합장형.length}개 행`);
            console.log(`\n   재구성: 매장묘 → 단장형/합장형 카테고리 분리`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

console.log('🔧 park-0055 (동해시하늘정원) 단장형/합장형 분리...\n');
update().then(() => console.log('\n✨ Done!'));
