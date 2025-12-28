const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const facility = facilities.find(f => f.id === 'park-0163');

if (!facility) {
    console.log('❌ park-0163 not found');
    process.exit(1);
}

// Item 841 데이터 입력 - 단장형/합장형
const rows단장형 = [
    { name: '공설묘지 사용료', price: 20000, grade: '1㎡당, 30년(1회 15년 연장가능)', isRepresentative: true },
    { name: '공설묘지 관리비', price: 160000, grade: '1기당, 30년(1회 15년 연장가능)', isRepresentative: false }
];

const rows합장형 = [
    { name: '합장묘', price: 990000, grade: '1기당, 30년', isRepresentative: true },
    { name: '공설묘지 관리비', price: 240000, grade: '1기당, 30년(1회 15년 연장가능)', isRepresentative: false }
];

const payload = {
    id: facility.id,
    name: facility.name,
    address: facility.address,
    category: facility.category,
    coordinates: facility.coordinates,
    priceInfo: {
        priceTable: {
            단장형: { unit: '원', rows: rows단장형 },
            합장형: { unit: '원', rows: rows합장형 }
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
            console.log(`✅ park-0163: ${facility.name} (Item 841)`);
            console.log(`   단장형: ${rows단장형.length}개 행`);
            console.log(`   합장형: ${rows합장형.length}개 행`);
            console.log(`   총 ${rows단장형.length + rows합장형.length}개 행`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

console.log('🚀 Item 841 (park-0163: 동명공동묘지) 데이터 입력...\n');
update().then(() => console.log('\n✨ Done!'));
