const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const facility = facilities.find(f => f.id === 'park-0060');

if (!facility) {
    console.log('❌ park-0060 not found');
    process.exit(1);
}

// Item 773 데이터 입력 - 매장묘/봉안당 구분
const rows매장묘 = [
    { name: '묘지대', price: 1000000, grade: '3.3㎡당', isRepresentative: true },
    { name: '묘지관리', price: 12000, grade: '3.3㎡당/1년', isRepresentative: false }
];

const rows봉안당 = [
    // 유연납골
    { name: '유연납골', price: 280000, grade: '10년간', groupType: '유연납골', isRepresentative: true },
    { name: '유연납골', price: 50000, grade: '1기당', groupType: '유연납골', isRepresentative: false },

    // 무연납골
    { name: '무연납골', price: 50000, grade: '10년간', groupType: '무연납골', isRepresentative: false },
    { name: '무연납골', price: 25000, grade: '1기당', groupType: '무연납골', isRepresentative: false }
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
            봉안당: { unit: '원', rows: rows봉안당 }
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
            console.log(`✅ park-0060: ${facility.name} (Item 773)`);
            console.log(`   매장묘: ${rows매장묘.length}개 행`);
            console.log(`   봉안당: ${rows봉안당.length}개 행 (유연납골/무연납골)`);
            console.log(`   총 ${rows매장묘.length + rows봉안당.length}개 행`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

console.log('🚀 Item 773 (park-0060: 조양공원) 데이터 입력...\n');
update().then(() => console.log('\n✨ Done!'));
