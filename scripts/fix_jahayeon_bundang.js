const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../data/facilities.json');
const facilities = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));

function updateFacility(idNum, nameHint, pricingData) {
    let fIndex = facilities.findIndex(f => f.id === `park-0${idNum}`);
    if (fIndex === -1 && nameHint) fIndex = facilities.findIndex(f => f.name.includes(nameHint));

    if (fIndex === -1) {
        console.error(`❌ Facility ID ${idNum} not found!`);
        return;
    }

    facilities[fIndex].pricing = pricingData;
    console.log(`✅ ID ${facilities[fIndex].id} (${facilities[fIndex].name}) updated.`);
}

console.log("💎 CORRECTING Jahayeon Bundang (ID 106)...");

// 1. (재)자하연분당(묘지) - ID 106 지정
updateFacility(106, "자하연분당", {
    '매장묘': {
        rows: [
            { name: "매장묘 분양묘 (1㎡)", price: 1007479, description: "사용료 (평당 약 330만원)", isRepresentative: true },
            { name: "371번지 신규조성 분양묘 (1㎡)", price: 1641528, description: "사용료 (평당 약 540만원)", isRepresentative: false }
        ]
    },
    '옵션': {
        rows: [
            { name: "연간 관리비 (1㎡)", price: 7563, description: "매년 납부", isRepresentative: false }
        ]
    }
});

// Save
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
