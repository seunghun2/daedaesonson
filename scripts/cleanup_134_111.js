const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const facility134 = facilities.find(f => f.id === 'park-0134');
const facility111 = facilities.find(f => f.id === 'park-0111');

if (!facility134 || !facility111) {
    console.log('❌ 시설을 찾을 수 없습니다');
    process.exit(1);
}

// 두 시설 모두 매장묘와 단장형이 중복되어 있음 - 단장형/합장형으로 정리
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
                    { name: '공설묘지 사용료', price: 50000, grade: '', isRepresentative: true },
                    { name: '공설묘지 관리비', price: 50000, grade: '', isRepresentative: false }
                ]
            },
            합장형: {
                unit: '원',
                rows: [
                    { name: '공설묘지 사용료', price: 75000, grade: '', isRepresentative: true },
                    { name: '공설묘지 관리비', price: 75000, grade: '', isRepresentative: false }
                ]
            }
        }
    }
});

async function updateBoth() {
    const facilities = [
        { id: 'park-0134', facility: facility134 },
        { id: 'park-0111', facility: facility111 }
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
                console.log(`   재구성: 매장묘,단장형 중복 → 단장형/합장형 분리\n`);
            }
        } catch (error) {
            console.log(`❌ ${id} Error: ${error.message}`);
        }
    }
}

console.log('🔧 park-0134, park-0111 카테고리 정리...\n');
updateBoth().then(() => console.log('✨ Done!'));
