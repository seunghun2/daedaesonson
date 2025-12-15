const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../data/facilities.json');

console.log("💎 Injecting Gold Standard Data for ID 1...");

const facilities = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));
const fIndex = facilities.findIndex(f => f.id === 'park-0001');

if (fIndex === -1) {
    console.error("❌ Facility park-0001 not found!");
    process.exit(1);
}

// The "Perfect" Data provided by User
const perfectPricing = {
    '매장묘': {
        rows: [
            {
                name: "개인 매장묘 (3평형)",
                price: 20275000,
                description: "가장 많이 선택되는 기본 구성",
                isRepresentative: true // "2,027만원부터" logic source
            },
            {
                name: "부부 매장묘 (6평형)",
                price: 31150000,
                description: "부부 합장 기준",
                isRepresentative: false
            },
            {
                name: "프리미엄 부부 매장묘 (담장시설, 최대 12평)",
                price: 64650000,
                description: "담장 포함 고급형",
                isRepresentative: false
            }
        ]
    },
    '봉안당': {
        rows: [
            {
                name: "다알리아 (단품)",
                price: 3500000,
                description: "봉안당 기본형",
                isRepresentative: true // "350만원부터" logic source
            },
            {
                name: "아이리스 (단품)",
                price: 4100000,
                description: "대/소 선택 가능",
                isRepresentative: false
            },
            {
                name: "플라타너스 (단품)",
                price: 5100000,
                description: "상위 라인",
                isRepresentative: false
            }
        ]
    },
    '수목장': {
        rows: [
            {
                name: "부부 수목형 평장묘",
                price: 8500000,
                description: "부부 기준 기본형",
                isRepresentative: true // "850만원부터" logic source
            },
            {
                name: "정원형 평장",
                price: 9500000,
                description: "가장 기본적인 정원형",
                isRepresentative: false
            },
            {
                name: "프리미엄 부부 평장묘 (담장시설)",
                price: 21800000,
                description: "담장 포함 고급형",
                isRepresentative: false
            }
        ]
    },
    '옵션': { // New Category for Separated Items
        rows: [
            {
                name: "수목형 표석",
                price: 800000,
                description: "",
                isRepresentative: false
            },
            {
                name: "가족표석",
                price: 400000,
                description: "",
                isRepresentative: false
            },
            {
                name: "석실/비석/상석",
                price: 0, // 0 usually means "현장 문의" or "별도" in frontend logic
                description: "현장 선택",
                isRepresentative: false
            },
            {
                name: "관리비",
                price: 0,
                description: "별도",
                isRepresentative: false
            }
        ]
    }
};

facilities[fIndex].pricing = perfectPricing;

// Save
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log("✅ ID 1 Data has been reset to the Gold Standard.");
console.log(JSON.stringify(perfectPricing, null, 2));
