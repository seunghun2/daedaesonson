const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const facility = facilities.find(f => f.id === 'park-0089');

if (!facility) {
    console.log('❌ park-0089 not found');
    process.exit(1);
}

// 이미지 기준으로 일반시민/특례자 구분
const rows매장묘 = [
    // 일반시민
    { name: '공설묘지사용료', price: 540000, grade: '묘지1기당 6.61제곱m/30년', groupType: '일반시민', isRepresentative: true },
    { name: '공설묘지관리비', price: 360000, grade: '묘지1기당 6.61제곱m/30년', groupType: '일반시민', isRepresentative: false },
    { name: '부대수수료', price: 702000, grade: '묘지1기당 6.61제곱m/30년', groupType: '일반시민', isRepresentative: false },

    // 특례자
    { name: '공설묘지사용료', price: 810000, grade: '묘지1기당 6.61제곱m/30년', groupType: '특례자', isRepresentative: false },
    { name: '공설묘지관리비', price: 360000, grade: '묘지1기당 6.61제곱m/30년', groupType: '특례자', isRepresentative: false },
    { name: '부대수수료', price: 702000, grade: '묘지1기당 6.61제곱m/30년', groupType: '특례자', isRepresentative: false }
];

const payload = {
    id: facility.id,
    name: facility.name,
    address: facility.address,
    category: facility.category,
    coordinates: facility.coordinates,
    priceInfo: {
        priceTable: {
            매장묘: { unit: '원', rows: rows매장묘 }
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
            console.log(`✅ park-0089: ${facility.name}`);
            console.log(`   매장묘: ${rows매장묘.length}개 행 (일반시민 3 + 특례자 3)`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

console.log('🚀 park-0089 일반시민/특례자 구분 업데이트...\n');
update().then(() => console.log('\n✨ Done!'));
