const fs = require('fs');
const path = require('path');

const PRICING_DB_PATH = path.join(__dirname, '../data/pricing_db.json');
const FACILITIES_PATH = path.join(__dirname, '../data/facilities.json');

function mapCategoryToKorean(engCategory) {
    if (!engCategory) return '기타';

    // 복합 카테고리일 수 있으므로 문자열 검사
    const u = engCategory.toUpperCase();

    // 우선순위 매핑
    if (u === 'CHARNEL_HOUSE') return '봉안당';
    if (u === 'FAMILY_GRAVE') return '공원묘지';
    if (u === 'NATURAL_BURIAL') return '수목장';
    if (u === 'CREMATORIUM') return '화장시설';

    return engCategory;
}

function updateCategory1() {
    console.log('🔄 Loading data...');
    const pricingData = JSON.parse(fs.readFileSync(PRICING_DB_PATH, 'utf-8'));
    const facilitiesData = JSON.parse(fs.readFileSync(FACILITIES_PATH, 'utf-8'));

    // Create a map: parkId -> koreanCategory
    const typeMap = {};
    facilitiesData.forEach(fac => {
        typeMap[fac.id] = mapCategoryToKorean(fac.category);
    });

    console.log(`✅ Loaded map for ${Object.keys(typeMap).length} facilities.`);

    let updateCount = 0;
    const newPricingData = pricingData.map(item => {
        // 기존 category는 category1에만 적용 (category2는 보존)
        // 사용자가 "분류 1에서 ... 3개"라고 했으므로 category1만 덮어씀.

        const newCat = typeMap[item.parkId];

        // 만약 newCat이 있으면 업데이트
        if (newCat) {
            // 중복 처리? 현재 데이터 구조상 facilities.json의 category는 단일값임.
            // 하지만 만약 나중에 복합이 된다면 여기서 처리. 지금은 1:1 매핑.
            if (item.category1 !== newCat) {
                updateCount++;
                return { ...item, category1: newCat };
            }
        }
        return item;
    });

    console.log(`💾 Updating ${updateCount} items...`);
    fs.writeFileSync(PRICING_DB_PATH, JSON.stringify(newPricingData, null, 2));
    console.log('🎉 Done! category1 updated.');
}

updateCategory1();
