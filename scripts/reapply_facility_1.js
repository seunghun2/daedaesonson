const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/facilities.json');
const NAKWON_FILE = path.join(__dirname, '../nakwon_full_prices.json');

console.log('=== 1번 낙원추모공원 재적용 ===\n');

const facilities = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
const nakwonData = JSON.parse(fs.readFileSync(NAKWON_FILE, 'utf-8'));

// 1번 시설 (index 0)
const facility = facilities[0];

console.log(`적용 대상: ${facility.name}`);

// nakwon_full_prices.json에서 가격표 재생성
const categorized = {
    '기본비용': { unit: '원', category: 'base_cost', rows: [] },
    '매장묘': { unit: '원', category: 'grave', rows: [] },
    '봉안묘': { unit: '원', category: 'charnel_grave', rows: [] },
    '봉안당': { unit: '원', category: 'charnel_house', rows: [] },
    '수목장': { unit: '원', category: 'natural', rows: [] },
    '석물/비석': { unit: '원', category: 'other', rows: [] },
    '작업비': { unit: '원', category: 'other', rows: [] },
    '부속품': { unit: '원', category: 'other', rows: [] },
    '서비스': { unit: '원', category: 'other', rows: [] }
};

// 항목 분류
nakwonData.items.forEach(item => {
    const name = item.name || '';
    const detail = item.detail || '';
    const combined = (name + ' ' + detail).toLowerCase();

    let category = '서비스';

    // 기본비용
    if (name === '사용료' || name === '관리비' || name.includes('조경')) {
        category = '기본비용';
    }
    // 매장묘
    else if (name.includes('매장묘') || (name.includes('봉분') && !name.includes('평장'))) {
        category = '매장묘';
    }
    // 봉안묘 (평장)
    else if (name.includes('평장') || name.includes('청여') || name.includes('담장형') || name.includes('정원형')) {
        category = '봉안묘';
    }
    // 봉안당
    else if (name.includes('봉안당') || name.includes('플라타너스') || name.includes('다알리아') || name.includes('클로버') || name.includes('아이리스')) {
        category = '봉안당';
    }
    // 수목장
    else if (name.includes('수목')) {
        category = '수목장';
    }
    // 석물/비석
    else if (name.includes('상석') || name.includes('비석') || name.includes('와비') || name.includes('둘레석') || name.includes('경계석') || name.includes('월석') || name.includes('화병') || name.includes('향로') || name.includes('석등')) {
        category = '석물/비석';
    }
    // 작업비
    else if (name.includes('작업비') || name.includes('설치비') || name.includes('개장')) {
        category = '작업비';
    }
    // 부속품
    else if (name.includes('유골함') || name.includes('메탈') || name.includes('각자') || name.includes('천막')) {
        category = '부속품';
    }

    categorized[category].rows.push({
        name: item.name,
        price: item.price,
        grade: item.detail || ''
    });
});

// 빈 카테고리 제거
Object.keys(categorized).forEach(cat => {
    if (categorized[cat].rows.length === 0) {
        delete categorized[cat];
    }
});

// 적용
facility.priceInfo = {
    priceTable: categorized
};

// 가격 범위
const basicCost = categorized['기본비용'];
if (basicCost && basicCost.rows) {
    const usageFee = basicCost.rows.find(r => r.name === '사용료');
    if (usageFee) {
        facility.priceRange = {
            min: Math.round(usageFee.price / 10000),
            max: Math.round(usageFee.price / 10000)
        };
    }
}

console.log(`카테고리: ${Object.keys(categorized).length}개`);
console.log(`가격: ${facility.priceRange.min}만원`);

// 저장
fs.writeFileSync(DATA_FILE, JSON.stringify(facilities, null, 2));

console.log('\n✅ 저장 완료!');
console.log('브라우저 새로고침 후 No.1 확인하세요!');
