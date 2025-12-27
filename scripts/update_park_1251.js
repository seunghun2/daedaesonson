const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const facility = facilities.find(f => f.id === 'park-1251');

if (!facility) {
    console.log('❌ park-1251 not found');
    process.exit(1);
}

// 이미지 기준으로 데이터 입력
const rows매장묘 = [
    { name: '사용료', price: 1577000, grade: '3.3m2', isRepresentative: true },
    { name: '관리비', price: 18400, grade: '3.3m2', isRepresentative: false }
];

const rows평장묘 = [
    { name: '평장담 남한강 (2형)', price: 4000000, grade: '2기', isRepresentative: true },
    { name: '평장담 남한강 백금(2.5형)', price: 4000000, grade: '2기', isRepresentative: false }
];

const payload = {
    id: facility.id,
    name: facility.name,
    address: facility.address,
    category: facility.category,
    coordinates: facility.coordinates,
    priceInfo: {
        priceTable: {
            매장묘: { unit: '원', rows: rows매장묘 },
            평장묘: { unit: '원', rows: rows평장묘 }
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
            console.log(`✅ park-1251: ${facility.name}`);
            console.log(`   매장묘: ${rows매장묘.length}개 행`);
            console.log(`   평장묘: ${rows평장묘.length}개 행`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

console.log('🚀 park-1251 데이터 입력 (이미지 기준)...\n');
update().then(() => console.log('\n✨ Done!'));
