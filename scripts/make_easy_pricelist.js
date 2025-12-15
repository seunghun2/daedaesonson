const fs = require('fs');
const path = require('path');

const rawData = JSON.parse(fs.readFileSync('nakwon_categorized.json', 'utf-8'));

// 용어 사전 (전문용어 → 쉬운 말)
const glossary = {
    '상석': '제사상 석물',
    '와비': '묘지 앞 장식석',
    '각자대': '이름 새기기',
    '걸방석': '상석 받침돌',
    '개장': '묘지 이전',
    '충곽': '관 옮기기',
    '탈관': '관에서 유골 꺼내기',
    '봉분': '봉긋한 무덤',
    '평장': '평평한 무덤',
    '월석': '달 모양 비석',
    '둘레석': '묘지 테두리 돌',
    '경계석': '묘역 경계 표시석',
    '판석': '넓적한 돌판',
    '석곽': '돌로 만든 관',
    '유골함': '유골 보관함',
    '개토제': '땅 파는 제사',
    '산신제': '산신령께 드리는 제사'
};

// 용어 변환 함수
function translateTerm(text) {
    let result = text;
    Object.keys(glossary).forEach(term => {
        const regex = new RegExp(term, 'g');
        result = result.replace(regex, glossary[term]);
    });
    return result;
}

// 상세 설명 추가 함수
function enhanceDescription(item) {
    const name = item.name;
    const grade = item.grade || '';

    let newName = translateTerm(name);
    let newGrade = translateTerm(grade);

    // 추가 설명
    if (name.includes('평형')) {
        newGrade = newGrade || '1평 = 약 3.3㎡ (가로세로 약 1.8m × 1.8m)';
    }
    if (name.includes('단형')) {
        newGrade = (newGrade ? newGrade + ' | ' : '') + '단수가 높을수록 화려함';
    }
    if (name.includes('작업비') && !grade) {
        newGrade = '전문 인력이 직접 시공';
    }
    if (name.includes('세트') && name.includes('제사상')) {
        newGrade = (newGrade ? newGrade + ' | ' : '') + '향로, 꽃병, 촛대 등 포함';
    }

    return {
        name: newName,
        price: item.price,
        grade: newGrade
    };
}

// 카테고리별 재정리
const enhanced = {};

console.log('=== 📝 가격표를 쉽게 풀어쓰기 ===\n');

// 1. 기본비용 (그대로 유지, 설명만 보강)
enhanced['기본비용'] = {
    unit: '원',
    category: 'BASIC_COST',
    rows: rawData['기본비용'].rows.map(item => {
        if (item.name === '사용료') {
            return {
                name: '묘지 사용료',
                price: item.price,
                grade: '1평(약 3.3㎡) 기준 | 영구 사용 가능'
            };
        } else if (item.name === '관리비') {
            return {
                name: '연간 관리비',
                price: item.price,
                grade: '1평 기준 1년치 | 잔디/청소 포함'
            };
        } else if (item.name === '조경유지비') {
            return {
                name: '조경/환경 관리비',
                price: item.price,
                grade: '매장묘/평장묘 공통 | 공원 환경 유지비'
            };
        } else if (item.name.includes('반환')) {
            return {
                name: item.name.replace('반환', '환불 규정'),
                price: 0,
                grade: item.grade || '규정에 따라 환불 가능'
            };
        }
        return enhanceDescription(item);
    })
};

// 2. 매장묘 (작업비와 상품 분리)
const burialWorks = [];
const burialProducts = [];

rawData['매장묘'].rows.forEach(item => {
    if (item.name.includes('작업비') || item.name.includes('수선') || item.name.includes('진행비')) {
        burialWorks.push(enhanceDescription(item));
    } else {
        burialProducts.push(enhanceDescription(item));
    }
});

enhanced['매장묘'] = {
    unit: '원',
    category: 'BURIAL_TOMB',
    rows: [
        { name: '━━━ 매장묘 상품 ━━━', price: 0, grade: '전통 방식의 땅속 안장' },
        ...burialProducts,
        { name: '━━━ 작업/서비스 비용 ━━━', price: 0, grade: '추가 서비스 비용' },
        ...burialWorks
    ]
};

