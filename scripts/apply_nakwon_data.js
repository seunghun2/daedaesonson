const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/facilities.json');
const NAKWON_DATA = path.join(__dirname, '../nakwon_easy.json');

console.log('=== 낙원추모공원 가격표 적용 ===\n');

const facilities = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
const nakwonPrices = JSON.parse(fs.readFileSync(NAKWON_DATA, 'utf-8'));

// No.1 낙원추모공원 찾기
const nakwon = facilities[0];

if (nakwon.name.includes('낙원')) {
    nakwon.priceInfo = {
        priceTable: nakwonPrices
    };

    // 가격 범위 설정
    const basicCost = nakwonPrices['기본비용'];
    if (basicCost && basicCost.rows) {
        const usageFee = basicCost.rows.find(r => r.name === '사용료');
        if (usageFee) {
            nakwon.priceRange = {
                min: Math.round(usageFee.price / 10000),
                max: Math.round(usageFee.price / 10000)
            };
        }
    }

    console.log(`✅ ${nakwon.name}`);
    console.log(`   카테고리: ${Object.keys(nakwonPrices).length}개`);
    console.log(`   가격: ${nakwon.priceRange.min}만원`);

    // 저장
    fs.writeFileSync(DATA_FILE, JSON.stringify(facilities, null, 2));

    console.log('\n✅ 저장 완료!');
} else {
    console.log('❌ No.1이 낙원추모공원이 아닙니다:', nakwon.name);
}
