const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const facility = facilities.find(f => f.id === 'park-0136');

if (!facility) {
    console.log('❌ park-0136 not found');
    process.exit(1);
}

// 단장형/합장형으로 분리 (이미지 기준)
const rows단장형 = [
    { name: '매장묘역', price: 3000000, grade: '최초15년 연장10년', groupType: '관내 거주자에 한함', isRepresentative: true },
    { name: '매장묘역', price: 750000, grade: '최초15년 연장10년', groupType: null, isRepresentative: false }
];

const rows합장형 = [
    { name: '매장묘역', price: 4500000, grade: '최초15년 연장10년', groupType: '관내 거주자에 한함', isRepresentative: true },
    { name: '매장묘역', price: 1125000, grade: '최초15년 연장10년', groupType: null, isRepresentative: false }
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
            console.log(`✅ park-0136: ${facility.name}`);
            console.log(`   단장형: ${rows단장형.length}개 행 (관내 거주자 1 + 일반 1)`);
            console.log(`   합장형: ${rows합장형.length}개 행 (관내 거주자 1 + 일반 1)`);
            console.log(`\n   재구성: 매장묘 → 단장형/합장형 분리`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

console.log('🔧 park-0136 (인제종합장묘센터) 단장형/합장형 분리...\n');
update().then(() => console.log('\n✨ Done!'));
