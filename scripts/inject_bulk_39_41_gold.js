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

console.log("💎 Injecting Gold Standard Data for 39(Seokgye), 40(Yeongnak), 41(Jahayeon)...");

// 39. 석계공원묘원
updateFacility(39, "석계", {
    '매장묘': {
        rows: [
            { name: "묘지 사용료 (평당)", price: 1350000, description: "토지 사용료 (관리비/석물/작업비 별도)", isRepresentative: true },
            { name: "1.5평 매장묘 (기본형 set)", price: 4400000, description: "세트상품 (토지포함여부 문의)", isRepresentative: false },
            { name: "3평 매장묘 (고급형 set)", price: 7700000, description: "세트상품", isRepresentative: false }
        ]
    },
    '봉안당': {
        rows: [
            { name: "평장형 납골묘 (2기/기본)", price: 3850000, description: "2기 기본형", isRepresentative: true },
            { name: "평장형 납골묘 (2기/고급)", price: 6500000, description: "2기 고급형", isRepresentative: false },
            { name: "가족 납골묘 (4기)", price: 8250000, description: "4기 기본형", isRepresentative: false },
            { name: "가족 납골묘 (12기)", price: 18700000, description: "12기", isRepresentative: false }
        ]
    },
    '수목장': { rows: [] },
    '옵션': {
        rows: [
            { name: "년간 관리비 (평당)", price: 20000, description: "1년 기준", isRepresentative: false },
            { name: "개장정리비 (1.5평)", price: 400000, description: "이장 시", isRepresentative: false }
        ]
    }
});

// 40. 영락공원묘원
updateFacility(40, "영락", {
    '매장묘': {
        rows: [
            { name: "묘지 사용료 (1평)", price: 350000, description: "토지 사용료 (관리비/석물 별도)", isRepresentative: true },
            { name: "2평 둘레석 (석물)", price: 1600000, description: "석물비", isRepresentative: false },
            { name: "3평 둘레석 (석물)", price: 2000000, description: "석물비", isRepresentative: false }
        ]
    },
    '봉안당': { rows: [] },
    '수목장': { rows: [] },
    '옵션': {
        rows: [
            { name: "관리비 (1평/년)", price: 11000, description: "1년", isRepresentative: false },
            { name: "작업비 (1기)", price: 500000, description: "1회", isRepresentative: false },
            { name: "각자대 (1기)", price: 100000, description: "글자", isRepresentative: false }
        ]
    }
});

// 41. 자하연포천
updateFacility(41, "자하연", {
    '매장묘': {
        rows: [
            { name: "매장묘 사용료 (평당)", price: 1500000, description: "토지 사용료 (관리비/석물 별도)", isRepresentative: true }
        ]
    },
    '봉안당': { // Corrected from image
        rows: [
            { name: "봉안묘 1위", price: 3000000, description: "본체+비석+상석+화병+조립비", isRepresentative: true },
            { name: "봉안묘 2위", price: 8500000, description: "본체+비석+상석+화병+조립비", isRepresentative: false },
            { name: "봉안묘 4위", price: 13500000, description: "본체+비석+상석+화병+조립비", isRepresentative: false },
            { name: "봉안묘 8위 (와형)", price: 10420000, description: "본체+비석+상석+화병+조립비", isRepresentative: false }
        ]
    },
    '묘지이장': { // Image mentions "합장묘(기존)"
        rows: [
            { name: "합장묘 (기존/작업포함)", price: 30000000, description: "묘테+비석+상석+작업비", isRepresentative: false }
        ]
    },
    '수목장': { rows: [] },
    '옵션': {
        rows: [
            { name: "관리비 (평당/년)", price: 25000, description: "1년", isRepresentative: false }
        ]
    }
});

// Save all
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log("✅ 3 Facilities (39, 40, 41) have been bulk-updated to Gold Standard.");
