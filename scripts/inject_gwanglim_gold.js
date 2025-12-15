const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../data/facilities.json');

console.log("💎 Injecting Gold Standard Data for Gwanglim (33번/광림공원) - PHOTO VERIFIED...");

const facilities = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));

// Find "park-0033"
let fIndex = facilities.findIndex(f => f.id === 'park-0033');

// Fallback search
if (fIndex === -1) {
    fIndex = facilities.findIndex(f => f.name.includes("광림공원"));
}
if (fIndex === -1 && facilities[33]) {
    // Risky fallback to index 33 (verify name)
    fIndex = 33;
}


const target = facilities[fIndex];
if (!target) {
    console.error("❌ Facility (park-0033/Gwanglim) not found!");
    process.exit(1);
}
console.log(`Found ID 33: ${target.id} (${target.name})`);

const perfectPricing = {
    '매장묘': {
        rows: [
            // Representative Entry (11 Complex)
            {
                name: "매장묘 단장 (11단지/패키지)",
                price: 12409000,
                description: "대지사용료+석물비 포함 (1,240만원~)",
                isRepresentative: true // 1,240만원부터
            },

            // Other Types
            {
                name: "매장묘 합장 (11단지/패키지)",
                price: 18996000,
                description: "대지사용료+석물비 포함 (1,900만원~)",
                isRepresentative: false
            },
            {
                name: "매장묘 단장 (일반단지/패키지)",
                price: 15898000,
                description: "대지사용료+석물비 포함 (1,590만원~)",
                isRepresentative: false
            },
            {
                name: "매장묘 합장 (일반단지/패키지)",
                price: 24231000,
                description: "대지사용료+석물비 포함 (2,420만원~)",
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
            // Additional services from image
            { name: "제사음식 (실속형)", price: 150000, description: "별도", isRepresentative: false },
            { name: "제사음식 (표준형)", price: 300000, description: "별도", isRepresentative: false },
            { name: "제사음식 (고급형)", price: 500000, description: "별도", isRepresentative: false },
            { name: "장례식사 (밤/국/반찬)", price: 12000, description: "1인 기준", isRepresentative: false }
        ]
    }
};

target.pricing = perfectPricing;

// Save
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log("✅ Gwanglim (33번) Data has been reset to the User's Gold Standard.");
console.log(JSON.stringify(perfectPricing, null, 2));
