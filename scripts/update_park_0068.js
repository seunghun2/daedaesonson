const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const facility = facilities.find(f => f.id === 'park-0068');

if (!facility) {
    console.log('❌ park-0068 not found');
    process.exit(1);
}

// 이미지 기준으로 데이터 입력 - 합장형/단장형 구분
const rows합장형 = [
    { name: '묘지봉안', price: 5000000, grade: '합장형', isRepresentative: true },
    { name: '묘지석비', price: 2400000, grade: '모비,모대', isRepresentative: false },
    { name: '묘지관리비', price: 1950000, grade: '15년분', isRepresentative: false },
    { name: '묘지작업비', price: 1400000, grade: '잔디,봉분,외', isRepresentative: false }
];

const rows단장형 = [
    { name: '묘지봉안', price: 3000000, grade: '단장형', isRepresentative: true },
    { name: '묘지석비', price: 2000000, grade: '모비,모대', isRepresentative: false },
    { name: '묘지관리비', price: 1350000, grade: '15년분', isRepresentative: false },
    { name: '묘지작업비', price: 1400000, grade: '잔디,봉분,외', isRepresentative: false }
];

const payload = {
    id: facility.id,
    name: facility.name,
    address: facility.address,
    category: facility.category,
    coordinates: facility.coordinates,
    priceInfo: {
        priceTable: {
            합장형: { unit: '원', rows: rows합장형 },
            단장형: { unit: '원', rows: rows단장형 }
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
            console.log(`✅ park-0068: ${facility.name}`);
            console.log(`   합장형: ${rows합장형.length}개 행`);
            console.log(`   단장형: ${rows단장형.length}개 행`);
            console.log(`   총 ${rows합장형.length + rows단장형.length}개 행`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

console.log('🚀 park-0068 데이터 입력 (이미지 기준)...\n');
update().then(() => console.log('\n✨ Done!'));
