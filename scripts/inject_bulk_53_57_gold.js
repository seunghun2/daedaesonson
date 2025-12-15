const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../data/facilities.json');
const facilities = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));

function updateFacility(idNum, nameHint, pricingData) {
    let fIndex = facilities.findIndex(f => f.id === `park-00${idNum}`);
    if (fIndex === -1) {
        fIndex = facilities.findIndex(f => f.name.includes(nameHint));
    }
    if (fIndex === -1 && facilities[idNum]) fIndex = idNum;

    if (fIndex === -1 || !facilities[fIndex]) {
        console.error(`❌ Facility ID ${idNum} (${nameHint}) not found!`);
        return;
    }

    facilities[fIndex].pricing = pricingData;
    console.log(`✅ ID ${idNum} (${facilities[fIndex].name}) updated.`);
}

console.log("💎 Injecting Gold Standard Data for 53, 54, 55, 56, 57...");

// 53. 복항공원묘지
updateFacility(53, "복항", {
    '매장묘': {
        rows: [
            { name: "매장 사용료 (평당)", price: 840400, description: "토지 사용료 (석물 별도)", isRepresentative: true }
        ]
    },
    '봉안당': { rows: [] },
    '수목장': { rows: [] },
    '옵션': {
        rows: [
            { name: "연간 관리비 (평당)", price: 15200, description: "1년", isRepresentative: false },
            { name: "상석", price: 705000, description: "석물", isRepresentative: false },
            { name: "오석", price: 925000, description: "석물", isRepresentative: false },
            { name: "둘레석", price: 1145000, description: "석물", isRepresentative: false }
        ]
    }
});

// 54. 우성공원묘원
updateFacility(54, "우성", {
    '매장묘': { rows: [] },
    '봉안당': {
        rows: [
            { name: "일반실 봉안묘 (개인)", price: 4940000, description: "게인 기준", isRepresentative: true },
            { name: "고급실 봉안묘 (개인)", price: 7280000, description: "게인", isRepresentative: false },
            { name: "일반실 봉안묘 (부부)", price: 9510000, description: "2인", isRepresentative: false },
            { name: "고급실 봉안묘 (부부)", price: 15210000, description: "2인", isRepresentative: false }
        ]
    },
    '수목장': { rows: [] },
    '옵션': {
        rows: [
            { name: "고급실 부부 관리비 (1년)", price: 92000, description: "연간", isRepresentative: false },
            { name: "일반실 개인 관리비 (1년)", price: 51000, description: "연간", isRepresentative: false }
        ]
    }
});

// 55. 동해시하늘정원묘지
updateFacility(55, "동해", {
    '매장묘': { rows: [] },
    '봉안당': {
        rows: [
            { name: "공설묘원 사용료 (단창)", price: 660000, description: "이용기간 동해시·묘해시·사용기간 15년", isRepresentative: true },
            { name: "공설묘원 관리비 (단창)", price: 240000, description: "15년", isRepresentative: false },
            { name: "석물 매장비 (단창/등급)", price: 360000, description: "석물", isRepresentative: false }
        ]
    },
    '수목장': { rows: [] },
    '옵션': { rows: [] }
});

// 56. 용인공원묘원
updateFacility(56, "용인공원", {
    '매장묘': { rows: [] },
    '봉안당': {
        rows: [
            { name: "봉안묘 (정명지)", price: 2620000, description: "대한 장기묘소 사용금액", isRepresentative: true }
        ]
    },
    '수목장': {
        rows: [
            { name: "수목장 매장지", price: 3180000, description: "대한 장기묘소 사용금액", isRepresentative: true },
            { name: "수목장 천명지", price: 5340000, description: "대한 장기묘소 사용금액", isRepresentative: false },
            { name: "수목장 봉안묘", price: 4170000, description: "대한 장기묘소 사용금액", isRepresentative: false }
        ]
    },
    '옵션': {
        rows: [
            { name: "일반묘지 관리비 (1년)", price: 25000, description: "연간", isRepresentative: false },
            { name: "초경지 관리비 (1년)", price: 25000, description: "조경묘지 대한 부당 주기 조경관리비 경구", isRepresentative: false }
        ]
    }
});

// 57. 함안군공설추모공원
updateFacility(57, "함안", {
    '매장묘': { rows: [] },
    '봉안당': { rows: [] },
    '수목장': {
        rows: [
            { name: "수목장 평장 사용료 (관내)", price: 270000, description: "단장 주모공원 평장 사용료 1기당 최초 1년", isRepresentative: true },
            { name: "수목장 평장 사용료 (관외)", price: 1000000, description: "관외 기준", isRepresentative: false },
            { name: "수목장 평장 관리비 (관내)", price: 100000, description: "단장 주모공원 평장 관리비 관내 1년 1건 최초", isRepresentative: false }
        ]
    },
    '옵션': {
        rows: [
            { name: "타상-주모공원 평장 사용료 (관내+관외)", price: 420000, description: "1기당 최초 1년", isRepresentative: false },
            { name: "타상-주모공원 평장 관리비 (관내+관외)", price: 200000, description: "1년", isRepresentative: false }
        ]
    }
});

// Save all
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log("✅ 5 Facilities (53, 54, 55, 56, 57) have been bulk-updated to Gold Standard.");
