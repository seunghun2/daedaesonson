const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../data/facilities.json');

console.log("💎 Injecting Gold Standard Data for Yesan (예산군추모공원)...");

const facilities = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));

// Find "예산군추모공원"
let fIndex = facilities.findIndex(f => f.name.includes("예산군추모공원"));

if (fIndex === -1) {
    // Try park-0007
    fIndex = facilities.findIndex(f => f.id === 'park-0007');
}

if (fIndex === -1) {
    console.error("❌ Facility (예산군추모공원) not found!");
    process.exit(1);
}

const target = facilities[fIndex];
console.log(`Found Yesan at ID: ${target.id}`);

// The "Perfect" Data for Yesan (Public Facility)
const perfectPricing = {
    '봉안당': {
        rows: [
            {
                name: "단장묘 (관내 · 3년 이상 거주)",
                price: 14190000,
                description: "예산군 주민등록 3년 이상 (최저가)",
                isRepresentative: true // Representative Low Price
            },
            {
                name: "단장묘 (관내 · 6개월~3년 미만)",
                price: 36180000,
                description: "단기 거주자 대상",
                isRepresentative: false
            },
            {
                name: "회차 1구 (관내 · 3년 이상)",
                price: 23940000,
                description: "기본 봉안 구역",
                isRepresentative: false
            },
            {
                name: "회차 2구 (관내 · 3년 이상)",
                price: 23940000,
                description: "",
                isRepresentative: false
            },
            {
                name: "회차 1구/2구 (관내 · 6개월~3년 미만)",
                price: 61030000,
                description: "단기 거주자용",
                isRepresentative: false
            },
            {
                name: "가족봉안묘 (관내 · 3년 이상)",
                price: 23940000, // Same price as Heocha? Checking user input.. Yes "가족봉안묘 (관내 · 3년 이상) 23,940,000원"
                description: "가족 단위 봉안 기본형",
                isRepresentative: false
            },
            {
                name: "가족봉안묘 (관내 · 6개월~3년 미만)",
                price: 71800000,
                description: "",
                isRepresentative: false
            },
            {
                name: "가족봉안묘 (관외)",
                price: 94810000,
                description: "타 지역 거주자",
                isRepresentative: false
            }
        ]
    },
    '매장묘': { rows: [] }, // No burial mentioned in refined list, assuming only Bonan as per request
    '옵션': {
        rows: [
            // Landscaping
            { name: "조경비 (단장/회차/가족)", price: 300000, description: "관내·관외 동일", isRepresentative: false },

            // Management Fees (Categorized by residence)
            { name: "관리비 (관내·3년이상 / 단장묘)", price: 5520000, description: "장기 관리비", isRepresentative: false },
            { name: "관리비 (관내·3년이상 / 회차)", price: 9300000, description: "1구/3구 기준", isRepresentative: false },

            { name: "관리비 (관내·3년미만 / 단장묘)", price: 14070000, description: "", isRepresentative: false },
            { name: "관리비 (관내·3년미만 / 회차)", price: 23710000, description: "", isRepresentative: false },

            { name: "관리비 (관외 / 단장묘)", price: 26230000, description: "", isRepresentative: false },
            { name: "관리비 (관외 / 회차)", price: 38310000, description: "", isRepresentative: false },

            // Other Fees
            { name: "기타비용 (회차 1·2구)", price: 7150000, description: "", isRepresentative: false },
            { name: "기타비용 (단장/가족)", price: 0, description: "2,050 ~ 5,460만원 (조건별 상이)", isRepresentative: false }
        ]
    }
};

target.pricing = perfectPricing;

// Save
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log("✅ Yesan (예산군추모공원) Data has been reset to the Gold Standard.");
console.log(JSON.stringify(perfectPricing, null, 2));
