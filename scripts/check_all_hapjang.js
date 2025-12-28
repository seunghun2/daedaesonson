const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));

let allEstimated = [];
let allRealHapjang = [];

facilities.forEach(f => {
    const 단장형 = f.priceInfo?.priceTable?.['단장형'];
    const 합장형 = f.priceInfo?.priceTable?.['합장형'];

    if (!합장형 || !합장형.rows || 합장형.rows.length === 0) return;

    // 추정값인지 확인
    let isEstimated = false;

    if (단장형 && 단장형.rows && 합장형.rows.length === 단장형.rows.length) {
        isEstimated = true;
        for (let i = 0; i < 합장형.rows.length; i++) {
            const 단Price = 단장형.rows[i]?.price || 0;
            const 합Price = 합장형.rows[i]?.price || 0;

            if (단Price > 0 && 합Price > 0) {
                const ratio = 합Price / 단Price;
                if (Math.abs(ratio - 1.5) > 0.01) {
                    isEstimated = false;
                    break;
                }
            }
        }
    }

    if (isEstimated) {
        allEstimated.push({
            id: f.id,
            name: f.name,
            단장: 단장형.rows[0]?.price || 0,
            합장: 합장형.rows[0]?.price || 0
        });
    } else {
        allRealHapjang.push({
            id: f.id,
            name: f.name,
            rowCount: 합장형.rows.length
        });
    }
});

console.log('🔍 전체 시설 합장형 데이터 검색 결과:\n');
console.log(`총 시설 수: ${facilities.length}개\n`);

console.log(`⚠️  추정값으로 생성된 합장형 (×1.5): ${allEstimated.length}개`);
console.log(`📊 실제 데이터 합장형: ${allRealHapjang.length}개\n`);

if (allEstimated.length > 0) {
    console.log('\n🚨 삭제 필요: 추정으로 만든 합장형 데이터:\n');
    allEstimated.forEach((f, idx) => {
        console.log(`${idx + 1}. ${f.id}: ${f.name}`);
        console.log(`   단장=${f.단장.toLocaleString()}원 → 합장=${f.합장.toLocaleString()}원\n`);
    });
} else {
    console.log('✅ 추정값으로 생성된 합장형 데이터 없음! 모두 정리되었습니다.\n');
}

if (allRealHapjang.length > 0) {
    console.log('\n📊 실제 데이터가 있는 합장형 (확인용):');
    allRealHapjang.slice(0, 10).forEach(f => {
        console.log(`   ${f.id}: ${f.name} (${f.rowCount}개 항목)`);
    });
    if (allRealHapjang.length > 10) {
        console.log(`   ... 외 ${allRealHapjang.length - 10}개 더`);
    }
}
