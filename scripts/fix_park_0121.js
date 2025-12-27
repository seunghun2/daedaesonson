const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const facility = facilities.find(f => f.id === 'park-0121');

if (!facility) {
    console.log('❌ park-0121 not found');
    process.exit(1);
}

// 단장형/합장형으로 재배치
const rows단장형 = [
    { name: '1단', price: 3619280, grade: '', isRepresentative: true },
    { name: '2단', price: 3919280, grade: '', isRepresentative: false }
];

const rows합장형 = [
    { name: '1단', price: 4878420, grade: '', isRepresentative: true },
    { name: '2단', price: 5318420, grade: '', isRepresentative: false }
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
            console.log(`✅ park-0121: ${facility.name}`);
            console.log(`   단장형: ${rows단장형.length}개 행`);
            console.log(`   합장형: ${rows합장형.length}개 행`);
            console.log(`\n   재구성: 봉안당 → 단장형/합장형으로 재배치`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

console.log('🔧 park-0121 (춘천안식공원) 카테고리 재배치...\n');
update().then(() => console.log('\n✨ Done!'));
