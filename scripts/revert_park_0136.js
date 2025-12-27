const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const facility = facilities.find(f => f.id === 'park-0136');

if (!facility) {
    console.log('❌ park-0136 not found');
    process.exit(1);
}

// 원래대로 되돌리기 (매장묘)
const rows매장묘 = [
    { name: '매장묘역(단장)(최초15년 연장10년)', price: 750000, grade: '', isRepresentative: true },
    { name: '매장묘역(합장)(최초15년 연장10년)', price: 1125000, grade: '', isRepresentative: false },
    { name: '매장묘역(단장)(최초15년 연장10년)', price: 3000000, grade: '관내 거주자에 한함', isRepresentative: false },
    { name: '매장묘역(합장)(최초15년 연장10년)', price: 4500000, grade: '관내 거주자에 한함', isRepresentative: false }
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
            console.log(`✅ park-0136: ${facility.name}`);
            console.log(`   매장묘: ${rows매장묘.length}개 행 (원래대로 복구)`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

console.log('🔄 park-0136 원래대로 복구 중...\n');
update().then(() => console.log('\n✨ Done!'));
