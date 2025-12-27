const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const facility = facilities.find(f => f.id === 'park-0002');

if (!facility) {
    console.log('❌ park-0002 not found');
    process.exit(1);
}

// 기존 데이터 가져오기
const existingPriceTable = facility.priceInfo?.priceTable || {};

// 새 CSV 데이터
const newRows = [
    { name: '묘지사용료', price: 1396000, grade: '1평', isRepresentative: false },
    { name: '관리비', price: 16000, grade: '1평/1년', isRepresentative: false }
];

// 기존 매장묘 데이터 유지하면서 새 데이터 추가
const 매장묘Rows = existingPriceTable.매장묘?.rows || [];
const combined매장묘Rows = [...매장묘Rows, ...newRows];

// 전체 priceTable 재구성 (기존 데이터 모두 유지)
const updatedPriceTable = {
    ...existingPriceTable,
    매장묘: {
        unit: '원',
        rows: combined매장묘Rows
    }
};

const payload = {
    id: facility.id,
    name: facility.name,
    address: facility.address,
    category: facility.category,
    coordinates: facility.coordinates,
    priceInfo: {
        priceTable: updatedPriceTable
    }
};

async function update() {
    try {
        console.log('기존 매장묘 데이터:', 매장묘Rows.length + '개 행');
        console.log('새 데이터:', newRows.length + '개 행');
        console.log('합계:', combined매장묘Rows.length + '개 행\n');

        const response = await fetch('http://localhost:3000/api/facilities', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.error) {
            console.log(`❌ 업데이트 실패: ${result.error}`);
        } else {
            console.log(`✅ Item 654 (park-0002): ${facility.name}`);
            console.log('   기존 데이터 유지 + 새 데이터 2개 행 추가 완료');
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

console.log('🚀 Updating Item 654 (기존 데이터 유지)...\n');
update().then(() => console.log('\n✨ Done!'));
