const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const facility = facilities.find(f => f.id === 'park-0139');

if (!facility) {
    console.log('❌ park-0139 not found');
    process.exit(1);
}

// Item 798 데이터 입력
const rows매장묘 = [
    { name: '장례비', price: 1050000, grade: '신장,합장', isRepresentative: true },
    { name: '신장 관리비(일시납)', price: 1500000, grade: '신장(단장,합예)', isRepresentative: false },
    { name: '합장 관리비(일시납)', price: 750000, grade: '기존묘에 합장시', isRepresentative: false },
    { name: '년 관리비', price: 50000, grade: '묘지당', isRepresentative: false }
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
            console.log(`✅ park-0139: ${facility.name} (Item 798)`);
            console.log(`   매장묘: ${rows매장묘.length}개 행`);
            console.log(`   총 ${rows매장묘.length}개 행`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

console.log('🚀 Item 798 (park-0139: 영락교회공원묘원) 데이터 입력...\n');
update().then(() => console.log('\n✨ Done!'));
