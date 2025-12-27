const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const facility = facilities.find(f => f.name && f.name.includes('청양') && f.name.includes('추모'));

if (!facility) {
    console.log('❌ 청양군 추모공원 not found');
    process.exit(1);
}

// 이미지 기준으로 단장형/합장형 입력
const rows단장형 = [
    { name: '공설묘지 사용료', price: 700000, grade: '30년 이용 1회연장 가능', isRepresentative: true },
    { name: '공설묘지 관리비', price: 800000, grade: '30년 이용 1회연장 가능', isRepresentative: false }
];

const rows합장형 = [
    { name: '공설묘지 사용료', price: 1050000, grade: '30년 이용 1회연장 가능', isRepresentative: true },
    { name: '공설묘지 관리비', price: 1200000, grade: '30년 이용 1회연장 가능', isRepresentative: false }
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
            console.log(`✅ ${facility.id}: ${facility.name}`);
            console.log(`   단장형: ${rows단장형.length}개 행`);
            console.log(`   합장형: ${rows합장형.length}개 행`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

console.log('🚀 청양군 추모공원 데이터 입력 (이미지 기준)...\n');
update().then(() => console.log('\n✨ Done!'));
