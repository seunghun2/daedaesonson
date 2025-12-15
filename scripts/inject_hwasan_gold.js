const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../data/facilities.json');

console.log("💎 Injecting Gold Standard Data for Hwasan (화산)...");

const facilities = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));

// Find "화산"
let fIndex = facilities.findIndex(f => f.name.includes("화산"));

if (fIndex === -1 && facilities[11]) {
    // Try park-0012 (Array index 11 is usually ID 12)
    fIndex = facilities.findIndex(f => f.id === 'park-0012');
}

if (fIndex === -1) {
    console.error("❌ Facility (화산/ID 12) not found!");
    process.exit(1);
}

const target = facilities[fIndex];
console.log(`Found Hwasan at ID: ${target.id} (${target.name})`);

const perfectPricing = {
    '매장묘': {
        rows: [
            {
                name: "단장묘 (공설 기본형)",
                price: 4500000,
                description: "1.5평 (19.8㎡) 기준 매장비",
                isRepresentative: true // 450만원부터
            },
            {
                name: "합장묘 / 확장형 사용료",
                price: 79000000,
                description: "별도 고가 사용료 (선택 항목)",
                isRepresentative: false
            }
        ]
    },
    '봉안당': {
        rows: [
            {
                name: "봉안묘 (기본형)",
                price: 2500000,
                description: "평형 선택 가능 (3평 ~ 15평)",
                isRepresentative: true // 250만원부터
            },
            {
                name: "봉안묘 (중대형)",
                price: 39500000,
                description: "중대형 평수 사용료",
                isRepresentative: false
            },
            {
                name: "봉안묘 (대형)",
                price: 79000000,
                description: "대형 평수 사용료",
                isRepresentative: false
            },
            {
                name: "봉안묘 (초대형)",
                price: 131800000,
                description: "초대형 평수 사용료",
                isRepresentative: false
            }
        ]
    },
    '수목장': {
        rows: [
            {
                name: "수목장 상품 없음",
                price: 0,
                description: "확정 가능한 실사용 상품 없음",
                isRepresentative: false
            }
        ]
    },
    '옵션': {
        rows: [
            // Management Fees (High amounts here, clearly separated)
            { name: "합장묘 관리비", price: 26000000, description: "별도 관리비", isRepresentative: false },
            { name: "봉안묘 관리비", price: 8600000, description: "최소 860만원부터 (평형별 상이)", isRepresentative: false },

            // Stone / Etc
            { name: "석물 비용 (봉분/단장/합장)", price: 0, description: "별도 문의 (크기/종류에 따라 다름)", isRepresentative: false }
        ]
    }
};

target.pricing = perfectPricing;

// Save
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log("✅ Hwasan (화산) Data has been reset to the Gold Standard.");
console.log(JSON.stringify(perfectPricing, null, 2));
