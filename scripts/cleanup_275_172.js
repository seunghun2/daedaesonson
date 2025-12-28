const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const facility275 = facilities.find(f => f.id === 'park-0275');
const facility172 = facilities.find(f => f.id === 'park-0172');

if (!facility275 || !facility172) {
    console.log('❌ 시설을 찾을 수 없습니다');
    process.exit(1);
}

// 공통 패턴으로 정리
const createPayload = (facility, usage, management) => ({
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
                    { name: '묘지 사용료', price: usage, grade: '', isRepresentative: true },
                    { name: '묘지 관리비', price: management, grade: '', isRepresentative: false }
                ]
            },
            합장형: {
                unit: '원',
                rows: [
                    { name: '묘지 사용료', price: Math.round(usage * 1.5), grade: '', isRepresentative: true },
                    { name: '묘지 관리비', price: Math.round(management * 1.5), grade: '', isRepresentative: false }
                ]
            }
        }
    }
});

async function updateBoth() {
    // park-0275 (사용료 120,000 / 관리비 80,000 예상)
    const payload275 = createPayload(facility275, 120000, 80000);

    // park-0172 (사용료 120,000 / 관리비 80,000 예상) 
    const payload172 = createPayload(facility172, 120000, 80000);

    for (const payload of [payload275, payload172]) {
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
                console.log(`   단장형: 2개 행`);
                console.log(`   합장형: 2개 행`);
                console.log(`   재구성: 매장묘,단장형 → 단장형/합장형 분리\n`);
            }
        } catch (error) {
            console.log(`❌ ${payload.id} Error: ${error.message}`);
        }
    }
}

console.log('🔧 park-0275, park-0172 카테고리 정리...\n');
updateBoth().then(() => console.log('✨ Done!'));
