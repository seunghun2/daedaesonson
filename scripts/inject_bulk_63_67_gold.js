const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../data/facilities.json');
const facilities = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));

function updateFacility(idNum, nameHint, pricingData) {
    let fIndex = facilities.findIndex(f => f.id === `park-000${idNum}`);
    if (fIndex === -1 && idNum < 100) {
        fIndex = facilities.findIndex(f => f.id === `park-00${idNum}`);
    }

    // 이름으로도 찾기 (안전장치)
    if (fIndex === -1) {
        fIndex = facilities.findIndex(f => f.name.includes(nameHint));
    }

    if (fIndex === -1) {
        console.error(`❌ Facility ID ${idNum} (${nameHint}) not found!`);
        return;
    }

    facilities[fIndex].pricing = pricingData;
    console.log(`✅ ID ${idNum} (${facilities[fIndex].name}) updated.`);
}

console.log("💎 Injecting Gold Standard Data for 63, 64, 65, 66, 67...");

// 63. 태백공원묘원
updateFacility(63, "태백", {
    '매장묘': {
        rows: [
            { name: "단장 (일반)", price: 2273000, description: "매장 / 일반", isRepresentative: true },
            { name: "단장 (기초수급자)", price: 1650000, description: "매장 / 기초수급자, 국가유공자", isRepresentative: false },
            { name: "합장 (일반)", price: 2844000, description: "매장 / 합장", isRepresentative: false }
        ]
    },
    '봉안당': { rows: [] },
    '수목장': { rows: [] },
    '옵션': { rows: [] }
});

// 64. 진천군공설묘지
updateFacility(64, "진천", {
    '매장묘': {
        rows: [
            { name: "관내 거주자 (단장)", price: 327000, description: "30년 (15년 1회 연장 가능)", isRepresentative: true },
            { name: "관내 거주자 (합장)", price: 528000, description: "30년", isRepresentative: false },
            { name: "관외 거주자 (단장)", price: 425000, description: "30년", isRepresentative: false },
            { name: "관외 거주자 (합장)", price: 686000, description: "30년", isRepresentative: false }
        ]
    },
    '봉안당': { rows: [] },
    '수목장': { rows: [] },
    '옵션': { rows: [] }
});

// 65. (재)광주구천주교공원묘원
updateFacility(65, "광주구", {
    '매장묘': {
        rows: [
            { name: "묘지대", price: 1000000, description: "기본 묘지대", isRepresentative: true },
            { name: "매장비", price: 300000, description: "", isRepresentative: false },
            { name: "비석대", price: 400000, description: "와비", isRepresentative: false }
        ]
    },
    '봉안당': { rows: [] },
    '수목장': { rows: [] },
    '옵션': {
        rows: [
            { name: "관리비 (20년)", price: 400000, description: "20년 선납", isRepresentative: false },
            { name: "조경비", price: 200000, description: "", isRepresentative: false },
            { name: "조성비", price: 800000, description: "", isRepresentative: false }
        ]
    }
});

// 66. (재)개나리추모공원
updateFacility(66, "개나리", {
    '매장묘': {
        rows: [
            { name: "묘지 사용료 (3.3㎡)", price: 1066000, description: "3.3㎡ / 평", isRepresentative: true },
            { name: "단장형 (4단 묘테 세트)", price: 6448000, description: "둘레석, 3단오비, 상석, 향로, 화병 위", isRepresentative: false },
            { name: "합장형 (7단 묘테 세트)", price: 6219000, description: "둘레석, 피아노와비, 상석, 향로, 화병 위", isRepresentative: false }
        ]
    },
    '봉안당': { rows: [] },
    '수목장': { rows: [] },
    '옵션': {
        rows: [
            { name: "묘지 관리비", price: 15000, description: "3.3㎡ / 평 / 년", isRepresentative: false },
            { name: "묘지 석물료", price: 724000, description: "3.3㎡ / 평", isRepresentative: false }
        ]
    }
});

// 67. 금호동성당 천보묘원
updateFacility(67, "천보", {
    '매장묘': {
        rows: [
            { name: "관리비 (매장 3평)", price: 1350000, description: "45년 선납 (10,000원*3평*45년)", isRepresentative: true },
            { name: "관리비 (매장 6평)", price: 2700000, description: "45년 선납", isRepresentative: false }
        ]
    },
    '봉안당': {
        rows: [
            { name: "관리비 (납골)", price: 210000, description: "20년 선납", isRepresentative: true }
        ]
    },
    '수목장': { rows: [] },
    '옵션': {
        rows: [
            { name: "상석 (오석)", price: 484000, description: "가로 60cm...", isRepresentative: false },
            { name: "비석 (3평)", price: 616000, description: "가로 60cm...", isRepresentative: false },
            { name: "2단 사각 묘테 (합장)", price: 1617000, description: "가로 210cm...", isRepresentative: false }
        ]
    }
});

// Save all
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log("✅ 5 Facilities (63, 64, 65, 66, 67) have been bulk-updated to Gold Standard.");
