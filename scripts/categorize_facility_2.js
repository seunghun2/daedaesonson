const fs = require('fs');
const path = require('path');
const {
    ITEM_NORMALIZATION,
    AUTO_CATEGORIZATION,
    CATEGORY_DB_CODE
} = require('./normalization_map');

const INPUT_FILE = path.join(__dirname, '../facility_2_parsed.json');
const OUTPUT_FILE = path.join(__dirname, '../facility_2_categorized.json');

console.log('=== 2번 시설 카테고리 분류 ===\n');

const data = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));

// 카테고리별로 분류
const categorized = {};

data.items.forEach(item => {
    // 항목명 정규화
    const normalizedName = ITEM_NORMALIZATION[item.name] || item.name;

    // 카테고리 자동 분류
    const combined = (normalizedName + ' ' + (item.detail || '')).toLowerCase();

    let category = '기타';
    for (const rule of AUTO_CATEGORIZATION) {
        if (rule.keywords.some(keyword => combined.includes(keyword.toLowerCase()))) {
            category = rule.category;
            break;
        }
    }

    // 카테고리별로 추가
    if (!categorized[category]) {
        categorized[category] = {
            unit: '원',
            category: CATEGORY_DB_CODE[category],
            rows: []
        };
    }

    categorized[category].rows.push({
        name: normalizedName,
        price: item.price,
        grade: item.detail || ''
    });
});

// 각 카테고리 내부 정렬
Object.keys(categorized).forEach(cat => {
    if (cat === '기본비용') {
        // 사용료 → 관리비 순
        const usage = categorized[cat].rows.filter(r => r.name.includes('사용료'));
        const mgmt = categorized[cat].rows.filter(r => r.name.includes('관리비'));
        const others = categorized[cat].rows.filter(r => !r.name.includes('사용료') && !r.name.includes('관리비'));
        categorized[cat].rows = [...usage, ...mgmt, ...others];
    } else {
        // 가격 높은 순
        categorized[cat].rows.sort((a, b) => b.price - a.price);
    }
});

console.log('카테고리별 분류:');
Object.keys(categorized).forEach(cat => {
    console.log(`  ${cat}: ${categorized[cat].rows.length}개`);
});

// 저장
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(categorized, null, 2));

console.log(`\n💾 저장: ${OUTPUT_FILE}`);
