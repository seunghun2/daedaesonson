const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const facility = facilities.find(f => f.id === 'park-0012');

if (!facility) {
    console.log('❌ park-0012 not found');
    process.exit(1);
}

// 이미지 기준으로 전체 20개 행 업데이트
const rows매장묘 = [
    { name: '단장묘(6평형) 사용료', price: 5270000, grade: '19.8㎡', isRepresentative: true },
    { name: '단장묘(6평형) 관리비', price: 1730000, grade: '19.8㎡', isRepresentative: false },
    { name: '단장묘(6평형) 매장비', price: 450000, grade: '19.8㎡', isRepresentative: false },
    { name: '합장묘(9평형) 사용료', price: 7900000, grade: '29.7㎡', isRepresentative: false },
    { name: '합장묘(9평형) 관리비', price: 2600000, grade: '29.7㎡', isRepresentative: false },
    { name: '합장묘(9평형) 매장비', price: 750000, grade: '29.7㎡', isRepresentative: false }
];

const rows봉안묘 = [
    { name: '봉안묘6기(3평형) 사용료', price: 2630000, grade: '9.9㎡', isRepresentative: true },
    { name: '봉안묘6기(3평형) 관리비', price: 860000, grade: '9.9㎡', isRepresentative: false },
    { name: '봉안묘12기(4.5평형) 사용료', price: 3950000, grade: '14.8㎡', isRepresentative: false },
    { name: '봉안묘12기(4.5평형) 관리비', price: 1300000, grade: '14.8㎡', isRepresentative: false },
    { name: '봉안묘12기(4.5평형) 봉안비', price: 250000, grade: '14.8㎡', isRepresentative: false },
    { name: '봉안묘24기(6평형) 사용료', price: 5270000, grade: '19.8㎡', isRepresentative: false },
    { name: '봉안묘24기(6평형) 관리비', price: 1730000, grade: '19.8㎡', isRepresentative: false },
    { name: '봉안묘24기(6평형) 봉안비', price: 250000, grade: '19.8㎡', isRepresentative: false },
    { name: '봉안묘36기(9평형) 사용료', price: 7900000, grade: '29.7㎡', isRepresentative: false },
    { name: '봉안묘36기(9평형) 관리비', price: 2600000, grade: '29.7㎡', isRepresentative: false },
    { name: '봉안묘36기(9평형) 봉안비', price: 250000, grade: '29.7㎡', isRepresentative: false },
    { name: '봉안묘60기(15평형) 사용료', price: 13180000, grade: '49.5㎡', isRepresentative: false },
    { name: '봉안묘60기(15평형) 관리비', price: 4340000, grade: '49.5㎡', isRepresentative: false },
    { name: '봉안묘60기(15평형) 봉안비', price: 250000, grade: '49.5㎡', isRepresentative: false }
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
            console.log(`✅ Item 659 (park-0012): ${facility.name}`);
            console.log(`   매장묘: ${rows매장묘.length}개 행 (단장묘 3행 + 합장묘 3행)`);
            console.log(`   봉안묘: ${rows봉안묘.length}개 행 (6기/12기/24기/36기/60기)`);
            console.log(`   총 ${rows매장묘.length + rows봉안묘.length}개 행 업데이트 완료`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

console.log('🔧 Item 659 전체 데이터 업데이트 (이미지 기준)...\n');
update().then(() => console.log('\n✨ Done!'));
