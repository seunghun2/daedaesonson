const fs = require('fs');

// 오늘 수정한 시설 목록 (bb5b3fe 커밋)
const facilityIds = [
    'park-0172', 'park-0176', 'park-0186', 'park-0199',
    'park-0217', 'park-0219', 'park-0255', 'park-0263',
    'park-0274', 'park-0275', 'park-0277', 'park-0278',
    'park-0282', 'park-0303', 'park-0337', 'park-0344',
    'park-0372', 'park-0384', 'park-0422'
];

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));

async function fixFacility(facilityId) {
    const facility = facilities.find(f => f.id === facilityId);

    if (!facility) {
        console.log(`❌ ${facilityId}: NOT FOUND`);
        return;
    }

    const 단장형 = facility.priceInfo?.priceTable?.['단장형'];
    const 합장형 = facility.priceInfo?.priceTable?.['합장형'];

    if (!단장형 || !합장형) {
        console.log(`⚠️  ${facilityId}: ${facility.name} - 단장형/합장형 없음, 스킵`);
        return;
    }

    // 합장형이 단장형×1.5인지 확인
    const isEstimated = 합장형.rows.every((row, i) => {
        if (!단장형.rows[i]) return false;
        const ratio = row.price / 단장형.rows[i].price;
        return Math.abs(ratio - 1.5) < 0.01;
    });

    if (!isEstimated) {
        console.log(`⚠️  ${facilityId}: ${facility.name} - 합장형이 추정값 아님, 스킵`);
        return;
    }

    // 매장묘로 통합
    const payload = {
        id: facility.id,
        name: facility.name,
        address: facility.address,
        category: facility.category,
        coordinates: facility.coordinates,
        priceInfo: {
            priceTable: {
                매장묘: { unit: '원', rows: 단장형.rows }
            }
        }
    };

    try {
        const response = await fetch('http://localhost:3000/api/facilities', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.error) {
            console.log(`❌ ${facilityId}: ${facility.name} - 업데이트 실패: ${result.error}`);
        } else {
            console.log(`✅ ${facilityId}: ${facility.name} - 합장형 삭제, 매장묘로 통합`);
        }
    } catch (error) {
        console.log(`❌ ${facilityId}: ${facility.name} - Error: ${error.message}`);
    }
}

async function fixAll() {
    console.log('🔧 오늘 추가한 잘못된 합장형 데이터 수정 시작...\n');
    console.log(`총 ${facilityIds.length}개 시설 확인\n`);

    for (const id of facilityIds) {
        await fixFacility(id);
    }

    console.log('\n✨ 완료!');
}

fixAll();
