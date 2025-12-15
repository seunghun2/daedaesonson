const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../data/facilities.json');

console.log("💎 Injecting Gold Standard Data for Ilsan Park (28번/삼성개발)...");

const facilities = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));

// Find "park-0028"
let fIndex = facilities.findIndex(f => f.id === 'park-0028');

if (fIndex === -1) {
    console.error("❌ Facility (park-0028) not found!");
    process.exit(1);
}

const target = facilities[fIndex];
console.log(`Found ID 28: ${target.id} (${target.name})`);

const perfectPricing = {
    '매장묘': {
        rows: [
            // Entry Level
            {
                name: "혼합형 매장묘",
                price: 10000000,
                description: "매장+봉안 혼합형 (실속형)",
                isRepresentative: true // 1,000만원부터
            },

            // Standard Types
            {
                name: "A형 매장묘",
                price: 18000000,
                description: "사용료+조성비+석축+운영비 포함",
                isRepresentative: false
            },
            {
                name: "B형 매장묘",
                price: 27000000,
                description: "중대형 (패키지)",
                isRepresentative: false
            },
            {
                name: "C형 매장묘",
                price: 36000000,
                description: "대형 (패키지)",
                isRepresentative: false
            }
        ]
    },
    '봉안당': { // 납골묘
        rows: [
            // Entry Level
            {
                name: "평장형 납골묘",
                price: 4950000,
                description: "실속형 납골평장",
                isRepresentative: true // 495만원부터
            },

            // Large Family Units (Corrected Prices)
            {
                name: "개방형 납골묘 (18기)",
                price: 72000000,
                description: "대가족형 (18위 안치)",
                isRepresentative: false
            },
            {
                name: "개방형 납골묘 (24기)",
                price: 96000000,
                description: "대가족형 (24위 안치)",
                isRepresentative: false
            }
        ]
    },
    '수목장': {
        rows: []
    },
    '옵션': {
        rows: [
            // Management Fees inferred from description
            { name: "납골묘 관리비 (10년)", price: 0, description: "별도 문의 (기수별 상이)", isRepresentative: false }
        ]
    }
};

target.pricing = perfectPricing;

// Save
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log("✅ Ilsan Park (28번) Data has been reset to the Gold Standard.");
console.log(JSON.stringify(perfectPricing, null, 2));
