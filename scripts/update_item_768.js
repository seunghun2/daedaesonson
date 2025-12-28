const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const facility = facilities.find(f => f.id === 'park-0711');

if (!facility) {
    console.log('❌ park-0711 not found');
    process.exit(1);
}

// Item 768 데이터를 기존 데이터에 추가
// 평장묘 추가 (관내/관외)
const rows평장묘 = [
    // 관내
    { name: '사용료', price: 100000, grade: '15년간', groupType: '관내', isRepresentative: true },
    { name: '관리비', price: 75000, grade: '15년간', groupType: '관내', isRepresentative: false },

    // 관외
    { name: '사용료', price: 300000, grade: '15년간', groupType: '관외', isRepresentative: false },
    { name: '관리비', price: 75000, grade: '15년간', groupType: '관외', isRepresentative: false }
];

// 봉안탑 (기존 데이터에 관내/관외 추가)
const rows봉안탑 = [
    // 관내
    { name: '사용료', price: 50000, grade: '15년간', groupType: '관내', isRepresentative: true },
    { name: '관리비', price: 75000, grade: '15년간', groupType: '관내', isRepresentative: false },

    // 관외
    { name: '사용료', price: 100000, grade: '15년간', groupType: '관외', isRepresentative: false },
    { name: '관리비', price: 75000, grade: '15년간', groupType: '관외', isRepresentative: false }
];

const payload = {
    id: facility.id,
    name: facility.name,
    address: facility.address,
    category: facility.category,
    coordinates: facility.coordinates,
    priceInfo: {
        priceTable: {
            평장묘: { unit: '원', rows: rows평장묘 },
            봉안탑: { unit: '원', rows: rows봉안탑 }
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
            console.log(`✅ park-0711: ${facility.name} (Item 768 추가)`);
            console.log(`   평장묘: ${rows평장묘.length}개 행 (관내/관외) ✨ NEW`);
            console.log(`   봉안탑: ${rows봉안탑.length}개 행 (관내/관외 구분)`);
            console.log(`   총 ${rows평장묘.length + rows봉안탑.length}개 행`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

console.log('🔧 park-0711에 Item 768 데이터 추가 (평장묘 + 봉안탑 재구성)...\n');
update().then(() => console.log('\n✨ Done!'));
