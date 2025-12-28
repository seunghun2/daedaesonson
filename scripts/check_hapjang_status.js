const fs = require('fs');

// bb5b3fe 커밋에서 작업한 시설들
const facilityIds = [
    'park-0172', 'park-0176', 'park-0186', 'park-0199',
    'park-0217', 'park-0219', 'park-0255', 'park-0263',
    'park-0274', 'park-0275', 'park-0277', 'park-0278',
    'park-0282', 'park-0303', 'park-0337', 'park-0344',
    'park-0372', 'park-0384', 'park-0422'
];

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));

console.log('🔍 합장형 상태 확인 (최근 작업 시설):\n');
console.log(`총 ${facilityIds.length}개 시설 확인\n`);

let withHapjang = [];
let withoutHapjang = [];
let estimatedHapjang = [];

facilityIds.forEach(id => {
    const facility = facilities.find(f => f.id === id);

    if (!facility) {
        console.log(`❌ ${id}: NOT FOUND`);
        return;
    }

    const 단장형 = facility.priceInfo?.priceTable?.['단장형'];
    const 합장형 = facility.priceInfo?.priceTable?.['합장형'];
    const 매장묘 = facility.priceInfo?.priceTable?.['매장묘'];

    if (합장형 && 합장형.rows && 합장형.rows.length > 0) {
        // 합장형이 추정값인지 확인
        let isEstimated = false;

        if (단장형 && 단장형.rows && 합장형.rows.length === 단장형.rows.length) {
            isEstimated = 합장형.rows.every((row, i) => {
                if (!단장형.rows[i]) return false;
                const ratio = row.price / 단장형.rows[i].price;
                return Math.abs(ratio - 1.5) < 0.01;
            });
        }

        if (isEstimated) {
            estimatedHapjang.push({
                id,
                name: facility.name,
                단장: 단장형.rows[0]?.price || 0,
                합장: 합장형.rows[0]?.price || 0
            });
        } else {
            withHapjang.push({
                id,
                name: facility.name,
                type: '실제 데이터'
            });
        }
    } else {
        withoutHapjang.push({
            id,
            name: facility.name,
            hasMatjang: !!매장묘
        });
    }
});

console.log('📋 결과 요약:\n');
console.log(`✅ 합장형 없음: ${withoutHapjang.length}개`);
console.log(`⚠️  합장형 있음 (추정값×1.5): ${estimatedHapjang.length}개`);
console.log(`📊 합장형 있음 (실제 데이터): ${withHapjang.length}개\n`);

if (estimatedHapjang.length > 0) {
    console.log('\n⚠️  삭제 필요: 추정으로 만든 합장형 데이터:');
    estimatedHapjang.forEach(f => {
        console.log(`   ${f.id}: ${f.name} - 단장=${f.단장.toLocaleString()}원 → 합장=${f.합장.toLocaleString()}원`);
    });
}

if (withoutHapjang.length > 0) {
    console.log('\n✅ 합장형 없음 (정상):');
    withoutHapjang.forEach(f => {
        const status = f.hasMatjang ? '(매장묘 있음)' : '';
        console.log(`   ${f.id}: ${f.name} ${status}`);
    });
}

if (withHapjang.length > 0) {
    console.log('\n📊 합장형 있음 (실제 데이터, 확인 필요):');
    withHapjang.forEach(f => {
        console.log(`   ${f.id}: ${f.name}`);
    });
}
