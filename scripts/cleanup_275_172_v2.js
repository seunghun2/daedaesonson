const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const facility275 = facilities.find(f => f.id === 'park-0275');
const facility172 = facilities.find(f => f.id === 'park-0172');

if (!facility275 || !facility172) {
    console.log('❌ 시설을 찾을 수 없습니다');
    process.exit(1);
}

// 정확한 데이터로 정리 (사용료 90,000 / 관리비 30,000)
const createPayload = (facility) => ({
    id: facility.id,
    name: facility.name,
    address: facility.address,
    category: facility.category,
    coordinates: facility.coordinates,
    priceInfo: {
        priceTable: {
            단장형: {
                unit: '원',
                rows: [
                    { name: '묘지 사용료', price: 90000, grade: '', isRepresentative: true },
                    { name: '묘지 관리비', price: 30000, grade: '', isRepresentative: false }
                ]
            },
            합장형: {
                unit: '원',
                rows: [
                    { name: '묘지 사용료', price: 135000, grade: '', isRepresentative: true },
                    { name: '묘지 관리비', price: 45000, grade: '', isRepresentative: false }
                ]
            }
        }
    }
});

async function updateBoth() {
    for (const facility of [facility275, facility172]) {
        const payload = createPayload(facility);

        try {
            const response = await fetch('http://localhost:3000/api/facilities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (result.error) {
                console.log(`❌ ${payload.id}: ${result.error}`);
            } else {
                console.log(`✅ ${payload.id}: ${payload.name}`);
                console.log(`   단장형: 2개 행 (사용료 90,000원 / 관리비 30,000원)`);
                console.log(`   합장형: 2개 행 (사용료 135,000원 / 관리비 45,000원)\n`);
            }
        } catch (error) {
            console.log(`❌ ${payload.id} Error: ${error.message}`);
        }
    }
}

console.log('🔧 park-0275, park-0172 정확한 데이터로 정리...\n');
updateBoth().then(() => console.log('✨ Done!'));
