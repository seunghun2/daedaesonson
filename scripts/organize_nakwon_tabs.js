const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/facilities.json');

console.log('=== 낙원추모공원 가격표 정리 (탭별 정렬) ===\n');

const facilities = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
const nakwon = facilities[0];
const priceTable = nakwon.priceInfo.priceTable;

// 정렬 함수들
function sortBasicCost(rows) {
    // 사용료 → 관리비 → 기타
    const usage = rows.filter(r => r.name === '사용료');
    const mgmt = rows.filter(r => r.name.includes('관리비') || r.name.includes('조경'));
    const others = rows.filter(r => r.name !== '사용료' && !r.name.includes('관리비') && !r.name.includes('조경'));
    return [...usage, ...mgmt, ...others];
}

function sortGraves(rows) {
    // 평형 작은 순, 가격 낮은 순
    const withSize = rows.filter(r => r.grade && (r.grade.includes('평') || r.grade.includes('위')));
    const withoutSize = rows.filter(r => !r.grade || (!r.grade.includes('평') && !r.grade.includes('위')));

    withSize.sort((a, b) => {
        // 평형 추출
        const sizeA = parseInt(a.grade.match(/\d+/) || 999);
        const sizeB = parseInt(b.grade.match(/\d+/) || 999);
        if (sizeA !== sizeB) return sizeA - sizeB;
        return a.price - b.price;
    });

    withoutSize.sort((a, b) => a.price - b.price);

    return [...withSize, ...withoutSize];
}

function sortByPrice(rows, descending = false) {
    return rows.sort((a, b) => descending ? b.price - a.price : a.price - b.price);
}

function groupOthers(rows) {
    // 기타를 세부 그룹으로 재분류
    const groups = {
        '석물/비석': [],
        '봉분/작업': [],
        '부속품': [],
        '서비스': []
    };

    rows.forEach(row => {
        const name = row.name.toLowerCase();

        if (name.includes('상석') || name.includes('비석') || name.includes('와비') ||
            name.includes('표석') || name.includes('월석') || name.includes('석물')) {
            groups['석물/비석'].push(row);
        } else if (name.includes('봉분') || name.includes('작업') || name.includes('개장') ||
            name.includes('리모델링') || name.includes('수선')) {
            groups['봉분/작업'].push(row);
        } else if (name.includes('유골함') || name.includes('메탈') || name.includes('각자') ||
            name.includes('천막') || name.includes('나무')) {
            groups['부속품'].push(row);
        } else if (name.includes('식사') || name.includes('의전') || name.includes('제사') ||
            name.includes('산신') || name.includes('장례')) {
            groups['서비스'].push(row);
        } else {
            groups['석물/비석'].push(row); // 기본 그룹
        }
    });

    // 각 그룹 내 가격순 정렬
    Object.keys(groups).forEach(key => {
        groups[key].sort((a, b) => b.price - a.price);
    });

    return groups;
}

// 각 카테고리 정렬
if (priceTable['기본비용']) {
    priceTable['기본비용'].rows = sortBasicCost(priceTable['기본비용'].rows);
    console.log('✅ 기본비용: 사용료 → 관리비 순');
}

if (priceTable['매장묘']) {
    priceTable['매장묘'].rows = sortGraves(priceTable['매장묘'].rows);
    console.log('✅ 매장묘: 평형 작은 순 정렬');
}

if (priceTable['봉안묘']) {
    priceTable['봉안묘'].rows = sortGraves(priceTable['봉안묘'].rows);
    console.log('✅ 봉안묘: 평형/위 순 정렬');
}

if (priceTable['봉안당']) {
    priceTable['봉안당'].rows = sortByPrice(priceTable['봉안당'].rows, true);
    console.log('✅ 봉안당: 가격 높은 순');
}

if (priceTable['수목장']) {
    priceTable['수목장'].rows = sortByPrice(priceTable['수목장'].rows, true);
    console.log('✅ 수목장: 가격 높은 순');
}

// 기타 재구성
if (priceTable['기타']) {
    const grouped = groupOthers(priceTable['기타'].rows);

    // 기타를 여러 그룹으로 분리
    delete priceTable['기타'];

    Object.entries(grouped).forEach(([groupName, rows]) => {
        if (rows.length > 0) {
            priceTable[groupName] = {
                unit: '원',
                category: 'other',
                rows: rows
            };
        }
    });

    console.log('✅ 기타: 4개 세부 그룹으로 재분류');
    Object.entries(grouped).forEach(([name, rows]) => {
        console.log(`   - ${name}: ${rows.length}개`);
    });
}

// 저장
fs.writeFileSync(DATA_FILE, JSON.stringify(facilities, null, 2));

console.log('\n✅ 전체 정리 완료!');
console.log('\n카테고리별 항목 수:');
Object.keys(priceTable).forEach(cat => {
    console.log(`  ${cat}: ${priceTable[cat].rows.length}개`);
});

console.log('\n브라우저 새로고침 후 확인하세요!');
