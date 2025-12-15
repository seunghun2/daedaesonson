const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/facilities.json');

console.log('=== 1~10번 시설 가격 범위 수정 ===\n');

const facilities = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

facilities.slice(0, 10).forEach((facility, idx) => {
    console.log(`${idx + 1}. ${facility.name}`);

    if (!facility.priceInfo || !facility.priceInfo.priceTable) {
        console.log('   ⚠️  가격표 없음\n');
        return;
    }

    const priceTable = facility.priceInfo.priceTable;

    // 기본비용 카테고리에서 사용료 찾기
    if (priceTable['기본비용'] && priceTable['기본비용'].rows) {
        const usageFee = priceTable['기본비용'].rows.find(r => r.name === '사용료' || r.name.includes('사용료'));

        if (usageFee && usageFee.price > 0) {
            const priceInManwon = Math.round(usageFee.price / 10000);
            facility.priceRange = {
                min: priceInManwon,
                max: priceInManwon
            };
            console.log(`   ✅ 가격: ${usageFee.price.toLocaleString()}원 → ${priceInManwon}만원\n`);
        } else {
            console.log('   ⚠️  사용료 찾을 수 없음\n');
        }
    } else {
        console.log('   ⚠️  기본비용 카테고리 없음\n');
    }
});

fs.writeFileSync(DATA_FILE, JSON.stringify(facilities, null, 2));

console.log('✅ 가격 범위 수정 완료!');
