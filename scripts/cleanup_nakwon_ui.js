const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/facilities.json');

(async () => {
    console.log('=== 낙원추모공원 가격 & UI 정리 ===\n');

    const facilities = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    const nakwon = facilities[0];

    // 1. 가격 범위 수정 (사용료 기준 300만원)
    nakwon.priceRange = {
        min: 300,  // 300만원
        max: 300
    };

    // 2. UI/UX 개선: 용어 원복 + 설명 간결화
    const priceTable = nakwon.priceInfo.priceTable;

    Object.keys(priceTable).forEach(groupName => {
        const group = priceTable[groupName];

        group.rows = group.rows.map(row => {
            let name = row.name;
            let grade = row.grade || '';

            // "봉긋한 무덤" → "봉분" 원복
            name = name.replace(/봉긋한 무덤/g, '봉분');
            grade = grade.replace(/봉긋한 무덤/g, '봉분');

            // "제사상 석물" → "상석" 원복
            name = name.replace(/제사상 석물/g, '상석');

            // "묘지 앞 장식석" → "와비" 원복
            name = name.replace(/묘지 앞 장식석/g, '와비');

            // "이름 새기기" → "각자" 원복  
            name = name.replace(/이름 새기기/g, '각자');

            // "평평한 무덤" → "평장" 원복
            name = name.replace(/평평한 무덤/g, '평장');

            // "달 모양 비석" → "월석" 원복
            name = name.replace(/달 모양 비석/g, '월석');

            // "묘지 이전" → "개장" 원복
            name = name.replace(/묘지 이전/g, '개장');

            // "유골 보관함" → "유골함" 원복
            name = name.replace(/유골 보관함/g, '유골함');

            // "상석 받침돌" → "걸방석" 원복
            name = name.replace(/상석 받침돌/g, '걸방석');

            // "관 옮기기/관에서 유골 꺼내기비" → "충곽/탈관비" 원복
            name = name.replace(/관 옮기기\/.*?비/g, '충곽/탈관비');

            // "돌로 만든 관" → "석곽" 원복
            name = name.replace(/돌로 만든 관/g, '석곽');

            // "넓적한 돌판" → "판석" 원복
            name = name.replace(/넓적한 돌판/g, '판석');

            // "묘역 경계 표시석" → "경계석" 원복
            name = name.replace(/묘역 경계 표시석/g, '경계석');

            // 구분선 제거
            if (name.includes('━━━')) {
                return null; // 삭제 표시
            }

            // grade 간결화
            if (grade.includes('|')) {
                // "1평(약 3.3㎡) 기준 | 영구 사용 가능" → "1평(약 3.3㎡)"
                grade = grade.split('|')[0].trim();
            }

            // "전문 인력이 직접 시공" 같은 불필요한 설명 제거
            if (grade === '전문 인력이 직접 시공') {
                grade = '';
            }

            // "단수가 높을수록 화려함" 제거
            grade = grade.replace(/\s*\|\s*단수가 높을수록 화려함/g, '');
            grade = grade.replace(/단수가 높을수록 화려함\s*\|\s*/g, '');
            grade = grade.replace(/단수가 높을수록 화려함/g, '');

            // "여러 위(骨) 함께 안치 가능" 제거
            grade = grade.replace(/\s*\|\s*여러 위\(骨\) 함께 안치 가능/g, '');

            // "꽃과 나무로 꾸민 정원 스타일" 제거
            grade = grade.replace(/\s*\|\s*꽃과 나무로 꾸민 정원 스타일/g, '');

            // 나머지 " | " 정리
            grade = grade.replace(/\s*\|\s*$/, '');

            return {
                name,
                price: row.price,
                grade: grade.trim()
            };
        }).filter(row => row !== null); // 구분선 제거
    });

    // 3. 저장
    fs.writeFileSync(DATA_FILE, JSON.stringify(facilities, null, 2));

    console.log('✅ 수정 완료!\n');
    console.log('변경 사항:');
    console.log('  1. 가격 표시: 2만원 → 300만원');
    console.log('  2. 용어: 쉬운말 → 전문용어 원복');
    console.log('  3. 설명: 장황한 내용 → 간결하게');
    console.log('  4. 구분선 제거');
    console.log('\n새로고침 후 확인하세요!');

})();
