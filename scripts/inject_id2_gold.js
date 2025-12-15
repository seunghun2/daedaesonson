const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../data/facilities.json');

console.log("💎 Injecting Gold Standard Data for ID 2 (Siloam)...");

const facilities = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));
const fIndex = facilities.findIndex(f => f.id === 'park-0002'); // ID for Siloam

if (fIndex === -1) {
    // Attempt to search by name if ID is unsure, but assuming park-0002
    const found = facilities.find(f => f.name.includes("실로암"));
    if (!found) {
        console.error("❌ Facility park-0002 (실로암) not found!");
        process.exit(1);
    }
    console.log(`Found Siloam at ID: ${found.id}`);
    facilities.splice(facilities.indexOf(found), 1, { ...found, pricing: {} }); // Reset pricing
    // Re-find index
} else {
    // Reset pricing
    facilities[fIndex].pricing = {};
}

// Find the target again properly
const targetIndex = facilities.findIndex(f => f.name.includes("실로암") || f.id === 'park-0002');
const target = facilities[targetIndex];

// The "Perfect" Data provided by User for ID 2
const perfectPricing = {
    '매장묘': {
        rows: [
            {
                name: "개인 매장묘 (.5평형 / 단봉)",
                price: 12000000,
                description: "기본 매장 구성 (최소 단위)",
                isRepresentative: true // "1,200만원부터" logic source
            },
            {
                name: "개인 매장묘 (1평형 / 단봉)",
                price: 15339000,
                description: "관리비 포함 기본형",
                isRepresentative: false
            },
            {
                name: "개인 매장묘 (.5평형 / 쌍봉)",
                price: 18000000,
                description: "부부 또는 합장 가능",
                isRepresentative: false
            },
            {
                name: "개인 매장묘 (1평형 / 쌍봉)",
                price: 23823000,
                description: "넉넉한 공간의 개인 매장묘",
                isRepresentative: false
            }
        ]
    },
    '봉안당': {
        rows: [
            {
                name: "봉안묘 신형 (2위 세트)",
                price: 15200000,
                description: "봉안당 최소 단위 기본형",
                isRepresentative: true // "1,520만원부터" logic source
            },
            {
                name: "봉안묘 신형 (4위 세트)",
                price: 19200000,
                description: "가족 봉안 가능",
                isRepresentative: false
            },
            {
                name: "봉안묘 신형 (6위 세트)",
                price: 24000000,
                description: "",
                isRepresentative: false
            },
            {
                name: "봉안묘 신형 (9위 세트)",
                price: 28000000,
                description: "",
                isRepresentative: false
            },
            {
                name: "봉안묘 (16위 세트)",
                price: 35000000,
                description: "",
                isRepresentative: false
            }
        ]
    },
    '옵션': {
        rows: [
            {
                name: "1년 관리비 (1평 기준)",
                price: 160000,
                description: "년단위 결제",
                isRepresentative: false
            },
            {
                name: "석물류 (비석/상석/둘레석)",
                price: 0,
                description: "현장 선택",
                isRepresentative: false
            },
            {
                name: "작업비 (매장/개장/봉분설치)",
                price: 0,
                description: "현장 견적",
                isRepresentative: false
            },
            {
                name: "기타 (각자대/특수마크/안치료)",
                price: 0,
                description: "별도 부과",
                isRepresentative: false
            }
        ]
    }
};

target.pricing = perfectPricing;

// Save
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log("✅ ID 2 (Siloam) Data has been reset to the Gold Standard.");
console.log(JSON.stringify(perfectPricing, null, 2));
