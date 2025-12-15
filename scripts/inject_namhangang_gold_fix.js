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
    console.log(`✅ ID ${idNum} (${facilities[fIndex].name}) updated with FULL details.`);
}

console.log("💎 Updating Namhangang (ID 59) with full details...");

// 59. 남한강공원묘원 (상세 업데이트)
updateFacility(59, "남한강", {
    '매장묘': {
        rows: [
            { name: "묘지 사용료 (3.3㎡)", price: 1577000, description: "기본 3.3㎡ (1평) 토지 사용료", isRepresentative: true },
            { name: "석물 SET (1단 합장)", price: 2920000, description: "1단묘테, 비석, 상석, 화병", isRepresentative: false },
            { name: "석물 SET (3단 소)", price: 4320000, description: "3단묘테, 비석, 상석, 화병", isRepresentative: false },
            { name: "석물 SET (3단 선)", price: 5240000, description: "3단묘테, 비석, 상석, 화병", isRepresentative: false },
            { name: "석물 SET (3단 본)", price: 6030000, description: "3단묘테, 비석, 상석, 화병", isRepresentative: false },
            { name: "석물 SET (3단 특)", price: 6280000, description: "3단묘테, 비석, 상석, 화병", isRepresentative: false }
        ]
    },
    '봉안당': { rows: [] },
    '수목장': { rows: [] },
    '옵션': {
        rows: [
            { name: "연간 관리비 (3.3㎡)", price: 18400, description: "1년 기준", isRepresentative: false },
            { name: "매장 작업비", price: 1900000, description: "구당 작업비", isRepresentative: false }
        ]
    }
});

// Save
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
