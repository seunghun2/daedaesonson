const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../data/facilities.json');
const facilities = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));

function updateFacility(idNum, nameHint, pricingData) {
    let fIndex = facilities.findIndex(f => f.id === `park-000${idNum}`);
    if (fIndex === -1 && idNum < 100) fIndex = facilities.findIndex(f => f.id === `park-00${idNum}`);

    if (fIndex === -1) fIndex = facilities.findIndex(f => f.name.includes(nameHint));

    if (fIndex === -1) {
        console.error(`❌ Facility ID ${idNum} (${nameHint}) not found!`);
        return;
    }

    facilities[fIndex].pricing = pricingData;
    console.log(`✅ ID ${facilities[fIndex].id} (${facilities[fIndex].name}) FULLY CORRECTED.`);
}

console.log("💎 RE-Correcting Yesan (ID 7) with FULL DETAILS...");

// 7. 예산군추모공원 (전체 재입력)
updateFacility(7, "예산군", {
    '매장묘': {
        rows: [
            { name: "단장묘 사용료 (관내 3년↑)", price: 1419000, description: "사용료", isRepresentative: true },
            { name: "단장묘 관리비 (관내 3년↑)", price: 552000, description: "관리비", isRepresentative: false },
            { name: "단장묘 기타비용 (공통)", price: 2050000, description: "기타비용", isRepresentative: false },

            { name: "단장묘 사용료 (관내 3년↓)", price: 3618000, description: "관내 6개월~3년 미만", isRepresentative: false },
            { name: "단장묘 관리비 (관내 3년↓)", price: 1407000, description: "관리비", isRepresentative: false },

            { name: "단장묘 사용료 (관외)", price: 2623000, description: "예산군 이외 사망자", isRepresentative: false }
        ]
    },
    '봉안묘': { // 이미지상 '1회차1구', '가족봉안묘' 등
        rows: [
            { name: "1회차 1구 사용료 (관내 3년↑)", price: 2394000, description: "사용료", isRepresentative: true },
            { name: "1회차 1구 관리비 (관내 3년↑)", price: 930000, description: "관리비", isRepresentative: false },
            { name: "1회차 1구 기타비용", price: 2215000, description: "기타비용", isRepresentative: false },

            { name: "가족봉안묘 사용료 (관내 3년↑)", price: 2394000, description: "사용료", isRepresentative: false },
            { name: "가족봉안묘 관리비 (관내 3년↑)", price: 930000, description: "관리비", isRepresentative: false },
            { name: "가족봉안묘 기타비용", price: 5460000, description: "기타비용", isRepresentative: false },

            { name: "가족봉안묘 사용료 (관외)", price: 9481000, description: "사용료", isRepresentative: false },
            { name: "가족봉안묘 관리비 (관외)", price: 3879000, description: "관리비", isRepresentative: false }
        ]
    },
    '옵션': {
        rows: [
            { name: "조경비 (공통)", price: 30000, description: "각 묘역 공통 조경비", isRepresentative: false }
        ]
    }
});

// Save
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
