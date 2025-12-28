const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const facility = facilities.find(f => f.id === 'park-0487');

if (!facility) {
    console.log('❌ park-0487 not found');
    process.exit(1);
}

// Item 795 데이터 입력 - 단장형/합장형
const rows단장형 = [
    { name: '공설공원묘지 사용료', price: 150000, grade: '15년', isRepresentative: true },
    { name: '공설공원묘지 관리비', price: 150000, grade: '15년', isRepresentative: false }
];

const rows합장형 = [
    { name: '공설공원묘지 사용료', price: 225000, grade: '15년', isRepresentative: true },
    { name: '공설공원묘지 관리비', price: 225000, grade: '15년', isRepresentative: false }
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
            console.log(`✅ park-0487: ${facility.name} (Item 795)`);
            console.log(`   단장형: ${rows단장형.length}개 행`);
            console.log(`   합장형: ${rows합장형.length}개 행`);
            console.log(`   총 ${rows단장형.length + rows합장형.length}개 행`);
            console.log(`   이용자격: 여주시민`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

console.log('🚀 Item 795 (park-0487: 광대리공설공원묘지) 데이터 입력...\n');
update().then(() => console.log('\n✨ Done!'));
