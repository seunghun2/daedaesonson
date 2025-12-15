const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../data/facilities.json');

console.log("💎 Injecting Gold Standard Data for Hamyang Sky (함양하늘공원)...");

const facilities = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));

// Find "함양하늘공원"
let fIndex = facilities.findIndex(f => f.name.includes("함양하늘공원"));

if (fIndex === -1 && facilities[22]) {
    // Try park-0023
    fIndex = facilities.findIndex(f => f.id === 'park-0023');
}

if (fIndex === -1) {
    console.error("❌ Facility (함양하늘공원/ID 23) not found!");
    process.exit(1);
}

const target = facilities[fIndex];
console.log(`Found Hamyang Sky at ID: ${target.id} (${target.name})`);

const perfectPricing = {
    '매장묘': {
        rows: [
            // Standard Burial (Land + Construction + Burial Fee)
            {
                name: "매장묘 필수 합계",
                price: 10600000,
                description: "토지(650)+조성(300)+안장(110) 포함",
                isRepresentative: true // 1,060만원부터
            },

            // Pyeongjang (Flat Burial) - Lowest Entry
            {
                name: "평장묘 필수 합계",
                price: 3370000,
                description: "토지(127)+조성(160)+안장(50) 포함",
                isRepresentative: true // 337만원부터 (평장 카테고리 대표로 쓰거나, 매장묘 하위로 둘지 고민이지만, 요청대로 '평장'을 별도 대표메뉴로 쓰려면 여기서는 false하고 UI에서 빼거나, 카테고리 분리)
                // Wait, your structure supports '평장' as a separate category if I make it one, but standard is 매장/봉안/수목.
                // I will put it under '매장묘' but clearly marked, or create '평장묘' key if UI supports it.
                // Based on previous 22 facilities, usually we group Pyeongjang under Burial(매장) unless specifically directed.
                // Request says: "평장 337만원부터". I will separate it visually if possible, or include in Burial list.
                // Actually, let's keep it in "매장묘" list but clearly distinguished. The UI Summary box picks representatives regardless of category.
            }
        ]
    },
    '수목장': {
        rows: [
            {
                name: "수목장 필수 합계",
                price: 6900000,
                description: "토지(380)+조성(260)+안장(50) 포함",
                isRepresentative: true // 690만원부터
            }
        ]
    },
    '봉안당': {
        rows: []
    },
    '옵션': { // Breakdown & Management Fees
        rows: [
            // Management Fees
            { name: "연간 관리비 (매장)", price: 130000, description: "1년 기준", isRepresentative: false },
            { name: "연간 관리비 (평장)", price: 43000, description: "1년 기준", isRepresentative: false },
            { name: "연간 관리비 (수목장)", price: 100000, description: "1년 기준", isRepresentative: false },

            // Breakdown (For transparency)
            { name: "[참고] 매장 토지사용료", price: 6500000, description: "필수 합계에 포함됨", isRepresentative: false },
            { name: "[참고] 매장 조성비", price: 3000000, description: "필수 합계에 포함됨", isRepresentative: false },
            { name: "[참고] 평장 토지사용료", price: 1270000, description: "필수 합계에 포함됨", isRepresentative: false },
            { name: "[참고] 평장 조성비", price: 1600000, description: "필수 합계에 포함됨", isRepresentative: false }
        ]
    }
};

target.pricing = perfectPricing;

// Save
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log("✅ Hamyang Sky (함양하늘공원) Data has been reset to the Gold Standard.");
console.log(JSON.stringify(perfectPricing, null, 2));
