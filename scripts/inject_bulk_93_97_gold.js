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

console.log("💎 Injecting Gold Standard Data for 93~97...");

// 93. 청량리성당 다볼산묘원 (DB: 다볼산 / Img: 다불산)
updateFacility(93, "청량리", {
    '매장묘': {
        rows: [
            { name: "매장묘지 사용료", price: 10000, description: "3.3㎡ (상징적 금액/확인필요)", isRepresentative: false }
        ]
    },
    '봉안묘': { // 평장묘는 자연장/봉안묘 카테고리
        rows: [
            { name: "평장묘 묘지사용료", price: 3500000, description: "3.3㎡", isRepresentative: true },
            { name: "평장묘 석물세트", price: 1200000, description: "3.3㎡", isRepresentative: false }
        ]
    },
    '옵션': {
        rows: [
            { name: "평장묘 관리비", price: 20000, description: "3.3㎡", isRepresentative: false }
        ]
    }
});

// 94. 예래원(묘지)
updateFacility(94, "예래원", {
    '매장묘': {
        rows: [
            { name: "사용료 (1㎡)", price: 373370, description: "㎡당 가격 (평당 약 123만원)", isRepresentative: true },
            { name: "석물 (고급합장묘B)", price: 24900000, description: "1기", isRepresentative: false },
            { name: "석물 (고급합장묘D)", price: 26100000, description: "1기", isRepresentative: false }
        ]
    },
    '봉안당': { rows: [] },
    '수목장': { rows: [] },
    '옵션': {
        rows: [
            { name: "관리비 (1㎡/1년)", price: 7670, description: "㎡당 연간 관리비", isRepresentative: false },
            { name: "안치비", price: 1500000, description: "1회", isRepresentative: false }
        ]
    }
});

// 95. 현대공원1묘원
updateFacility(95, "현대공원1", {
    '매장묘': {
        rows: [
            { name: "묘지사용료 (평당)", price: 1300000, description: "평당 사용료", isRepresentative: true }
        ]
    },
    '옵션': {
        rows: [
            { name: "관리비 (평당)", price: 15000, description: "평당 관리비", isRepresentative: false },
            { name: "상석 (소)", price: 800000, description: "가로 70cm", isRepresentative: false },
            { name: "상석 (중)", price: 950000, description: "가로 75cm", isRepresentative: false },
            { name: "비석 (오석)", price: 700000, description: "가로 26cm", isRepresentative: false }
        ]
    }
});

// 96. 전주효자공원
updateFacility(96, "전주효자", {
    '매장묘': {
        rows: [
            { name: "사용료 (30년)", price: 240000, description: "최초 30년 (1기)", isRepresentative: true },
            { name: "사용료 (5년 연장)", price: 40000, description: "1회 연장 가능", isRepresentative: false }
        ]
    },
    '옵션': {
        rows: [
            { name: "관리비 (30년)", price: 160000, description: "최초 30년 (1기)", isRepresentative: false },
            { name: "관리비 (5년 연장)", price: 27000, description: "연장 시", isRepresentative: false }
        ]
    }
});

// 97. 현대공원2묘원 (1묘원과 동일)
updateFacility(97, "현대공원2", {
    '매장묘': {
        rows: [
            { name: "묘지사용료 (평당)", price: 1300000, description: "평당 사용료", isRepresentative: true }
        ]
    },
    '옵션': {
        rows: [
            { name: "관리비 (평당)", price: 15000, description: "평당 관리비", isRepresentative: false },
            { name: "상석 (소)", price: 800000, description: "가로 70cm", isRepresentative: false },
            { name: "상석 (중)", price: 950000, description: "가로 75cm", isRepresentative: false },
            { name: "비석 (오석)", price: 700000, description: "가로 26cm", isRepresentative: false }
        ]
    }
});

// Save
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log("✅ 5 Facilities (93-97) updated with Gold Standard Data.");
