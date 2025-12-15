const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../data/facilities.json');
const facilities = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));

function updateFacility(idNum, nameHint, pricingData) {
    let fIndex = facilities.findIndex(f => f.id === `park-000${idNum}`);
    if (fIndex === -1 && idNum < 100) fIndex = facilities.findIndex(f => f.id === `park-00${idNum}`);

    // ID 매칭 실패 시 이름으로 재검색
    if (fIndex === -1 && nameHint) {
        fIndex = facilities.findIndex(f => f.name.includes(nameHint));
    }

    if (fIndex === -1) {
        console.error(`❌ Facility ID ${idNum} not found!`);
        return;
    }

    facilities[fIndex].pricing = pricingData;
    console.log(`✅ ID ${facilities[fIndex].id} (${facilities[fIndex].name}) RE-updated with LOGICAL pricing structure.`);
}

console.log("💎 RE-Injecting Gold Standard Data for Gwangneung (ID 91) with NEW Logic...");

// 91. 광릉 더 크레스트 묘지 (정가 기준 수정)
updateFacility(91, "광릉", {
    '매장묘': {
        rows: [
            { name: "매장묘 사용료 (1평/정가)", price: 1700000, description: "정가 170만원 (감면 시 실납부 515,152원)", isRepresentative: true }
        ]
    },
    '봉안묘': { // 이미지상 '봉안당' 항목 (표 상단 가격 8,477,000원)
        rows: [
            { name: "봉안당 (1기/정가)", price: 8477000, description: "정가 기준 (조건부 별도 문의)", isRepresentative: false }
        ]
    },
    '수목장': { // 이미지상 '자연장'
        rows: [
            { name: "자연장 사용료 (1기/정가)", price: 2305000, description: "정가 230만원 (감면 시 0원 가능)", isRepresentative: true }
        ]
    },
    '옵션': {
        rows: [
            { name: "1년 관리비 (1평)", price: 19500, description: "정가 19,500원 (실납부 5,910원)", isRepresentative: false },
            { name: "자연장 관리비 (1기/정가)", price: 34700, description: "정가 34,700원 (조건부 0원)", isRepresentative: false },
            { name: "봉안당 관리비 (1기)", price: 84200, description: "정가 84,200원", isRepresentative: false }
        ]
    }
});

// Save
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
