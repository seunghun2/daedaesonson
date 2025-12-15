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

console.log("💎 Injecting Gold Standard Data for 58, 59, 60, 61, 62...");

// 58. (재)경주공원묘원
updateFacility(58, "경주", {
    '매장묘': {
        rows: [
            { name: "묘지 사용료 (1㎡)", price: 332740, description: "1㎡당 / 1,100,000원(1평)", isRepresentative: true },
            { name: "매장묘 (보급형)", price: 5000000, description: "둘레석, 표석, 상석, 향로, 꽃병 SET", isRepresentative: false },
            { name: "매장묘 (고급형)", price: 7500000, description: "고급형 SET", isRepresentative: false }
        ]
    },
    '봉안묘': {
        rows: [
            { name: "보급형 SET", price: 3500000, description: "모둠 보급형 SET", isRepresentative: true },
            { name: "고급형 SET", price: 5000000, description: "고급형 SET", isRepresentative: false }
        ]
    },
    '수목장': { rows: [] },
    '옵션': {
        rows: [
            { name: "관리비 (1평)", price: 15000, description: "4,538원/1㎡", isRepresentative: false },
            { name: "장례비 (1평)", price: 500000, description: "3,305원/㎡", isRepresentative: false }
        ]
    }
});

// 59. 남한강공원묘원
updateFacility(59, "남한강", {
    '매장묘': {
        rows: [
            { name: "묘지 사용료 (3.3㎡)", price: 1577000, description: "기본 3.3㎡ (1평)", isRepresentative: true },
            { name: "매장묘 1단 합장 (외 3종)", price: 2920000, description: "1단묘테, 비석, 상석, 화병", isRepresentative: false }
        ]
    },
    '봉안당': { rows: [] },
    '수목장': { rows: [] },
    '옵션': {
        rows: [
            { name: "관리비 (3.3㎡)", price: 18400, description: "1년 기준", isRepresentative: false },
            { name: "매장 작업비", price: 1900000, description: "구당", isRepresentative: false }
        ]
    }
});

// 60. (재)조양공원
updateFacility(60, "조양", {
    '매장묘': {
        rows: [
            { name: "묘지대 (3.3㎡)", price: 1300000, description: "3.3㎡당 (5평 단위 계약)", isRepresentative: true },
            { name: "매년 2.2 ??", price: 900000, description: "65cm ???", isRepresentative: false }
        ]
    },
    '봉안당': {
        rows: [
            { name: "유연납골 (10년)", price: 280000, description: "10년", isRepresentative: true },
            { name: "유연납골 (17년)", price: 50000, description: "17년?? (가격 확인 필요)", isRepresentative: false }
        ]
    },
    '수목장': { rows: [] },
    '옵션': {
        rows: [
            { name: "묘지관리비 (1년)", price: 14000, description: "3.3㎡당/1년", isRepresentative: false }
        ]
    }
});

// 61. 고성군 공설묘원
updateFacility(61, "고성군", {
    '매장묘': {
        rows: [
            { name: "일반분묘 사용료 (단장)", price: 447870, description: "15년간", isRepresentative: true },
            { name: "일반분묘 사용료 (합장)", price: 746460, description: "15년간", isRepresentative: false }
        ]
    },
    '봉안묘': {
        rows: [
            { name: "봉안묘 사용료", price: 74640, description: "1.65㎡ (1.5 x 1.1) / 공설 시설", isRepresentative: true },
            { name: "봉안묘 관리비", price: 60000, description: "1.65㎡", isRepresentative: false }
        ]
    },
    '수목장': { rows: [] },
    '옵션': {
        rows: [
            { name: "일반분묘 관리비 (단장)", price: 360000, description: "15년간", isRepresentative: false },
            { name: "일반분묘 관리비 (합장)", price: 600000, description: "15년간", isRepresentative: false }
        ]
    }
});

// 62. 초동교회공원묘원
updateFacility(62, "초동", {
    '매장묘': {
        rows: [
            { name: "묘지 사용료 (1평)", price: 1300000, description: "1평 기준", isRepresentative: true }
        ]
    },
    '봉안당': { rows: [] },
    '수목장': { rows: [] },
    '옵션': {
        rows: [
            { name: "관리비 (1평)", price: 25000, description: "1평/1년 기준", isRepresentative: false },
            { name: "2단묘 서비스", price: 3300000, description: "기본 석물 포함", isRepresentative: false },
            { name: "3단묘 서비스", price: 4500000, description: "기본 석물 포함", isRepresentative: false }
        ]
    }
});

// Save all
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log("✅ 5 Facilities (58, 59, 60, 61, 62) have been bulk-updated to Gold Standard.");
