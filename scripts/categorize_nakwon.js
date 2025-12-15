const fs = require('fs');
const path = require('path');

const parsedData = JSON.parse(fs.readFileSync('nakwon_parsed.json', 'utf-8'));

// 분류 로직
const categorized = {
    '기본비용': { unit: '원', rows: [], category: 'BASIC_COST' },
    '매장묘': { unit: '원', rows: [], category: 'BURIAL_TOMB' },
    '봉안묘': { unit: '원', rows: [], category: 'CHARNEL_TOMB' },
    '봉안당': { unit: '원', rows: [], category: 'CHARNEL_HOUSE' },
    '수목장': { unit: '원', rows: [], category: 'NATURAL_BURIAL' },
    '기타': { unit: '원', rows: [], category: 'OTHER' }
};

// 모든 항목 통합
const allItems = [
    ...(parsedData.facilities || []),
    ...(parsedData.services || []),
    ...(parsedData.others || [])
];

console.log(`총 ${allItems.length}개 항목 분류 시작...\n`);

allItems.forEach(item => {
    const name = (item.name || '').toLowerCase();
    const detail = (item.detail || '').toLowerCase();
    const combined = name + ' ' + detail;

    let targetCategory = '기타'; // 기본값

    // 1. 기본비용 (사용료, 관리비)
    if (name.includes('사용료') || name.includes('관리비') || name.includes('조경유지비')) {
        targetCategory = '기본비용';
    }
    // 2. 매장묘 관련
    else if (combined.includes('개인단') || combined.includes('합장') || combined.includes('평단') ||
        combined.includes('매장') || name.includes('묘')) {
        targetCategory = '매장묘';
    }
    // 3. 봉안묘 (평장, 야외)
    else if (combined.includes('평장') || name.includes('담장형') || name.includes('정원형') ||
        name.includes('청여') || name.includes('고흥')) {
        targetCategory = '봉안묘';
    }
    // 4. 봉안당 (실내, 단)
    else if (combined.includes('봉안당') || combined.includes('실내') || name.includes('단')) {
        // 매장묘에서 걸리지 않은 '단' 관련
        if (!categorized['매장묘'].rows.find(r => r.name === item.name)) {
            targetCategory = '봉안당';
        }
    }
    // 5. 수목장
    else if (combined.includes('수목') || combined.includes('자연장') || combined.includes('잔디장')) {
        targetCategory = '수목장';
    }
    // 6. 석물/작업비는 기타로
    else if (name.includes('상석') || name.includes('각자') || name.includes('비석') ||
        name.includes('작업') || name.includes('봉분') || name.includes('석물')) {
        targetCategory = '기타';
    }

    categorized[targetCategory].rows.push({
        name: item.name,
        price: item.price || 0,
        grade: item.detail || ''
    });
});

// 기본비용 정렬: 사용료 먼저, 관리비 나중에
const basicRows = categorized['기본비용'].rows;
const usageFees = basicRows.filter(r => r.name.includes('사용료'));
const mgmtFees = basicRows.filter(r => r.name.includes('관리비') || r.name.includes('조경'));
const otherBasic = basicRows.filter(r => !r.name.includes('사용료') && !r.name.includes('관리비') && !r.name.includes('조경'));

categorized['기본비용'].rows = [
    ...usageFees.sort((a, b) => b.price - a.price),
    ...mgmtFees.sort((a, b) => a.price - b.price),
    ...otherBasic
];

// 결과 출력
console.log('=== 📊 분류 결과 ===\n');
Object.keys(categorized).forEach(category => {
    const count = categorized[category].rows.length;
    console.log(`【 ${category} 】 ${count}개`);
    if (count > 0 && count <= 5) {
        categorized[category].rows.forEach(r => {
            console.log(`  - ${r.name}: ${r.price.toLocaleString()}원`);
        });
    } else if (count > 5) {
        console.log(`  처음 5개:`);
        categorized[category].rows.slice(0, 5).forEach(r => {
            console.log(`  - ${r.name}: ${r.price.toLocaleString()}원`);
        });
        console.log(`  ... 외 ${count - 5}개`);
    }
    console.log('');
});

// 빈 카테고리 제거
Object.keys(categorized).forEach(key => {
    if (categorized[key].rows.length === 0) {
        delete categorized[key];
    }
});

// 저장
fs.writeFileSync(
    'nakwon_categorized.json',
    JSON.stringify(categorized, null, 2)
);

console.log('✅ 저장 완료: nakwon_categorized.json');
console.log('\n이제 facilities.json에 적용할 수 있습니다!');
