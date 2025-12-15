const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../data/facilities.json');

console.log("💎 Injecting Gold Standard Data for Yudal (36번/유달공원) - PHOTO VERIFIED...");

const facilities = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));

// Find "park-0036"
let fIndex = facilities.findIndex(f => f.id === 'park-0036');

// Fallback search
if (fIndex === -1) {
    fIndex = facilities.findIndex(f => f.name.includes("유달공원"));
}

if (fIndex === -1 && facilities[36]) {
    fIndex = 36;
}


const target = facilities[fIndex];
if (!target) {
    console.error("❌ Facility (park-0036/Yudal) not found!");
    process.exit(1);
}
console.log(`Found ID 36: ${target.id} (${target.name})`);

const perfectPricing = {
    '매장묘': {
        rows: [
            // Representative Entry (Old District Land Fee)
            {
                name: "묘지 구단지 (1~9단지)",
                price: 2960000,
                description: "3평(9.9㎡) 사용료 (석물 별도)",
                isRepresentative: true // 296만원부터
            },

            // Other Types
            {
                name: "묘지 신단지 (10~11단지)",
                price: 4260000,
                description: "3평(9.9㎡) 사용료 (석물 별도)",
                isRepresentative: false
            }
        ]
    },
    '봉안당': {
        rows: [
            // Representative Entry (Niche Wall Permanent)
            {
                name: "봉안담 (영구 60년)",
                price: 2525000,
                description: "60년 사용료",
                isRepresentative: true // 252만원부터
            },

            // Other Types
            {
                name: "봉안묘 (영구 60년)",
                price: 2690000,
                description: "60년 사용료",
                isRepresentative: false
            }
        ]
    },
    '수목장': {
        rows: []
    },
    '옵션': {
        rows: [
            // Stone Services
            { name: "3단 둘래석묘 (패키지)", price: 2380000, description: "둘래석+상석+비석+화병", isRepresentative: false },
            { name: "묘테 둘래석묘 (패키지)", price: 1680000, description: "둘래석+상석+비석+돌꽃병", isRepresentative: false },
            { name: "일반 비석묘", price: 600000, description: "표석(37만)+상석(15만)+돌꽃병(8만)", isRepresentative: false },

            // Management Fee
            { name: "벌초/청소비 (5년)", price: 330000, description: "5년 선납 (월 5,500원)", isRepresentative: false }
        ]
    }
};

target.pricing = perfectPricing;

// Save
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log("✅ Yudal (36번) Data has been reset to the User's Gold Standard.");
console.log(JSON.stringify(perfectPricing, null, 2));
