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
    console.log(`✅ ID ${idNum} (${facilities[fIndex].name}) RE-updated with FULL details.`);
}

console.log("💎 RE-Injecting Gold Standard Data (Full Details) for 63, 65, 66...");

// 63. 태백공원묘원 (특수/합장 옵션 추가)
updateFacility(63, "태백", {
    '매장묘': {
        rows: [
            { name: "단장 (일반)", price: 2273000, description: "매장 / 일반", isRepresentative: true },
            { name: "단장 (특수)", price: 2493000, description: "매장 / 특수", isRepresentative: false },
            { name: "단장 (기초수급자)", price: 1650000, description: "국가유공자/기초수급자", isRepresentative: false },
            { name: "합장 (일반)", price: 2844000, description: "매장 / 일반", isRepresentative: false },
            { name: "합장 (특수)", price: 3064000, description: "매장 / 특수", isRepresentative: false },
            { name: "합장 (기초수급자)", price: 2150000, description: "국가유공자/기초수급자", isRepresentative: false }
        ]
    },
    '봉안당': { rows: [] },
    '수목장': { rows: [] },
    '옵션': { rows: [] }
});

// 65. (재)광주구천주교공원묘원 (봉안묘 누락 수정)
updateFacility(65, "광주구", {
    '매장묘': {
        rows: [
            { name: "묘지대 (기본)", price: 1000000, description: "기본 묘지대", isRepresentative: true },
            { name: "매장비", price: 300000, description: "", isRepresentative: false },
            { name: "비석대 (와비)", price: 400000, description: "", isRepresentative: false },
            { name: "조경비", price: 200000, description: "", isRepresentative: false },
            { name: "조성비", price: 800000, description: "", isRepresentative: false }
        ]
    },
    '봉안묘': {
        rows: [
            { name: "봉안묘 1위형 (30년)", price: 4000000, description: "30년 사용료", isRepresentative: true },
            { name: "봉안묘 2위형 (30년)", price: 7000000, description: "30년 사용료", isRepresentative: false }
        ]
    },
    '봉안당': { rows: [] },
    '수목장': { rows: [] },
    '옵션': {
        rows: [
            { name: "관리비 (20년 선납)", price: 400000, description: "연 2만원 (20년분)", isRepresentative: false }
        ]
    }
});

// 66. (재)개나리추모공원 (모든 세트 포함)
updateFacility(66, "개나리", {
    '매장묘': {
        rows: [
            { name: "묘지 사용료 (3.3㎡)", price: 1066000, description: "1평당 사용료", isRepresentative: true },
            { name: "단장형 (7단 묘테 SET)", price: 4829000, description: "둘레석, 3단오비, 상석...", isRepresentative: false },
            { name: "단장형 (4단 묘테 SET)", price: 6448000, description: "둘레석, 3단오비, 상석...", isRepresentative: false },
            { name: "합장형 (7단 묘테 SET)", price: 6219000, description: "둘레석, 피아노와비, 상석...", isRepresentative: false },
            { name: "합장형 (4단 묘테 SET)", price: 9899000, description: "합장 최고급형", isRepresentative: false }
        ]
    },
    '봉안당': { rows: [] },
    '수목장': { rows: [] },
    '옵션': {
        rows: [
            { name: "묘지 관리비 (1년)", price: 15000, description: "3.3㎡당/1년", isRepresentative: false },
            { name: "묘지 석물료", price: 724000, description: "3.3㎡당", isRepresentative: false }
        ]
    }
});

// Save
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
