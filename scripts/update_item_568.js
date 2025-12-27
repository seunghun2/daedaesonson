const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const facility = facilities.find(f => f.id === 'park-0635');

if (!facility) {
    console.log('❌ park-0635 not found');
    process.exit(1);
}

const payload = {
    id: facility.id,
    name: facility.name,
    address: facility.address,
    category: facility.category,
    coordinates: facility.coordinates,
    priceInfo: {
        priceTable: {
            봉안당: {
                unit: '원',
                rows: [
                    { name: '1단', price: 1500000, grade: '', isRepresentative: true },
                    { name: '2단', price: 2000000, grade: '', isRepresentative: false },
                    { name: '3단', price: 2500000, grade: '', isRepresentative: false },
                    { name: '4단', price: 3000000, grade: '', isRepresentative: false },
                    { name: '5단', price: 3500000, grade: '', isRepresentative: false },
                    { name: '6단', price: 3000000, grade: '', isRepresentative: false },
                    { name: '7단', price: 2000000, grade: '', isRepresentative: false },
                    { name: '8단', price: 1500000, grade: '', isRepresentative: false },
                    { name: '9단', price: 1000000, grade: '', isRepresentative: false }
                ]
            }
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
            console.log(`✅ Item 568 (park-0635): ${facility.name} - 9개 행 업데이트 완료`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

console.log('🚀 Updating Item 568...\n');
console.log('⏭️  Item 569: 청량교회 청량동산 - SKIP (가격 없음)');
console.log('⏭️  Item 570: 백련사 - SKIP (가격 없음)\n');
update().then(() => console.log('\n✨ Done!'));
