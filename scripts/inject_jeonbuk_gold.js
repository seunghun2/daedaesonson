const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../data/facilities.json');

console.log("💎 Injecting Gold Standard Data for Jeonbuk (37번/지평선전북공원) - FINAL CONFIRMED...");

const facilities = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));

// Find "park-0037"
let fIndex = facilities.findIndex(f => f.id === 'park-0037');

// Fallback search
if (fIndex === -1) {
    fIndex = facilities.findIndex(f => f.name.includes("지평선") || f.name.includes("전북공원"));
}

if (fIndex === -1 && facilities[37]) {
    fIndex = 37;
}


const target = facilities[fIndex];
if (!target) {
    console.error("❌ Facility (park-0037/Jeonbuk) not found!");
    process.exit(1);
}
console.log(`Found ID 37: ${target.id} (${target.name})`);

const perfectPricing = {
    '매장묘': {
        rows: [
            // Representative Entry (Land Fee)
            {
                name: "매장묘 토지사용료 (장미구역)",
                price: 1200000,
                description: "평당 120만원 (석물/설치/관리비 별도)",
                isRepresentative: true // 120만원부터
            },

            // Detailed Packages
            {
                name: "개인 매장묘 (4평/패키지)",
                price: 4800000,
                description: "석상·비석·1회 설치 포함",
                isRepresentative: false
            },
            {
                name: "부부 매장묘 (5평/패키지)",
                price: 6000000,
                description: "석상·비석·1회 설치 포함",
                isRepresentative: false
            },
            {
                name: "쌍장 매장묘 (8평/패키지)",
                price: 9600000,
                description: "석상·비석·1회 설치 포함",
                isRepresentative: false
            },
            {
                name: "대형 합장묘 (14평/패키지)",
                price: 16800000,
                description: "석상·비석·1회 설치 포함",
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
            { name: "추가 매장비 / 재설치비", price: 750000, description: "1회 기준", isRepresentative: false },
            { name: "묘지관리비 (1평/1년)", price: 15000, description: "별도 (잔여기간 환불 가능)", isRepresentative: false },
            { name: "토지사용료 (매화구역)", price: 1500000, description: "평당", isRepresentative: false }
        ]
    }
};

target.pricing = perfectPricing;

// Save
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log("✅ Jeonbuk (37번) Data has been reset to the User's Gold Standard.");
console.log(JSON.stringify(perfectPricing, null, 2));
