const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const facility = facilities.find(f => f.id === 'park-0064');

if (!facility) {
    console.log('❌ park-0064 not found');
    process.exit(1);
}

// 단장형/합장형으로 재분류하고 관내/관외 groupType
const rows단장형 = [
    // 관내 거주자
    { name: '사용료', price: 201000, grade: '30년(15년 1회 연장가능)', groupType: '관내 거주자', isRepresentative: true },
    { name: '사용료', price: 327000, grade: '30년(15년 1회 연장가능)', groupType: '관내 거주자', isRepresentative: false },

    // 관외 거주자
    { name: '사용료', price: 261000, grade: '30년(15년 1회 연장가능)', groupType: '관외 거주자', isRepresentative: false },
    { name: '사용료', price: 425000, grade: '30년(15년 1회 연장가능)', groupType: '관외 거주자', isRepresentative: false }
];

const rows합장형 = [
    // 관내 거주자
    { name: '사용료', price: 226000, grade: '30년(15년 1회 연장가능)', groupType: '관내 거주자', isRepresentative: true },
    { name: '사용료', price: 528000, grade: '30년(15년 1회 연장가능)', groupType: '관내 거주자', isRepresentative: false },

    // 관외 거주자
    { name: '사용료', price: 294000, grade: '30년(15년 1회 연장가능)', groupType: '관외 거주자', isRepresentative: false },
    { name: '사용료', price: 686000, grade: '30년(15년 1회 연장가능)', groupType: '관외 거주자', isRepresentative: false }
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
            console.log(`✅ park-0064: ${facility.name}`);
            console.log(`   단장형: ${rows단장형.length}개 행 (관내/관외)`);
            console.log(`   합장형: ${rows합장형.length}개 행 (관내/관외)`);
            console.log(`\n   재구성: 매장묘 → 단장형/합장형 분리`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

console.log('🔧 park-0064 카테고리 재분류 (단장형/합장형 + 관내/관외)...\n');
update().then(() => console.log('\n✨ Done!'));
