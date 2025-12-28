const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const facility = facilities.find(f => f.id === 'park-0086');

if (!facility) {
    console.log('❌ park-0086 not found');
    process.exit(1);
}

// 이미지 기준으로 데이터 입력
const rows매장묘 = [
    { name: '묘지사용료', price: 3000000, grade: '9.92㎡', isRepresentative: true },
    { name: '묘지관리비', price: 5000, grade: '3.3㎡', isRepresentative: false }
];

const rows평장묘 = [
    { name: '평장묘지 분양금액(합장)', price: 9000000, grade: '3.3㎡', isRepresentative: true },
    { name: '평장묘지 관리비', price: 66667, grade: '3.3㎡', isRepresentative: false }
];

const rows석물 = [
    { name: '1단 모대', price: 800000, grade: '2150×1530mm', isRepresentative: true },
    { name: '2단 모대', price: 1500000, grade: '2400×1740mm', isRepresentative: false }
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
            평장묘: { unit: '원', rows: rows평장묘 },
            석물: { unit: '원', rows: rows석물 }
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
            console.log(`✅ park-0086: ${facility.name}`);
            console.log(`   매장묘: ${rows매장묘.length}개 행`);
            console.log(`   평장묘: ${rows평장묘.length}개 행`);
            console.log(`   석물: ${rows석물.length}개 행`);
            console.log(`   총 ${rows매장묘.length + rows평장묘.length + rows석물.length}개 행`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

console.log('🚀 park-0086 데이터 입력 (이미지 기준)...\n');
update().then(() => console.log('\n✨ Done!'));
