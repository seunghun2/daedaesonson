const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../data/facilities.json');
const facilities = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));

function updateFacility(idNum, nameHint, pricingData) {
    let fIndex = facilities.findIndex(f => f.id === `park-000${idNum}`);
    if (fIndex === -1 && idNum < 100) fIndex = facilities.findIndex(f => f.id === `park-00${idNum}`);

    if (fIndex === -1) fIndex = facilities.findIndex(f => f.name.includes(nameHint));

    if (fIndex === -1) {
        console.error(`❌ Facility ID ${idNum} not found!`);
        return;
    }

    facilities[fIndex].pricing = pricingData;
    console.log(`✅ ID ${facilities[fIndex].id} (${facilities[fIndex].name}) updated.`);
}

console.log("💎 Injecting Gold Standard Data for 88, 89, 90, 91, 92...");

// 88. 김해하늘공원(묘지)
updateFacility(88, "김해하늘", {
    '매장묘': {
        rows: [
            { name: "묘지 사용료 (3.3㎡)", price: 2500000, description: "3.3㎡ 기준", isRepresentative: true }
        ]
    },
    '봉안당': { rows: [] },
    '수목장': { rows: [] },
    '옵션': {
        rows: [
            { name: "관리비", price: 18000, description: "3.3㎡/1년 기준", isRepresentative: false }
        ]
    }
});

// 89. 여수시공설묘지공원
updateFacility(89, "여수", {
    '매장묘': {
        rows: [
            { name: "공설묘지 사용료 (일반시민)", price: 540000, description: "묘지1기당 6.61제곱m/30년", isRepresentative: true },
            { name: "공설묘지 사용료 (특례자)", price: 810000, description: "30년", isRepresentative: false }
        ]
    },
    '봉안당': { rows: [] },
    '수목장': { rows: [] },
    '옵션': {
        rows: [
            { name: "공설묘지 관리비 (일반시민)", price: 360000, description: "30년", isRepresentative: false },
            { name: "부대수수료 (일반시민)", price: 702000, description: "30년", isRepresentative: false },
            { name: "공설묘지 관리비 (특례자)", price: 360000, description: "30년", isRepresentative: false },
            { name: "부대수수료 (특례자)", price: 702000, description: "30년", isRepresentative: false }
        ]
    }
});

// 90. 정선하늘공원
updateFacility(90, "정선", {
    '매장묘': {
        rows: [
            { name: "단장 (정선군민)", price: 923000, description: "6.3㎡ / 정선군민만 가능", isRepresentative: true },
            { name: "합장 (정선군민)", price: 1200000, description: "8.1㎡ / 정선군민만 가능", isRepresentative: false }
        ]
    },
    '봉안묘': {
        rows: [
            { name: "봉안묘 (12기)", price: 1476000, description: "10㎡ / 정선군민만 가능", isRepresentative: true }
        ]
    },
    '옵션': {
        rows: [
            { name: "연장 사용료 (단장)", price: 300000, description: "연장 시", isRepresentative: false },
            { name: "연장 사용료 (합장)", price: 390000, description: "연장 시", isRepresentative: false },
            { name: "연장 사용료 (봉안묘)", price: 480000, description: "연장 시", isRepresentative: false }
        ]
    }
});

// 91. 광릉 더 크레스트 묘지
updateFacility(91, "광릉", {
    '매장묘': {
        rows: [
            { name: "사용료 (1평)", price: 1700000, description: "1평(3.3㎡) 기준 (이미지상 '요금'란은 단위금액 추정)", isRepresentative: true }
        ]
    },
    '봉안당': { rows: [] }, // 이미지에 "봉안당" 항목이 있으나 금액이 847만원 등으로 되어 있음.
    '봉안묘': {
        rows: [
            { name: "봉안당 (기)", price: 8477000, description: "상세 내역 확인 필요 (봉안묘/담 추정)", isRepresentative: false }
        ]
    },
    '수목장': {
        rows: [
            { name: "자연장 사용료 (기)", price: 2305000, description: "자연장", isRepresentative: false }
        ]
    },
    '옵션': {
        rows: [
            { name: "1년 관리비 (평)", price: 19500, description: "1평당", isRepresentative: false },
            { name: "자연장 관리비 (기)", price: 34700, description: "1기당", isRepresentative: false }
        ]
    }
});

// 92. (재)안동추모공원(묘지)
updateFacility(92, "안동추모", {
    '매장묘': {
        rows: [] // 이미지상 매장묘 단일 항목 대신 '서구형 3단' 등 세트 상품임
    },
    '봉안묘': { // '서구형 3단' 등은 묘지 형태의 봉안묘일 가능성이 높음 (혹은 매장묘 세트)
        rows: [
            { name: "서구형 3단", price: 9680000, description: "관리비 5년, 사용료, 조성비, 석물 포함 (각자비 별도)", isRepresentative: true },
            { name: "서구형 특 3단", price: 10580000, description: "관리비 5년, 사용료, 조성비, 석물 포함", isRepresentative: false },
            { name: "서구형 특대 3단", price: 11980000, description: "관리비 5년, 사용료, 조성비, 석물 포함", isRepresentative: false },
            { name: "서구형 확대 합장묘", price: 13580000, description: "관리비 5년, 사용료, 조성비, 석물 포함", isRepresentative: false }
        ]
    },
    '수목장': { rows: [] },
    '옵션': {
        rows: [
            { name: "묘지 조화", price: 6000, description: "개", isRepresentative: false }
        ]
    }
});

// Save
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log("✅ 5 Facilities (88-92) updated with Gold Standard Data.");
