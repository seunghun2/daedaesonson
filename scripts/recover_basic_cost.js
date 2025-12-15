const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/facilities.json');

console.log('=== 기본비용 긴급 복구 ===\n');

const facilities = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

// 각 시설의 모든 카테고리를 순회하며 기본비용 항목 찾기
for (let i = 0; i < 10; i++) {
    const facility = facilities[i];
    const priceTable = facility.priceInfo?.priceTable || {};

    console.log(`${i + 1}. ${facility.name}`);

    // 기본비용 카테고리 생성
    if (!priceTable['기본비용']) {
        priceTable['기본비용'] = {
            unit: '원',
            category: 'base_cost',
            rows: []
        };
    }

    // 모든 카테고리에서 사용료/관리비 찾기
    let foundBasic = [];

    Object.keys(priceTable).forEach(cat => {
        if (cat === '기본비용') return;

        const rows = priceTable[cat].rows || [];
        const basicItems = [];
        const remainingItems = [];

        rows.forEach(item => {
            const name = item.name.trim();

            // 사용료/관리비 체크 (시설 타입 없는 것만)
            const isBasic = (
                (/^묘지사용료|^사용료|^시설사용료/.test(name) &&
                    !name.includes('매장') && !name.includes('봉안')) ||
                (/^관리비|^묘지관리비/.test(name) &&
                    !name.includes('봉안당') && !name.includes('가족'))
            );

            if (isBasic) {
                basicItems.push(item);
                foundBasic.push({ from: cat, item: name });
            } else {
                remainingItems.push(item);
            }
        });

        // 기본비용으로 이동
        if (basicItems.length > 0) {
            priceTable['기본비용'].rows.push(...basicItems);
            priceTable[cat].rows = remainingItems;
        }

        // 빈 카테고리 제거
        if (priceTable[cat].rows.length === 0) {
            delete priceTable[cat];
        }
    });

    if (foundBasic.length > 0) {
        console.log('  기본비용으로 이동:');
        foundBasic.forEach(f => {
            console.log(`    ${f.from} → ${f.item}`);
        });
    } else {
        console.log('  ⚠️  기본비용 없음');
    }

    console.log('');
}

// 저장
fs.writeFileSync(DATA_FILE, JSON.stringify(facilities, null, 2));

console.log('✅ 기본비용 복구 완료!');
console.log('브라우저 새로고침 하세요!');
