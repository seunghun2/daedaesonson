const fs = require('fs');
const path = require('path');

const PRICING_DB_PATH = path.join(__dirname, '../data/pricing_db.json');

function updateComplexCategories() {
    console.log('🔄 Loading pricing data...');
    const pricingData = JSON.parse(fs.readFileSync(PRICING_DB_PATH, 'utf-8'));

    // 1. ParkID별로 어떤 상품들을 가지고 있는지 먼저 수집 (분석 단계)
    const parkTypes = {}; // parkId -> Set(['공원묘지', '봉안당', '수목장'])

    pricingData.forEach(item => {
        const pid = item.parkId;
        if (!parkTypes[pid]) parkTypes[pid] = new Set();

        // 키워드 분석 (category2 + itemName)
        const text = ((item.category2 || '') + ' ' + (item.itemName || '')).toLowerCase();

        // 1) 공원묘지 키워드
        if (text.includes('매장') || text.includes('석물') || text.includes('봉분') || text.includes('묘지') || text.includes('가족묘')) {
            parkTypes[pid].add('공원묘지');
        }
        // 2) 봉안당 키워드
        // "1단", "2단"... 패턴 매칭
        if (text.match(/\d+단/) || text.includes('봉안') || text.includes('납골') || text.includes('안치단') || (text.includes('부부단') && !text.includes('묘'))) {
            parkTypes[pid].add('봉안당');
        }
        // 3) 수목장 키워드
        if (text.includes('수목') || text.includes('자연장') || text.includes('잔디') || text.includes('화초') || text.includes('평장')) {
            // 평장은 애매하지만 요즘 자연장 맥락이 많음. 일단 포함.
            parkTypes[pid].add('수목장');
        }

        // 기존 category1이 이미 유의미한 값(E-Sky 분류)이라면 그것도 포함
        if (item.category1 && ['공원묘지', '봉안당', '수목장', '화장시설'].includes(item.category1)) {
            parkTypes[pid].add(item.category1);
        }
    });

    // 2. 수집된 정보를 바탕으로 category1 업데이트
    // 우선순위: 수목장 > 봉안당 > 공원묘지 순서? 아니면 가나다?
    // 보통 "공원묘지, 봉안당" 순이 자연스러움.

    const sortOrder = { '공원묘지': 1, '봉안당': 2, '수목장': 3, '화장시설': 4 };

    let updateCount = 0;
    const newPricingData = pricingData.map(item => {
        const typesSet = parkTypes[item.parkId];

        // 만약 키워드 분석으로 아무것도 안 나왔다면? 기존 category1 유지
        if (!typesSet || typesSet.size === 0) return item;

        // Set을 배열로 변환 후 정렬
        const sortedTypes = Array.from(typesSet).sort((a, b) => (sortOrder[a] || 99) - (sortOrder[b] || 99));

        // 콤마로 연결
        const combinedCategory = sortedTypes.join(', ');

        if (item.category1 !== combinedCategory) {
            updateCount++;
            return {
                ...item,
                category1: combinedCategory
            };
        }
        return item;
    });

    console.log(`💾 Updating ${updateCount} items to have combined categories...`);
    fs.writeFileSync(PRICING_DB_PATH, JSON.stringify(newPricingData, null, 2));
    console.log('🎉 Done! category1 reflects mixed facility types.');
}

updateComplexCategories();
