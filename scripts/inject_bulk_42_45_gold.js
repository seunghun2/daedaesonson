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

console.log("💎 Injecting Gold Standard Data for 42(Byeol), 43(Gyeongmaek), 44(Hannam), 45(Chungju)...");

// 42. 별그리다
updateFacility(42, "별그리다", {
    '매장묘': {
        rows: [
            { name: "토지사용료 (10㎡)", price: 10000000, description: "단장형 (석물 1,540만원 별도)", isRepresentative: true },
            { name: "토지사용료 (15㎡)", price: 15000000, description: "합장형 (석물 1,980만원 별도)", isRepresentative: false },
            { name: "토지사용료 (THE PROUD 10㎡)", price: 13000000, description: "프리미엄 (석물 별도)", isRepresentative: false }
        ]
    },
    '봉안당': { rows: [] },
    '수목장': { rows: [] },
    '옵션': {
        rows: [
            { name: "석물설치비 (단장형)", price: 15400000, description: "필수", isRepresentative: false },
            { name: "석물설치비 (합장형)", price: 19800000, description: "필수", isRepresentative: false },
            { name: "관리비 (단장형/1년)", price: 260000, description: "별도", isRepresentative: false }
        ]
    }
});

// 43. 경맥백합공원
updateFacility(43, "경맥", {
    '매장묘': {
        rows: [
            { name: "묘지사용료 (1㎡)", price: 303000, description: "토지사용료 (평당 약 100만원)", isRepresentative: true },
            { name: "평장형 납골묘 (2기/기본)", price: 1650000, description: "석물비 (사용료 별도)", isRepresentative: false }
        ]
    },
    '봉안당': {
        rows: [
            { name: "평장형 납골묘 (2기/기본)", price: 1650000, description: "석물비 (사용료 별도)", isRepresentative: true },
            { name: "납골분묘 (2기형)", price: 3700000, description: "석물비", isRepresentative: false },
            { name: "납골분묘 (4기형)", price: 6200000, description: "석물비", isRepresentative: false }
        ]
    },
    '수목장': { rows: [] },
    '옵션': {
        rows: [
            { name: "관리비 (1㎡/년)", price: 4500, description: "별도", isRepresentative: false }
        ]
    }
});

// 44. 한남공원묘원
updateFacility(44, "한남", {
    '매장묘': {
        rows: [
            { name: "매장묘 사용료 (1㎡)", price: 581190, description: "토지 사용료 (평당 약 191만원)", isRepresentative: true },
            { name: "1단묘테 합장용 (석물)", price: 2880000, description: "석물비", isRepresentative: false }
        ]
    },
    '봉안당': { // Bong-an tombs
        rows: [
            { name: "봉안묘 2위형", price: 3000000, description: "석물비 (사용료 별도)", isRepresentative: true },
            { name: "봉안묘 4위형", price: 3500000, description: "석물비", isRepresentative: false },
            { name: "봉안묘 8위형", price: 5000000, description: "석물비", isRepresentative: false }
        ]
    },
    '수목장': { rows: [] },
    '옵션': {
        rows: [
            { name: "연간 관리비 (1㎡)", price: 5660, description: "별도", isRepresentative: false }
        ]
    }
});

// 45. 충주공원묘원
updateFacility(45, "충주", {
    '매장묘': {
        rows: [
            { name: "묘지 사용료 (평당)", price: 650000, description: "토지 사용료 (석물/작업비 별도)", isRepresentative: true },
            { name: "매장비 (일반)", price: 1400000, description: "작업비", isRepresentative: false }
        ]
    },
    '봉안당': { rows: [] },
    '수목장': { rows: [] },
    '옵션': {
        rows: [
            { name: "관리비 (평당/년)", price: 12000, description: "5년분 부과", isRepresentative: false },
            { name: "묘테석", price: 880000, description: "석물", isRepresentative: false },
            { name: "상석", price: 880000, description: "석물", isRepresentative: false }
        ]
    }
});

// Save all
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log("✅ 4 Facilities (42, 43, 44, 45) have been bulk-updated to Gold Standard.");
