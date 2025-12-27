const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const facility = facilities.find(f => f.id === 'park-0094');

if (!facility) {
    console.log('❌ park-0094 not found');
    process.exit(1);
}

// 이미지 기준으로 데이터 입력
const rows매장묘 = [
    { name: '사용료', price: 373370, grade: 'm²', isRepresentative: true },
    { name: '관리비', price: 7670, grade: 'm², 1년', isRepresentative: false },
    { name: '안치비', price: 1500000, grade: '회', isRepresentative: false }
];

const rows석물 = [
    { name: '석물(고급합장묘)', price: 24900000, grade: '1기', isRepresentative: true },
    { name: '석물(고급합장묘)', price: 26100000, grade: '1기', isRepresentative: false }
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
            console.log(`✅ park-0094: ${facility.name}`);
            console.log(`   매장묘: ${rows매장묘.length}개 행`);
            console.log(`   석물: ${rows석물.length}개 행`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

console.log('🚀 park-0094 데이터 입력 (이미지 기준)...\n');
update().then(() => console.log('\n✨ Done!'));
