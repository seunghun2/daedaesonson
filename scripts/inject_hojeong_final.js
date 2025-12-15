const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../data/facilities.json');

console.log("💎 Injecting Gold Standard Data for Hojeong (32번/호정공원) - FINAL CONFIRMED...");

const facilities = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));

// Find "park-0032"
let fIndex = facilities.findIndex(f => f.id === 'park-0032');

if (fIndex === -1) {
    fIndex = facilities.findIndex(f => f.name.includes("호정공원"));
}

if (fIndex === -1) {
    console.error("❌ Facility (park-0032/Hojeong) not found!");
    process.exit(1);
}

const target = facilities[fIndex];
console.log(`Found ID 32: ${target.id} (${target.name})`);

const perfectPricing = {
    '매장묘': {
        rows: [
            // Representative Entry
            {
                name: "단장 매장묘",
                price: 15500000,
                description: "묘지사용료+석물비+작업비 포함 (안장비 별도)",
                isRepresentative: true // 1,550만원부터
            },

            // Other Types
            {
                name: "1단 매장묘",
                price: 18050000,
                description: "묘지사용료+석물비+작업비 포함 (안장비 별도)",
                isRepresentative: false
            },
            {
                name: "2단 매장묘",
                price: 19550000,
                description: "묘지사용료+석물비+작업비 포함 (안장비 별도)",
                isRepresentative: false
            },
            {
                name: "특 매장묘",
                price: 22950000,
                description: "묘지사용료+석물비+작업비 포함 (안장비 별도)",
                isRepresentative: false
            }
        ]
    },
    '봉안당': {
        rows: [] // None
    },
    '수목장': {
        rows: [] // None
    },
    '옵션': {
        rows: [
            // Separate Burial Fees
            { name: "시신 안장비", price: 3000000, description: "별도", isRepresentative: false },
            { name: "유골 안장비", price: 1500000, description: "별도", isRepresentative: false },

            // Reference Land/Mgmt Fees
            { name: "묘지사용료 (㎡)", price: 681000, description: "패키지 포함됨", isRepresentative: false },
            { name: "관리비 (㎡/연)", price: 5300, description: "별도", isRepresentative: false }
        ]
    }
};

target.pricing = perfectPricing;

// Save
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log("✅ Hojeong (32번) Data has been reset to the User's Final Standard.");
console.log(JSON.stringify(perfectPricing, null, 2));
