const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const facility = facilities.find(f => f.id === 'park-0085');

if (!facility) {
    console.log('❌ park-0085 not found');
    process.exit(1);
}

// Item 781 데이터 입력 - 단장형/합장형 + 봉안묘
const rows단장형 = [
    { name: '매장묘지 사용료', price: 300000, grade: '평당', isRepresentative: true },
    { name: '매장묘지 관리비', price: 70000, grade: '기당', isRepresentative: false },
    { name: '단장', price: 4100000, grade: '1기', isRepresentative: false }
];

const rows합장형 = [
    { name: '매장묘지 사용료', price: 300000, grade: '평당', isRepresentative: true },
    { name: '매장묘지 관리비', price: 70000, grade: '기당', isRepresentative: false },
    { name: '합장', price: 5100000, grade: '1기', isRepresentative: false }
];

const rows봉안묘 = [
    { name: '납골묘지 사용료', price: 650000, grade: '평당', isRepresentative: true },
    { name: '납골묘지 관리비', price: 70000, grade: '10평당', isRepresentative: false }
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
            합장형: { unit: '원', rows: rows합장형 },
            봉안묘: { unit: '원', rows: rows봉안묘 }
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
            console.log(`✅ park-0085: ${facility.name} (Item 781)`);
            console.log(`   단장형: ${rows단장형.length}개 행`);
            console.log(`   합장형: ${rows합장형.length}개 행`);
            console.log(`   봉안묘: ${rows봉안묘.length}개 행`);
            console.log(`   총 ${rows단장형.length + rows합장형.length + rows봉안묘.length}개 행`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

console.log('🚀 Item 781 (park-0085: 영동공원묘원) 데이터 입력...\n');
update().then(() => console.log('\n✨ Done!'));
