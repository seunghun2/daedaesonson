const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/facilities.json');

// ===== 정규화 매핑 테이블 =====

// 1. 카테고리명 정규화
const CATEGORY_NORMALIZATION = {
    // 사용료/기본비용
    "시설사용료": "기본비용",
    "묘지사용료": "기본비용",
    "묘지 임대사용료": "기본비용",
    "묘지 사용료": "기본비용",

    // 서비스/석물 (세분화)
    "서비스 항목": null, // 재분류 필요
    "석물비": "석물/비석",
    "장사용품": null, // 재분류 필요
    "장사용품 분류": null, // 재분류 필요

    // 작업비
    "설치공사비": "작업비",

    // 각자
    "각자 비용": "부속품"
};

// 2. 항목명 정규화
const ITEM_NORMALIZATION = {
    // 사용료
    "묘지사용료": "사용료",
    "묘지 임대사용료": "사용료",
    "묘지 사용료": "사용료",
    "시설사용료": "사용료",
    "단장묘 사용료": "사용료",

    // 관리비
    "묘지관리비": "관리비",
    "묘지공동관리비": "관리비",
    "묘지 관리비": "관리비",
    "단장묘 관리비": "관리비",
    "공동관리비": "관리비",

    // 석물류
    "상석세트": "상석",
    "상석애석": "상석",
    "혼유석(상석)": "상석",
    "화강상석": "상석",

    // 작업비
    "봉분설치비": "봉분작업비",
    "분묘설치비": "봉분작업비",
    "봉분수선비": "봉분수선",
    "개장정리비": "개장작업비",

    // 기타
    "둘레석": "경계석",
    "납골묘": "봉안묘",
    "조경유지비": "조경비",
    "단장묘 조경비": "조경비"
};

// 3. 제거 대상 패턴
const REMOVAL_PATTERNS = [
    /반환/,
    /환불.*규정/,
    /만족도/,
    /설문/,
    /조사/,
    /업데이트/,
    /판매\(사용\)가격/
];

// 4. 카테고리 자동 분류 규칙
const AUTO_CATEGORIZATION = [
    {
        category: "기본비용",
        keywords: ["사용료", "관리비", "조경비"],
        priority: 1
    },
    {
        category: "매장묘",
        keywords: ["매장묘", "단장묘", "합장", "쌍분"],
        priority: 2
    },
    {
        category: "봉안묘",
        keywords: ["봉안묘", "납골묘", "평장"],
        priority: 3
    },
    {
        category: "봉안당",
        keywords: ["봉안당", "납골당", "실내", "특별실", "일반실"],
        priority: 4
    },
    {
        category: "수목장",
        keywords: ["수목", "자연장", "잔디장"],
        priority: 5
    },
    {
        category: "석물/비석",
        keywords: ["상석", "비석", "와비", "둘레석", "경계석", "월석", "화병", "향로", "석등", "석관", "석곽", "석실", "묘테"],
        priority: 6
    },
    {
        category: "작업비",
        keywords: ["작업비", "설치비", "공사비", "개장", "봉분", "수선"],
        priority: 7
    },
    {
        category: "부속품",
        keywords: ["유골함", "메탈", "각자", "천막", "나무"],
        priority: 8
    },
    {
        category: "서비스",
        keywords: ["식사", "의전", "제사", "산신제", "개토제", "장례"],
        priority: 9
    }
];

// 5. 카테고리별 DB 코드
const CATEGORY_DB_CODE = {
    "기본비용": "base_cost",
    "매장묘": "grave",
    "봉안묘": "charnel_grave",
    "봉안당": "charnel_house",
    "수목장": "natural",
    "석물/비석": "other",
    "작업비": "other",
    "부속품": "other",
    "서비스": "other"
};

module.exports = {
    CATEGORY_NORMALIZATION,
    ITEM_NORMALIZATION,
    REMOVAL_PATTERNS,
    AUTO_CATEGORIZATION,
    CATEGORY_DB_CODE
};