// 3. 봉안묘 (평장묘로 명칭 변경, 설명 보강)
enhanced['평장묘 (야외 봉안)'] = {
    unit: '원',
    category: 'CHARNEL_TOMB',
    rows: [
        { name: '━━━ 평장묘란? ━━━', price: 0, grade: '평평하고 넓은 야외 봉안 공간 | 정원처럼 아름다운 형태' },
        ...rawData['봉안묘'].rows.map(item => {
            let enhanced = enhanceDescription(item);
            if (item.name.includes('청여')) {
                enhanced.grade = (enhanced.grade || '') + ' | 여러 위(骨) 함께 안치 가능';
            }
            if (item.name.includes('정원형')) {
                enhanced.grade = (enhanced.grade || '') + ' | 꽃과 나무로 꾸민 정원 스타일';
            }
            if (item.name.includes('담장형')) {
                enhanced.grade = (enhanced.grade || '') + ' | 담장으로 둘러싼 독립 공간';
            }
            return enhanced;
        })
    ]
};

// 4. 봉안당 (재분류 필요 - 실제로 봉분 관련이 많음)
// 실내 봉안당과 야외 봉분을 분리
const indoorCharnel = [];
const outdoorMounds = [];

rawData['봉안당'].rows.forEach(item => {
    if (item.name.includes('봉분') || item.name.includes('조각')) {
        outdoorMounds.push(item);
    } else {
        indoorCharnel.push(item);
    }
});

// 봉분은 매장묘로 이동
if (outdoorMounds.length > 0) {
    enhanced['매장묘'].rows.push(
        { name: '━━━ 특수 봉분 (추가 옵션) ━━━', price: 0, grade: '고급 봉분 디자인' },
        ...outdoorMounds.map(enhanceDescription)
    );
}

// 실제 봉안당만 남김
enhanced['봉안당 (실내)'] = {
    unit: '원',
    category: 'CHARNEL_HOUSE',
    rows: [
        { name: '━━━ 실내 봉안당 ━━━', price: 0, grade: '날씨에 관계없이 편안한 참배 | 깨끗한 실내 공간' },
        ...indoorCharnel.map(item => {
            let enhanced = enhanceDescription(item);
            if (item.name.includes('단품')) {
                enhanced.name = item.name.replace('(단품)', '');
                enhanced.grade = (enhanced.grade || '단독 구매') + ' | 디자인 상품';
            }
            return enhanced;
        })
    ]
};

// 5. 수목장
enhanced['수목장 (자연장)'] = {
    unit: '원',
    category: 'NATURAL_BURIAL',
    rows: [
        { name: '━━━ 수목장이란? ━━━', price: 0, grade: '나무 아래 자연으로 돌아가는 친환경 장법' },
        ...rawData['수목장'].rows.map(enhanceDescription)
    ]
};

// 6. 기타 (석물과 서비스로 분리)
const stoneProducts = [];
const services = [];

rawData['기타'].rows.forEach(item => {
    if (item.name.includes('식사') || item.name.includes('의전') || item.name.includes('제사') ||
        item.name.includes('천막') || item.name.includes('유골함')) {
        services.push(item);
    } else {
        stoneProducts.push(item);
    }
});

enhanced['추가 석물 및 장식'] = {
    unit: '원',
    category: 'INSTALLATION',
    rows: [
        { name: '━━━ 석물/장식품 ━━━', price: 0, grade: '묘역을 꾸미는 돌 제품들' },
        ...stoneProducts.map(enhanceDescription)
    ]
};

enhanced['장례/관리 서비스'] = {
    unit: '원',
    category: 'SERVICE',
    rows: [
        { name: '━━━ 장례 진행 서비스 ━━━', price: 0, grade: '전문가가 도와드립니다' },
        ...services.map(enhanceDescription)
    ]
};

// 저장
fs.writeFileSync('nakwon_easy.json', JSON.stringify(enhanced, null, 2));

// 출력
console.log('【 기본비용 】');
enhanced['기본비용'].rows.slice(0, 5).forEach(r => {
    console.log(`  ${r.name}: ${r.price.toLocaleString()}원`);
    if (r.grade) console.log(`    → ${r.grade}`);
});

console.log('\n【 매장묘 】');
enhanced['매장묘'].rows.slice(0, 5).forEach(r => {
    console.log(`  ${r.name}: ${r.price.toLocaleString()}원`);
    if (r.grade) console.log(`    → ${r.grade}`);
});

console.log('\n【 평장묘 (야외 봉안) 】');
enhanced['평장묘 (야외 봉안)'].rows.slice(0, 5).forEach(r => {
    console.log(`  ${r.name}: ${r.price.toLocaleString()}원`);
    if (r.grade) console.log(`    → ${r.grade}`);
});

console.log('\n✅ 총 7개 카테고리로 재구성 완료');
console.log('💾 저장: nakwon_easy.json');
console.log('\n이제 사람들이 이해하기 훨씬 쉬워졌습니다!');
