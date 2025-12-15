const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../data/facilities.json');

console.log("💎 Injecting Gold Standard Data for Samcheok (34번/삼척시추모공원) - PHOTO VERIFIED...");

const facilities = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));

// Find "park-0034"
let fIndex = facilities.findIndex(f => f.id === 'park-0034');

// Fallback search
if (fIndex === -1) {
    fIndex = facilities.findIndex(f => f.name.includes("삼척시추모공원"));
}

if (fIndex === -1 && facilities[34]) {
    // Risky fallback
    fIndex = 34;
}


const target = facilities[fIndex];
if (!target) {
    console.error("❌ Facility (park-0034/Samcheok) not found!");
    process.exit(1);
}
console.log(`Found ID 34: ${target.id} (${target.name})`);

const perfectPricing = {
    '매장묘': {
        rows: [
            // Representative Entry (Land Fee Only)
            {
                name: "매장묘 2평형 (사용료)",
                price: 572000,
                description: "6.75㎡ / 30년 사용료 (관리비/석물 별도)",
                isRepresentative: true // 57만원부터
            },

            // Other Types
            {
                name: "매장묘 3평형 (사용료)",
                price: 839000,
                description: "9.9㎡ / 30년 사용료 (관리비/석물 별도)",
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
            // Essential additional costs
            { name: "관리비 (2평형/30년)", price: 480000, description: "30년 선납 (필수)", isRepresentative: false },
            { name: "관리비 (3평형/30년)", price: 720000, description: "30년 선납 (필수)", isRepresentative: false },
            { name: "매장비 (작업비)", price: 370000, description: "1구당", isRepresentative: false },
            { name: "석물비 (2평형/화강암)", price: 940000, description: "필수 (오석 111만원)", isRepresentative: false },
            { name: "석물비 (3평형/화강암)", price: 982000, description: "필수 (오석 116만원)", isRepresentative: false }
        ]
    }
};

target.pricing = perfectPricing;

// Save
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log("✅ Samcheok (34번) Data has been reset to the User's Gold Standard.");
console.log(JSON.stringify(perfectPricing, null, 2));
