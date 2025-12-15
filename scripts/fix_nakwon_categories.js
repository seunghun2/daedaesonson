const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/facilities.json');

// 올바른 매핑
const CATEGORY_MAP = {
    '기본비용': { category: 'base_cost' },
    '매장묘': { category: 'grave' },
    '평장묘 (야외 봉안)': { category: 'charnel_grave' },  // 원래 "봉안묘" 탭으로
    '봉안당 (실내)': { category: 'charnel_house' },
    '수목장 (자연장)': { category: 'natural' },
    '추가 석물 및 장식': { category: 'other' },  // "석물" 단어 때문에 문제 -> 그룹명 변경 + 기타로
    '장례/관리 서비스': { category: 'other' }
};

(async () => {
    console.log('=== 낙원추모공원 가격표 카테고리 수정 ===\n');

    const facilities = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    const nakwon = facilities[0];

    if (!nakwon.priceInfo || !nakwon.priceInfo.priceTable) {
        console.log('❌ 가격표 데이터가 없습니다.');
        return;
    }

    const oldTable = nakwon.priceInfo.priceTable;
    const newTable = {};

    // 그룹명 변경 및 category 수정
    Object.entries(oldTable).forEach(([groupName, groupData]) => {
        let newGroupName = groupName;
        let newCategory = groupData.category;

        // 매핑 확인
        if (CATEGORY_MAP[groupName]) {
            newCategory = CATEGORY_MAP[groupName].category;
        }

        // 특수 처리: "석물" 단어 제거
        if (groupName === '추가 석물 및 장식') {
            newGroupName = '추가 부속품 및 옵션';
        }

        newTable[newGroupName] = {
            ...groupData,
            category: newCategory
        };
    });

    // 업데이트
    nakwon.priceInfo.priceTable = newTable;

    fs.writeFileSync(DATA_FILE, JSON.stringify(facilities, null, 2));

    console.log('✅ 카테고리 매핑 완료!\n');
    console.log('수정된 그룹:');
    Object.entries(newTable).forEach(([name, data]) => {
        console.log(`  ${name} → category: ${data.category}`);
    });

    console.log('\n새로고침 후 확인하세요!');

})();
