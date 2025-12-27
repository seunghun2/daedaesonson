const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const facility = facilities.find(f => f.id === 'park-0025');

if (!facility) {
    console.log('❌ park-0025 not found');
    process.exit(1);
}

// 기타/제외됨 데이터를 적절한 카테고리로 재배치
const rows매장묘 = [
    { name: '묘지 사용료', price: 728000, grade: 'm²', isRepresentative: true },
    { name: '묘지 관리비', price: 6060, grade: 'm²/1년, 15년 선납', isRepresentative: false }
];

const rows봉안묘 = [
    { name: '석물_32기내묘', price: 105809000, grade: '', groupType: '석물', isRepresentative: true },
    { name: '석물_화강석열반세트', price: 4334000, grade: '', groupType: '석물', isRepresentative: false },
    { name: '석물_화강석고급세트', price: 8525000, grade: '', groupType: '석물', isRepresentative: false },
    { name: '석물_고풍석고급세트', price: 9812000, grade: '', groupType: '석물', isRepresentative: false },
    { name: '석물_오석고급세트', price: 18018000, grade: '', groupType: '석물', isRepresentative: false },
    { name: '석물_6기내묘', price: 26092000, grade: '', groupType: '석물', isRepresentative: false },
    { name: '석물_8기내묘', price: 27027000, grade: '', groupType: '석물', isRepresentative: false },
    { name: '석물_12기내묘', price: 38247000, grade: '', groupType: '석물', isRepresentative: false },
    { name: '석물_24기내묘', price: 56925000, grade: '', groupType: '석물', isRepresentative: false }
];

const rows평장묘 = [
    { name: '석물_1기평장', price: 1804000, grade: '', isRepresentative: true },
    { name: '석물_2기평장', price: 4521000, grade: '', isRepresentative: false }
];

const rows부대시설 = [
    { name: '석묘사용료', price: 100000, grade: '', isRepresentative: true },
    { name: '조화_대', price: 10000, grade: '', isRepresentative: false },
    { name: '조화_특대', price: 15000, grade: '', isRepresentative: false },
    { name: '관전식 사용료', price: 50000, grade: '', isRepresentative: false },
    { name: '목함', price: 0, grade: '', isRepresentative: false },
    { name: '제례실 사용료', price: 0, grade: '', isRepresentative: false },
    { name: '위패', price: 0, grade: '', isRepresentative: false }
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
            봉안묘: { unit: '원', rows: rows봉안묘 },
            평장묘: { unit: '원', rows: rows평장묘 },
            부대시설: { unit: '원', rows: rows부대시설 }
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
            console.log(`✅ park-0025: ${facility.name}`);
            console.log(`   매장묘: ${rows매장묘.length}개 행`);
            console.log(`   봉안묘: ${rows봉안묘.length}개 행`);
            console.log(`   평장묘: ${rows평장묘.length}개 행`);
            console.log(`   부대시설: ${rows부대시설.length}개 행`);
            console.log(`\n   ❌ 제거: 기타, 제외됨 카테고리`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

console.log('🔧 park-0025 (금릉공원묘원) 카테고리 재구성 (기타/제외됨 제거)...\n');
update().then(() => console.log('\n✨ Done!'));
