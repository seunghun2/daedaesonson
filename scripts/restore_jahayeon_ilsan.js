const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../data/facilities.json');
const facilities = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));

function updateFacility(idNum, nameHint, pricingData) {
    let fIndex = facilities.findIndex(f => f.id === `park-00${idNum}`);
    if (fIndex === -1 && nameHint) fIndex = facilities.findIndex(f => f.name.includes(nameHint));

    if (fIndex === -1) {
        console.error(`❌ Facility ID ${idNum} not found!`);
        return;
    }

    facilities[fIndex].pricing = pricingData;
    console.log(`✅ ID ${facilities[fIndex].id} (${facilities[fIndex].name}) RESTORED to original.`);
}

console.log("💎 RESTORING Jahayeon Ilsan (ID 14)...");

// 14. (재)자하연 일산
updateFacility(14, "자하연 일산", {
    '봉안묘': {
        rows: [
            { name: "봉안묘 (2위형)", price: 14500000, description: "사용료 900만원 + 석물비 550만원", isRepresentative: true },
            { name: "봉안묘 2기 담장형", price: 17500000, description: "사용료 900만원 + 석물비 850만원", isRepresentative: false },
            { name: "평장 4위 자연장 (A형)", price: 15000000, description: "사용료 850만원 + 석물비 650만원", isRepresentative: false }
        ]
    },
    '봉안당': { // 봉안담 (야외 벽체형)
        rows: [
            { name: "봉안담 개인단 (1단)", price: 2500000, description: "사용료 200만원 + 관리비 별도", isRepresentative: false },
            { name: "봉안담 개인단 (5단)", price: 4500000, description: "로열단 (사용료 400만원)", isRepresentative: false },
            { name: "봉안담 부부단 (1단)", price: 4000000, description: "부부형", isRepresentative: false }
        ]
    },
    '매장묘': {
        rows: [
            { name: "매장묘 (합장)", price: 19500000, description: "사용료 및 석물비 포함 추정", isRepresentative: false }
        ]
    },
    '옵션': {
        rows: [
            { name: "1년 관리비", price: 27000, description: "평장/봉안묘 (추정)", isRepresentative: false }
        ]
    }
});

// Save
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
