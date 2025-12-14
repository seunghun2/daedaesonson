const fs = require('fs');
const path = require('path');

const PRICING_DB_PATH = path.join(__dirname, '../data/pricing_db.json');

function setRepresentativeItems() {
    console.log('🔄 Loading pricing data...');
    const pricingData = JSON.parse(fs.readFileSync(PRICING_DB_PATH, 'utf-8'));

    // parkId 별로 그룹화
    const parkItems = {};
    pricingData.forEach(item => {
        if (!parkItems[item.parkId]) parkItems[item.parkId] = [];
        parkItems[item.parkId].push(item);
    });

    let markCount = 0;

    // 제외할 키워드 (부대비용 등)
    const excludeKeywords = ['관리비', '석물', '작업', '식당', '각자', '화장', '안치', '모시는', '제거', '식재', '수선', '철거', '운구', '임시', '사용료', '비석', '상석'];
    // 사용료는 애매하지만 "묘지사용료"는 본 상품일 수 있음. 하지만 보통 "분양가"가 아니라 "사용료+관리비" 구조면 사용료가 본체.
    // 일단 제외 키워드를 보수적으로 잡음.

    // 다시 정제: 관리비, 작업비, 식당, 석물비 만 확실히 제외.
    const strictExcludes = ['관리비', '작업', '식당', '석물', '각자', '철거', '수선', '제거', '봉분', '상석', '비석', '둘레석', '테두리', '평장'];
    // 평장은 상품명일 수 있는데? -> "평장상석" 이런건 제외, "평장묘"는 포함.
    // 키워드 필터링은 복잡하므로, category2를 우선 봄.

    const excludeCategories = ['관리비', '석물비', '작업비', '부대비용', '용품', '식대', '장례용품'];

    Object.keys(parkItems).forEach(parkId => {
        const items = parkItems[parkId];

        // 1. 필터링: 제외 카테고리나 키워드가 아닌 것들
        const candidates = items.filter(item => {
            const cat = (item.category2 || '').trim();
            const name = (item.itemName || '').trim();
            const text = (cat + ' ' + name);

            // 카테고리 제외
            if (excludeCategories.some(ex => cat.includes(ex))) return false;

            // 이름 제외 (너무 부수적인 것들)
            if (name.includes('관리비') || name.includes('석물') || name.includes('작업비') || name.includes('식당')) return false;

            // 가격이 있어야 함 (숫자로 변환 가능하고 0보다 큰 것)
            const priceNum = parseInt((item.price || '0').replace(/[^0-9]/g, ''));
            if (isNaN(priceNum) || priceNum <= 0) return false;

            return true;
        });

        // 2. 선정: 가격 오름차순 정렬 후 첫 번째 (최저가)
        if (candidates.length > 0) {
            candidates.sort((a, b) => {
                const pA = parseInt((a.price || '0').replace(/[^0-9]/g, ''));
                const pB = parseInt((b.price || '0').replace(/[^0-9]/g, ''));
                return pA - pB;
            });

            const bestItem = candidates[0];
            bestItem.isRepresentative = true;
            markCount++;
        }
    });

    // 전체 리스트에 반영 (객체 참조로 인해 items 수정이 pricingData에 반영됨을 기대하지만,
    // forEach에서 pricingData 원소를 직접 수정하지 않고 parkItems 배열을 따로 만들었음.
    // 하지만 item 객체 자체는 참조를 공유하므로 OK.)

    // 명시적으로 isRepresentative 없는 애들은 false 처리? (필수는 아니지만 깔끔하게)
    const finalData = pricingData.map(item => ({
        ...item,
        isRepresentative: !!item.isRepresentative
    }));

    console.log(`💾 Updating DB with ${markCount} representative items...`);
    fs.writeFileSync(PRICING_DB_PATH, JSON.stringify(finalData, null, 2));
    console.log('🎉 Done!');
}

setRepresentativeItems();
