const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const facility = facilities.find(f => f.id === 'park-1340');

if (!facility) {
    console.log('❌ park-1340 not found');
    process.exit(1);
}

// Item 906 데이터 입력 (이미지 기준)
const rows봉분 = [
    { name: '공설묘지 사용료', price: 200000, grade: '15년 3회', isRepresentative: true }
];

const rows평장 = [
    { name: '공설묘지 사용료', price: 100000, grade: '15년 3회', isRepresentative: true }
];

const payload = {
    id: facility.id,
    name: facility.name,
    address: facility.address,
    category: facility.category,
    coordinates: facility.coordinates,
    priceInfo: {
        priceTable: {
            봉분: { unit: '원', rows: rows봉분 },
            평장: { unit: '원', rows: rows평장 }
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
            console.log(`✅ park-1340: ${facility.name} (Item 906)`);
            console.log(`   봉분: ${rows봉분.length}개 행`);
            console.log(`   평장: ${rows평장.length}개 행`);
            console.log(`   총 ${rows봉분.length + rows평장.length}개 행`);
            console.log(`   이용자격: 제주도민`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

console.log('🚀 Item 906 (park-1340: 동부공설묘지) 데이터 입력...\n');
update().then(() => console.log('\n✨ Done!'));
