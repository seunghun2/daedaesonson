const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../data/facilities.json');
const facilities = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));

function updateFacility(idNum, nameHint, pricingData) {
    let fIndex = facilities.findIndex(f => f.id === `park-000${idNum}`);
    if (fIndex === -1 && idNum < 100) fIndex = facilities.findIndex(f => f.id === `park-00${idNum}`); // park-0007 형식 주의

    if (fIndex === -1) fIndex = facilities.findIndex(f => f.name.includes(nameHint));

    if (fIndex === -1) {
        console.error(`❌ Facility ID ${idNum} (${nameHint}) not found!`);
        return;
    }

    facilities[fIndex].pricing = pricingData;
    console.log(`✅ ID ${facilities[fIndex].id} (${facilities[fIndex].name}) corrected.`);
}

console.log("💎 Correcting Yesan (ID 7) Gold Standard Data...");

// 7. 예산군추모공원 (금액 수정: 0 하나 제거)
updateFacility(7, "예산군", {
    '매장묘': {
        rows: [
            { name: "단장묘 사용료 (관내)", price: 1419000, description: "3년 이상 거주자 (1기)", isRepresentative: true },
            { name: "단장묘 사용료 (6개월~3년)", price: 3618000, description: "관내 단기 거주자", isRepresentative: false },
            { name: "1회차 1구 사용료 (관내)", price: 2394000, description: "3년 이상 거주", isRepresentative: false },
            { name: "1회차 1구 사용료 (관외)", price: 6103000, description: "관외 거주자 등", isRepresentative: false }
        ]
    },
    '봉안묘': {
        rows: [
            { name: "가족봉안묘 사용료 (관내)", price: 2394000, description: "3년 이상 거주", isRepresentative: true },
            { name: "가족봉안묘 사용료 (관외)", price: 9481000, description: "관외 거주자", isRepresentative: false }
        ]
    },
    '수목장': { rows: [] },
    '옵션': {
        rows: [
            { name: "단장묘 관리비 (관내)", price: 552000, description: "3년 이상 거주", isRepresentative: false },
            { name: "단장묘 관리비 (6개월~3년)", price: 1407000, description: "관내 단기", isRepresentative: false },
            { name: "가족봉안묘 관리비 (관내)", price: 930000, description: "3년 이상", isRepresentative: false },
            { name: "가족봉안묘 관리비 (관외)", price: 3879000, description: "관외", isRepresentative: false },
            { name: "단장묘 기타비용", price: 2050000, description: "필수 기타 비용", isRepresentative: false },
            { name: "가족봉안묘 기타비용", price: 5460000, description: "필수 기타 비용", isRepresentative: false }
        ]
    }
});

// Save
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
