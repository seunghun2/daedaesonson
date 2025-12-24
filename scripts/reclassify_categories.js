const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('./data/facilities.json', 'utf-8'));

// 상품명 기반 카테고리 결정 규칙 (더 구체적인 것이 먼저!)
const CATEGORY_RULES = [
    // 단장형/합장형 (먼저 체크!)
    { target: '단장형', regex: /단장묘|단장\s*묘/ },
    { target: '합장형', regex: /합장묘|합장\s*묘/ },

    // 평장 관련 → 평장묘
    { target: '평장묘', regex: /평장|평분/ },

    // 매장묘 관련 → 매장묘 (단장묘/합장묘 제외)
    { target: '매장묘', regex: /매장묘|매장\s*묘|개인묘|부부묘|가족.*매장|가족형\s*매장/ },

    // 봉안담 → 봉안담 (봉안당보다 먼저!)
    { target: '봉안담', regex: /봉안담/ },

    // 봉안묘 → 봉안묘
    { target: '봉안묘', regex: /봉안묘|납골묘/ },

    // 봉안당 → 봉안당
    { target: '봉안당', regex: /봉안당|[1-8]단|층/ },

    // 수목장 → 수목장
    { target: '수목장', regex: /수목|자연장|나무|목련|백합|동백|무궁화/ },
];

let movedCount = 0;
let stats = {};

facilities.forEach(f => {
    if (!f.priceInfo?.priceTable) return;

    const oldPriceTable = f.priceInfo.priceTable;
    const newPriceTable = {};

    Object.entries(oldPriceTable).forEach(([catName, catData]) => {
        const rows = catData.rows || [];

        // 제외됨/기타/옵션은 그대로
        if (['제외됨', '기타', '옵션', '관리비', 'ETC', '화장시설'].includes(catName)) {
            newPriceTable[catName] = catData;
            return;
        }

        // 각 row를 분석해서 적절한 카테고리로 분류
        rows.forEach(row => {
            const text = `${row.name || ''} ${row.grade || ''}`;

            let targetCat = catName; // 기본값: 현재 카테고리

            // 규칙에 따라 분류
            for (const rule of CATEGORY_RULES) {
                if (rule.regex.test(text)) {
                    targetCat = rule.target;
                    break;
                }
            }

            // 새 카테고리에 추가
            if (!newPriceTable[targetCat]) {
                newPriceTable[targetCat] = { rows: [], unit: catData.unit || '원' };
            }
            newPriceTable[targetCat].rows.push(row);

            // 통계
            if (!stats[targetCat]) stats[targetCat] = 0;
            stats[targetCat]++;

            if (catName !== targetCat) {
                movedCount++;
                console.log(`  ${f.name}: "${row.name}" (${catName} → ${targetCat})`);
            }
        });
    });

    f.priceInfo.priceTable = newPriceTable;
});

// 저장
fs.writeFileSync('./data/facilities.json', JSON.stringify(facilities, null, 2));

console.log('\n✅ 상품명 기반 재분류 완료!');
console.log(`📊 ${movedCount}개 항목 재분류됨\n`);

console.log('📁 카테고리별 분류 결과:');
Object.entries(stats).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
    console.log(`   ${cat}: ${count}개`);
});
