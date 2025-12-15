const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../data/facilities.json');

console.log("💎 Injecting Gold Standard Data for ID 3 (Daedong)...");

const facilities = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));
// ID 3 check. Assuming standard format or searching by keyword if needed, but ID 3 should be park-0003
// Let's find it safely.
let fIndex = facilities.findIndex(f => f.id === 'park-0003');

if (fIndex === -1) {
    const found = facilities.find(f => f.name.includes("대동"));
    if (!found) {
        console.error("❌ Facility park-0003 (대동) not found!");
        process.exit(1);
    }
    console.log(`Found Daedong at ID: ${found.id}`);
    fIndex = facilities.indexOf(found);
}

const target = facilities[fIndex];

// The "Perfect" Data provided by User for ID 3
const perfectPricing = {
    '매장묘': {
        rows: [
            {
                name: "시설물 위 평장세트 (1위)",
                price: 2500000,
                description: "개인 단위 기본 평장형 매장",
                isRepresentative: true // "250만원부터" logic source
            },
            {
                name: "시설물 가족 평장형 (1~2위)",
                price: 7000000,
                description: "가족 단위 기본형",
                isRepresentative: false
            },
            {
                name: "시설물 가족 평장형 (상위형)",
                price: 9600000,
                description: "공간 확장형 가족 매장",
                isRepresentative: false
            },
            {
                name: "시설물 위 조각 매장세트 (6위)",
                price: 10900000,
                description: "조각 시설 포함 매장형",
                isRepresentative: false
            },
            {
                name: "시설물 가족 평장형 (프리미엄)",
                price: 12200000,
                description: "가족 단위 프리미엄 구성",
                isRepresentative: false
            }
        ]
    },
    '봉안당': { // User said "봉안묘" but grouped under 봉안당 concept usually
        rows: [
            {
                name: "시설물 부부 봉안묘",
                price: 4200000,
                description: "부부 기준 봉안당 기본형",
                isRepresentative: true // "420만원부터" logic source
            }
        ]
    },
    '옵션': {
        rows: [
            // Work Fees
            { name: "매장작업비 (화장)", price: 550000, description: "1기 기준", isRepresentative: false },
            { name: "가묘 매장작업비 (화장)", price: 600000, description: "", isRepresentative: false },
            { name: "매장작업비 (생장)", price: 1000000, description: "1기 기준", isRepresentative: false },
            { name: "가묘 매장작업비 (생장)", price: 1100000, description: "", isRepresentative: false },
            { name: "봉분 작업비", price: 500000, description: "50만원 ~ 100만원 (범위)", isRepresentative: false }, // Using min price for sort, desc for range

            // Management
            { name: "관리비 (1평/연)", price: 190000, description: "년단위 결제", isRepresentative: false },

            // Bong-an Options
            { name: "봉안묘 안치작업", price: 200000, description: "20만원 ~ 30만원", isRepresentative: false },
            { name: "각자 작업", price: 200000, description: "1위 기준", isRepresentative: false },
            { name: "석관 봉안용", price: 350000, description: "", isRepresentative: false },

            // Stone Options
            { name: "상석", price: 550000, description: "55만원 ~ 160만원", isRepresentative: false },
            { name: "비석", price: 650000, description: "65만원 ~ 150만원", isRepresentative: false },
            { name: "향로석 세트", price: 700000, description: "", isRepresentative: false },
            { name: "갓비석 세트", price: 2300000, description: "", isRepresentative: false },
            { name: "둘레석", price: 2800000, description: "280만원 ~ 720만원", isRepresentative: false },
            { name: "위 사각 돌뚜껑 세트", price: 9900000, description: "", isRepresentative: false }
        ]
    }
};

target.pricing = perfectPricing;

// Save
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log("✅ ID 3 (Daedong) Data has been reset to the Gold Standard.");
console.log(JSON.stringify(perfectPricing, null, 2));
