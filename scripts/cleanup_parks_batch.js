const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));

// 세 개 시설 찾기
const facility142 = facilities.find(f => f.id === 'park-0142');
const facility103 = facilities.find(f => f.id === 'park-0103');
const facility112 = facilities.find(f => f.id === 'park-0112');

if (!facility142 || !facility103 || !facility112) {
    console.log('❌ 일부 시설을 찾을 수 없습니다');
    process.exit(1);
}

// 공통 패턴: 단장형/합장형으로 재분류 (사용료 60,000/90,000, 관리비 30,000/45,000)
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
                    { name: '공설묘지 사용료', price: 60000, grade: '', isRepresentative: true },
                    { name: '공설묘지 관리비', price: 30000, grade: '', isRepresentative: false }
                ]
            },
            합장형: {
                unit: '원',
                rows: [
                    { name: '공설묘지 사용료', price: 90000, grade: '', isRepresentative: true },
                    { name: '공설묘지 관리비', price: 45000, grade: '', isRepresentative: false }
                ]
            }
        }
    }
});

async function updateAll() {
    const facilities = [
        { id: 'park-0142', facility: facility142 },
        { id: 'park-0103', facility: facility103 },
        { id: 'park-0112', facility: facility112 }
    ];

    for (const { id, facility } of facilities) {
        try {
            const response = await fetch('http://localhost:3000/api/facilities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(createPayload(facility))
            });

            const result = await response.json();

            if (result.error) {
                console.log(`❌ ${id}: ${result.error}`);
            } else {
                console.log(`✅ ${id}: ${facility.name}`);
                console.log(`   단장형: 2개 행`);
                console.log(`   합장형: 2개 행`);
                console.log(`   재구성: 매장묘 → 단장형/합장형 분리\n`);
            }
        } catch (error) {
            console.log(`❌ ${id} Error: ${error.message}`);
        }
    }
}

console.log('🔧 3개 시설 카테고리 일괄 재분류...\n');
updateAll().then(() => console.log('✨ Done!'));
