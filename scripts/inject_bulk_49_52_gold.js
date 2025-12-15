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

console.log("💎 Injecting Gold Standard Data for 49, 50, 51, 52...");

// 49. 천주교혜화동성당 포천묘원
updateFacility(49, "혜화", {
    '매장묘': {
        rows: [
            { name: "매장묘 사용료 (1평)", price: 1000000, description: "토지 사용료 (석물/관리비 별도)", isRepresentative: true }
        ]
    },
    '봉안당': { rows: [] },
    '수목장': { rows: [] },
    '옵션': {
        rows: [
            { name: "관리비 (1평)", price: 10000, description: "별도", isRepresentative: false },
            { name: "1단 단장 묘테석", price: 1100000, description: "석물", isRepresentative: false },
            { name: "비석", price: 880000, description: "석물", isRepresentative: false }
        ]
    }
});

// 50. 광주공원묘원
updateFacility(50, "광주", {
    '매장묘': {
        rows: [
            { name: "묘지 사용료 (3.3㎡)", price: 1895100, description: "토지 사용료 (관리비/석물 별도)", isRepresentative: true }
        ]
    },
    '봉안당': {
        rows: [
            { name: "봉안묘 2인 (석물)", price: 4032600, description: "석물 세트 (사용료 별도)", isRepresentative: true },
            { name: "봉안묘 4인 (석물)", price: 6103900, description: "석물 세트", isRepresentative: false },
            { name: "봉안 6인 (석물)", price: 7604300, description: "석물 세트", isRepresentative: false }
        ]
    },
    '수목장': { rows: [] },
    '옵션': {
        rows: [
            { name: "관리비 (3.3㎡/1년)", price: 15400, description: "별도", isRepresentative: false },
            { name: "단장묘 1단 묘테", price: 2156000, description: "석물", isRepresentative: false }
        ]
    }
});

// 51. 영모묘원
updateFacility(51, "영모", {
    '매장묘': {
        rows: [
            { name: "묘지 사용료 (상단/5㎡)", price: 1500000, description: "30년 사용 (관리비 별도)", isRepresentative: true },
            { name: "묘지 사용료 (하단/5㎡)", price: 2000000, description: "30년 사용", isRepresentative: false }
        ]
    },
    '봉안당': {
        rows: [
            { name: "봉안당 (10년)", price: 500000, description: "10년 선납", isRepresentative: true }
        ]
    },
    '수목장': {
        rows: [
            { name: "자연장 (영구)", price: 1500000, description: "기간 영구/관리비 없음", isRepresentative: true }
        ]
    },
    '옵션': {
        rows: [
            { name: "관리비 (30년선납)", price: 600000, description: "묘지 60만원/봉안당 50만원", isRepresentative: false },
            { name: "비석/석관", price: 200000, description: "각각", isRepresentative: false }
        ]
    }
});

// 52. 칠량자연공원묘원
updateFacility(52, "칠량", {
    '매장묘': {
        rows: [
            { name: "매장묘 (최장 60년)", price: 3000000, description: "1기당 26.4㎡ (토지)", isRepresentative: true },
            { name: "매장묘 (고급형)", price: 6000000, description: "1기당 26.4㎡", isRepresentative: false }
        ]
    },
    '봉안당': { // Bong-an dam included
        rows: [
            { name: "봉안담 (기간없음)", price: 800000, description: "1위 기준", isRepresentative: true },
            { name: "미래형 봉안묘", price: 3000000, description: "석실 봉안묘 등", isRepresentative: false }
        ]
    },
    '수목장': { rows: [] },
    '옵션': {
        rows: [] // No specific options visible in crop
    }
});

// Save all
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log("✅ 4 Facilities (49, 50, 51, 52) have been bulk-updated to Gold Standard.");
