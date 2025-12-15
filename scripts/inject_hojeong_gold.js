const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../data/facilities.json');

console.log("💎 Injecting Gold Standard Data for Hojeong (32번/호정공원) - CORRECTED...");

const facilities = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));

// Find "park-0032"
let fIndex = facilities.findIndex(f => f.id === 'park-0032');

// Fallback search
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
            // Representative Package
            {
                name: "매장묘 1단 (패키지)",
                price: 14500000,
                description: "묘지사용료+석물비+작업비 포함",
                isRepresentative: true // 1,450만원부터
            },

            // Other Packages
            {
                name: "매장묘 2단 (패키지)",
                price: 16000000,
                description: "묘지사용료+석물비+작업비 포함",
                isRepresentative: false
            },
            {
                name: "매장묘 특대형 (패키지)",
                price: 19400000,
                description: "묘지사용료+석물비+작업비 포함",
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
            // Additional info
            { name: "안장비", price: 0, description: "별도 문의 (작업 시 발생)", isRepresentative: false },
            { name: "묘지 관리비 (㎡/연)", price: 5300, description: "평당 약 1.7만원", isRepresentative: false },
            { name: "[참고] 토지사용료 (㎡)", price: 681000, description: "패키지에 포함됨", isRepresentative: false }
        ]
    }
};

target.pricing = perfectPricing;

// Save
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log("✅ Hojeong (32번) Data has been reset to the User's Gold Standard.");
console.log(JSON.stringify(perfectPricing, null, 2));
