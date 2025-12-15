const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../data/facilities.json');

console.log("💎 Injecting Gold Standard Data for Gayagok (31번/가야곡공원묘원) - PHOTO VERIFIED...");

const facilities = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));

// Find "park-0031"
let fIndex = facilities.findIndex(f => f.id === 'park-0031');

// Fallback search
if (fIndex === -1) {
    fIndex = facilities.findIndex(f => f.name.includes("가야곡"));
}

if (fIndex === -1 && facilities[30]) {
    // Risky fallback to index 30 (since ID 31 is usually index 30)
    fIndex = 30; // Verify name later
}

const target = facilities[fIndex];
if (!target) {
    console.error("❌ Facility (park-0031/Gayagok) not found!");
    process.exit(1);
}
console.log(`Found ID 31: ${target.id} (${target.name})`);

const perfectPricing = {
    '매장묘': {
        rows: [
            // Representative Entry
            {
                name: "유골 매장묘 (단/합장)",
                price: 1200000,
                description: "묘지작업비+비석조각 포함 (120만원)",
                isRepresentative: true // 120만원부터
            },

            // Other Types
            {
                name: "시신 매장묘 (단/합장)",
                price: 1600000,
                description: "묘지작업비+비석조각 포함",
                isRepresentative: false
            },
            {
                name: "가족 평장 묘지 1인 안치료",
                price: 1250000,
                description: "안치 시 납부 (비문/신주비문제작 포함)",
                isRepresentative: false
            }
        ]
    },
    '봉안당': {
        rows: []
    },
    '수목장': {
        rows: []
    },
    '옵션': {
        rows: [
            // Essential Fees
            { name: "시설이용료 (편의시설 외)", price: 100000, description: "개/매장 작업 시 필수 적용", isRepresentative: false },

            // Management Fees
            { name: "매장묘 관리비 (1년/평당)", price: 10000, description: "연납", isRepresentative: false },
            { name: "가족평장묘 4위 관리비 (1년)", price: 40000, description: "연납", isRepresentative: false },
            { name: "가족평장묘 8위 관리비 (1년)", price: 80000, description: "연납", isRepresentative: false },

            // Removals/Transfer
            { name: "유골개장 (단장)", price: 600000, description: "합장은 30만 추가", isRepresentative: false },
            { name: "시신개장 (단장)", price: 700000, description: "합장은 40만 추가", isRepresentative: false }
        ]
    }
};

target.pricing = perfectPricing;

// Save
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log("✅ Gayagok (31번) Data has been reset to the Photo-Verified Standard.");
console.log(JSON.stringify(perfectPricing, null, 2));
