const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/facilities.json');
const FULL_PRICES = path.join(__dirname, '../nakwon_full_prices.json');

console.log('=== 낙원추모공원 가격표 정확한 값으로 업데이트 ===\n');

const facilities = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
const fullPrices = JSON.parse(fs.readFileSync(FULL_PRICES, 'utf-8'));
const nakwon = facilities[0];

// 카테고리별 분류
const categorized = {
    '기본비용': { unit: '원', category: 'base_cost', rows: [] },
    '매장묘': { unit: '원', category: 'grave', rows: [] },
    '봉안묘': { unit: '원', category: 'charnel_grave', rows: [] },
    '봉안당': { unit: '원', category: 'charnel_house', rows: [] },
    '수목장': { unit: '원', category: 'natural', rows: [] },
    '기타': { unit: '원', category: 'other', rows: [] }
};

fullPrices.items.forEach(item => {
    const name = item.name || '';
    const detail = item.detail || '';
    const combined = name + ' ' + detail;

    let targetCat = '기타';

    // 기본비용
    if (name === '사용료' || name === '관리비' || name.includes('조경')) {
        targetCat = '기본비용';
    }
    // 매장묘
    else if (name.includes('매장묘') || name.includes('봉분') && !name.includes('평장')) {
        targetCat = '매장묘';
    }
    // 봉안묘 (평장)
    else if (name.includes('평장') || name.includes('청여') || name.includes('담장형') || name.includes('정원형')) {
        targetCat = '봉안묘';
    }
    // 봉안당
    else if (name.includes('봉안당') || name.includes('플라타너스') || name.includes('다알리아') || name.includes('클로버') || name.includes('아이리스')) {
        targetCat = '봉안당';
    }
    // 수목장
    else if (name.includes('수목')) {
        targetCat = '수목장';
    }

    categorized[targetCat].rows.push({
        name: item.name,
        price: item.price,
        grade: item.detail || ''
    });
});

// 기본비용 정렬
const basicRows = categorized['기본비용'].rows;
const usageFees = basicRows.filter(r => r.name === '사용료');
const mgmtFees = basicRows.filter(r => r.name.includes('관리비') || r.name.includes('조경'));
const others = basicRows.filter(r => !r.name.includes('사용료') && !r.name.includes('관리비') && !r.name.includes('조경'));

categorized['기본비용'].rows = [
    ...usageFees,
    ...mgmtFees,
    ...others
];

// 업데이트
nakwon.priceInfo = nakwon.priceInfo || {};
nakwon.priceInfo.priceTable = categorized;

// 가격 범위 (사용료 기준)
nakwon.priceRange = {
    min: 300,
    max: 300
};

fs.writeFileSync(DATA_FILE, JSON.stringify(facilities, null, 2));

console.log('✅ 업데이트 완료!\n');
console.log('적용된 카테고리:');
Object.keys(categorized).forEach(cat => {
    console.log(`  ${cat}: ${categorized[cat].rows.length}개`);
});

console.log('\n주요 가격 확인:');
categorized['매장묘'].rows.slice(0, 5).forEach(r => {
    if (r.price > 100000) {
        console.log(`  ${r.name} ${r.grade}: ${r.price.toLocaleString()}원`);
    }
});

console.log('\n브라우저 새로고침 후 확인하세요!');
