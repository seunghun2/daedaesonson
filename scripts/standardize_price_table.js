const fs = require('fs');
const path = require('path');
const {
    CATEGORY_NORMALIZATION,
    ITEM_NORMALIZATION,
    REMOVAL_PATTERNS,
    AUTO_CATEGORIZATION,
    CATEGORY_DB_CODE
} = require('./normalization_map');

const DATA_FILE = path.join(__dirname, '../data/facilities.json');

// ===== 헬퍼 함수 =====

function shouldRemoveItem(item) {
    const name = item.name || '';

    // 가격 0원 + 안내성 항목
    if (item.price === 0 && REMOVAL_PATTERNS.some(pattern => pattern.test(name))) {
        return true;
    }

    // 패턴 매칭
    if (REMOVAL_PATTERNS.some(pattern => pattern.test(name))) {
        return true;
    }

    return false;
}

function normalizeItemName(name) {
    return ITEM_NORMALIZATION[name] || name;
}

function categorizeItem(itemName, itemGrade = '') {
    const combined = (itemName + ' ' + itemGrade).toLowerCase();

    // 우선순위 순으로 체크
    const sorted = [...AUTO_CATEGORIZATION].sort((a, b) => a.priority - b.priority);

    for (const rule of sorted) {
        if (rule.keywords.some(keyword => combined.includes(keyword.toLowerCase()))) {
            return rule.category;
        }
    }

    return "서비스"; // 기본값
}

function standardizeFacility(facility) {
    console.log(`\n처리 중: ${facility.name}`);

    if (!facility.priceInfo || !facility.priceInfo.priceTable) {
        console.log('  ⚠️  가격표 데이터 없음');
        return { changed: false };
    }

    const oldTable = facility.priceInfo.priceTable;
    const newTable = {};

    let removedCount = 0;
    let normalizedCount = 0;
    let recategorizedCount = 0;

    // 각 그룹 처리
    Object.entries(oldTable).forEach(([groupName, groupData]) => {
        const items = groupData.rows || [];

        items.forEach(item => {
            // 1. 제거 여부 확인
            if (shouldRemoveItem(item)) {
                removedCount++;
                return;
            }

            // 2. 항목명 정규화
            const oldName = item.name;
            const normalizedName = normalizeItemName(oldName);
            if (normalizedName !== oldName) {
                normalizedCount++;
            }

            // 3. 카테고리 자동 분류
            const category = categorizeItem(normalizedName, item.grade);

            // 4. 새 테이블에 추가
            if (!newTable[category]) {
                newTable[category] = {
                    unit: '원',
                    category: CATEGORY_DB_CODE[category],
                    rows: []
                };
            }

            newTable[category].rows.push({
                name: normalizedName,
                price: item.price,
                grade: item.grade || ''
            });
        });
    });

    // 5. 각 카테고리 내부 정렬
    Object.keys(newTable).forEach(category => {
        if (category === '기본비용') {
            // 사용료 → 관리비 순
            const usage = newTable[category].rows.filter(r => r.name.includes('사용료'));
            const mgmt = newTable[category].rows.filter(r => r.name.includes('관리비') || r.name.includes('조경'));
            const others = newTable[category].rows.filter(r => !r.name.includes('사용료') && !r.name.includes('관리비') && !r.name.includes('조경'));
            newTable[category].rows = [...usage, ...mgmt, ...others];
        } else if (category === '매장묘' || category === '봉안묘') {
            // 평형/위 작은 순
            newTable[category].rows.sort((a, b) => {
                const sizeA = parseInt(a.grade.match(/\d+/) || 999);
                const sizeB = parseInt(b.grade.match(/\d+/) || 999);
                if (sizeA !== sizeB) return sizeA - sizeB;
                return a.price - b.price;
            });
        } else {
            // 가격 높은 순
            newTable[category].rows.sort((a, b) => b.price - a.price);
        }
    });

    // 업데이트
    facility.priceInfo.priceTable = newTable;

    console.log(`  ✅ 제거: ${removedCount}개, 정규화: ${normalizedCount}개, 재분류: ${recategorizedCount}개`);
    console.log(`  📊 카테고리: ${Object.keys(oldTable).length}개 → ${Object.keys(newTable).length}개`);

    return {
        changed: true,
        stats: {
            removed: removedCount,
            normalized: normalizedCount,
            recategorized: recategorizedCount,
            oldCategories: Object.keys(oldTable).length,
            newCategories: Object.keys(newTable).length
        }
    };
}

// ===== 메인 실행 =====

(async () => {
    const targetCount = parseInt(process.argv[2]) || 10; // 기본값: Top 10

    console.log('=== 가격표 표준화 스크립트 ===');
    console.log(`대상: Top ${targetCount} 시설\n`);

    const facilities = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    const targets = facilities.slice(0, targetCount);

    const results = [];

    for (const facility of targets) {
        const result = standardizeFacility(facility);
        results.push({
            name: facility.name,
            ...result
        });
    }

    // 저장
    fs.writeFileSync(DATA_FILE, JSON.stringify(facilities, null, 2));

    console.log('\n=== 완료 ===\n');
    console.log('전체 통계:');

    const totalRemoved = results.reduce((sum, r) => sum + (r.stats?.removed || 0), 0);
    const totalNormalized = results.reduce((sum, r) => sum + (r.stats?.normalized || 0), 0);

    console.log(`  제거된 항목: ${totalRemoved}개`);
    console.log(`  정규화된 항목: ${totalNormalized}개`);
    console.log(`  처리된 시설: ${results.filter(r => r.changed).length}/${targetCount}개`);

    console.log('\n✅ facilities.json 업데이트 완료!');
    console.log('브라우저 새로고침 후 확인하세요.');

})();
