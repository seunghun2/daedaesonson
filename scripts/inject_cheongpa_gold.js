const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../data/facilities.json');

console.log("💎 Injecting Gold Standard Data for Cheongpa Catholic (29번/청파묘원)...");

const facilities = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));

// Find "park-0029"
let fIndex = facilities.findIndex(f => f.id === 'park-0029');

if (fIndex === -1) {
    console.error("❌ Facility (park-0029) not found!");
    process.exit(1);
}

const target = facilities[fIndex];
console.log(`Found ID 29: ${target.id} (${target.name})`);

const perfectPricing = {
    '매장묘': {
        rows: [
            // Lowest Entry (Card Summary)
            {
                name: "유골 단장 매장묘",
                price: 900000,
                description: "잔디·봉분 포함 작업비 (90만원~)",
                isRepresentative: true // 90만원부터
            },

            // Other Burial Options
            {
                name: "유골 합장 매장묘",
                price: 1000000,
                description: "잔디·봉분 포함 작업비 (100만원~)",
                isRepresentative: false
            },
            {
                name: "시신 단장 매장묘",
                price: 1300000,
                description: "잔디·봉분 포함 작업비 (130만원~)",
                isRepresentative: false
            },
            {
                name: "시신 합장 매장묘",
                price: 1400000,
                description: "잔디·봉분 포함 작업비 (140만원~)",
                isRepresentative: false
            },

            // Family Flat Burial (Corrected Price)
            {
                name: "가족 평장묘 (최대 8위)",
                price: 15000000,
                description: "묘지 분양 (1,500만원~)",
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
            // Additional costs for transparency
            { name: "가족 평장 안치비 (1위당)", price: 400000, description: "별도", isRepresentative: false },
            { name: "매장묘 관리비 (평/연)", price: 10000, description: "연 1만원", isRepresentative: false },
            { name: "가족평장묘 관리비 (연)", price: 80000, description: "연 8만원", isRepresentative: false },
            { name: "상석/비석 (옵션)", price: 0, description: "별도 문의", isRepresentative: false }
        ]
    }
};

target.pricing = perfectPricing;

// Save
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log("✅ Cheongpa (29번) Data has been reset to the User's Gold Standard.");
console.log(JSON.stringify(perfectPricing, null, 2));
