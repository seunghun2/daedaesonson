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
    console.log(`✅ ID ${idNum} (${facilities[fIndex].name}) updated.`);
}

console.log("💎 Injecting Gold Standard Data for 68, 69, 70, 71...");

// 68. 전농동성당 평화묘원
updateFacility(68, "평화", {
    '매장묘': {
        rows: [
            { name: "묘지 분양 (단장)", price: 3000000, description: "분양비", isRepresentative: true },
            { name: "묘지 분양 (합장)", price: 5000000, description: "분양비", isRepresentative: false },
            { name: "석관비 (단장)", price: 2000000, description: "필수", isRepresentative: false },
            { name: "작업비 (단장)", price: 1400000, description: "필수", isRepresentative: false }
        ]
    },
    '봉안당': { rows: [] },
    '수목장': { rows: [] },
    '옵션': {
        rows: [
            { name: "관리비 (단장/15년)", price: 1350000, description: "15년 선납", isRepresentative: false },
            { name: "관리비 (합장/15년)", price: 1950000, description: "15년 선납", isRepresentative: false }
        ]
    }
});

// 69. (재)천주교평내공원묘원
updateFacility(69, "평내", {
    '매장묘': {
        rows: [
            { name: "매장묘 사용료 (3평)", price: 1000000, description: "9.9㎡ (3평) 분양지", isRepresentative: true },
            { name: "개장 작업비 (1인)", price: 500000, description: "1인 개장", isRepresentative: false },
            { name: "개장 작업비 (2인/합장)", price: 800000, description: "합장 개장", isRepresentative: false }
        ]
    },
    '봉안당': { rows: [] },
    '수목장': { rows: [] },
    '옵션': {
        rows: [
            { name: "관리비 (연/평당)", price: 6000, description: "3.3㎡당 1년", isRepresentative: false }
        ]
    }
});

// 70. 재림공원묘원
updateFacility(70, "재림", {
    '매장묘': {
        rows: [
            { name: "묘지 사용료 (1평당)", price: 1250000, description: "3평 기준 1평당 가격", isRepresentative: true },
            { name: "비석", price: 600000, description: "오석 비석 + 받침대 포함", isRepresentative: false },
            { name: "작업 인건비", price: 600000, description: "매장시 인력 2명 + 사무실 인력 2명", isRepresentative: false }
        ]
    },
    '봉안당': { rows: [] },
    '수목장': { rows: [] },
    '옵션': {
        rows: [
            { name: "관리비 (5년)", price: 200000, description: "1년 4만원 / 5년 선납", isRepresentative: false },
            { name: "잔디비", price: 350000, description: "매장시 잔디 식재비", isRepresentative: false }
        ]
    }
});

// 71. (재)신세계공원묘원
updateFacility(71, "신세계", {
    '매장묘': {
        rows: [
            { name: "묘지 사용료 (평당)", price: 1000000, description: "3.3㎡(평당)/1기", isRepresentative: true }
        ]
    },
    '봉안묘': {
        rows: [
            { name: "봉안묘 (부부1)", price: 10000000, description: "시설비 및 사용료 (관리비 별도)", isRepresentative: false },
            { name: "평장묘 (1기)", price: 4000000, description: "시설비 및 사용료", isRepresentative: true },
            { name: "평장묘 (2기-4기)", price: 8700000, description: "시설비 및 사용료", isRepresentative: false }
        ]
    },
    '수목장': {
        rows: [
            { name: "수목장 (부부목/1-2기)", price: 4750000, description: "사용료 및 관리비(서울, 본인비, 가지비별도)", isRepresentative: true },
            { name: "수목장 (1-4기)", price: 9400000, description: "사용료 및 관리비", isRepresentative: false }
        ]
    },
    '옵션': {
        rows: [
            { name: "관리비 (년/평당)", price: 14000, description: "3.3㎡당 14,000원", isRepresentative: false }
        ]
    }
});

// Save all
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log("✅ 4 Facilities (68, 69, 70, 71) have been bulk-updated to Gold Standard.");
