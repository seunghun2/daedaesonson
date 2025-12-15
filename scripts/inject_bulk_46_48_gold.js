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

console.log("💎 Injecting Gold Standard Data for 46(Donghwa), 47(Yangyang), 48(Daejeong)...");

// 46. 동화경모공원
updateFacility(46, "동화", {
    '매장묘': {
        rows: [
            { name: "묘지사용료 (평당)", price: 1333333, description: "토지 사용료 (석물/매장비 별도)", isRepresentative: true },
            { name: "매장료 (1건)", price: 1100000, description: "작업비", isRepresentative: false }
        ]
    },
    '봉안당': { rows: [] },
    '수목장': { rows: [] },
    '옵션': {
        rows: [
            { name: "묘지관리비 (평당)", price: 124670, description: "별도", isRepresentative: false },
            { name: "석물세트비", price: 1980000, description: "대리석 등", isRepresentative: false },
            { name: "6기 석실", price: 1500000, description: "대리석", isRepresentative: false }
        ]
    }
});

// 47. 양양군공설묘원
updateFacility(47, "양양", {
    '매장묘': {
        rows: [
            { name: "단장묘 사용료", price: 359440, description: "토지 사용료 (관리비 별도)", isRepresentative: true },
            { name: "합장묘 사용료", price: 527170, description: "토지 사용료 (관리비 별도)", isRepresentative: false }
        ]
    },
    '봉안당': { rows: [] },
    '수목장': { rows: [] },
    '옵션': {
        rows: [
            { name: "단장묘 관리비", price: 240000, description: "별도", isRepresentative: false },
            { name: "합장묘 관리비", price: 360000, description: "별도", isRepresentative: false }
        ]
    }
});

// 48. 대정공원묘원
updateFacility(48, "대정", {
    '매장묘': {
        rows: [
            { name: "묘지사용료 (1평)", price: 700000, description: "토지 사용료 (작업비/석물 별도)", isRepresentative: true },
            { name: "매장작업비 (1기)", price: 1700000, description: "작업비", isRepresentative: false }
        ]
    },
    '봉안당': { rows: [] },
    '수목장': { rows: [] },
    '옵션': {
        rows: [
            { name: "묘지관리비 (1평)", price: 16000, description: "1년", isRepresentative: false },
            { name: "오석비석", price: 2420000, description: "석물", isRepresentative: false },
            { name: "둘레석 (1단)", price: 1320000, description: "석물", isRepresentative: false }
        ]
    }
});

// Save all
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log("✅ 3 Facilities (46, 47, 48) have been bulk-updated to Gold Standard.");
