const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../data/facilities.json');

console.log("💎 Injecting Gold Standard Data for Pungsan (30번/풍산공원묘원) - CORRECTED...");

const facilities = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));

// Find "park-0030"
let fIndex = facilities.findIndex(f => f.id === 'park-0030');

// Fallback search
if (fIndex === -1) {
    fIndex = facilities.findIndex(f => f.name.includes("풍산공원묘원"));
}

if (fIndex === -1) {
    console.error("❌ Facility (park-0030/Pungsan) not found!");
    process.exit(1);
}

const target = facilities[fIndex];
console.log(`Found ID 30: ${target.id} (${target.name})`);

const perfectPricing = {
    '매장묘': {
        rows: [
            // Representative Entry
            {
                name: "단장형 매장묘",
                price: 4398000,
                description: "19.8㎡ / 15년 사용료 (관리비 별도)",
                isRepresentative: true // 440만원부터
            },

            // Other Types
            {
                name: "합장형 매장묘",
                price: 5131000,
                description: "23.1㎡ / 15년 사용료 (관리비 별도)",
                isRepresentative: false
            },
            {
                name: "합장형 대형",
                price: 6597000,
                description: "29.7㎡ / 15년 사용료 (관리비 별도)",
                isRepresentative: false
            }
        ]
    },
    '봉안당': { // Bong-an (Family Grave Packages)
        rows: [
            // Representative Entry (Couple/2-person)
            {
                name: "봉안묘 2위 (풍산8호)",
                price: 6000000,
                description: "사용료+15년관리비+석물 포함 패키지",
                isRepresentative: true // 600만원부터
            },

            // Family Units
            {
                name: "봉안묘 4위 (풍산7호)",
                price: 8000000,
                description: "패키지 (800만원)",
                isRepresentative: false
            },
            {
                name: "봉안묘 8위 (풍산6호)",
                price: 11000000,
                description: "패키지 (1,100만원)",
                isRepresentative: false
            },
            {
                name: "봉안묘 12위 (풍산4호)",
                price: 12000000,
                description: "패키지 (1,200만원)",
                isRepresentative: false
            },
            {
                name: "봉안묘 24위 (풍산3호)",
                price: 16000000,
                description: "패키지 (1,600만원)",
                isRepresentative: false
            },
            {
                name: "봉안묘 36위 (풍산특2호)",
                price: 42000000,
                description: "패키지 (4,200만원)",
                isRepresentative: false
            },
            {
                name: "봉안묘 52위 (풍산특1호)",
                price: 64000000,
                description: "패키지 (6,400만원)",
                isRepresentative: false
            }
        ]
    },
    '수목장': {
        rows: []
    },
    '옵션': {
        rows: [
            // Management Fee for Burial (Separate)
            { name: "재단운영관리비 (단장/15년)", price: 1593000, description: "별도 납부", isRepresentative: false },
            { name: "재단운영관리비 (합장/15년)", price: 1858500, description: "별도 납부", isRepresentative: false }
            // Note: Adjusted management fee zeros as well to match scale (assuming 1.5M not 15M)
        ]
    }
};

target.pricing = perfectPricing;

// Save
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log("✅ Pungsan (30번) Data has been reset to the User's Gold Standard.");
console.log(JSON.stringify(perfectPricing, null, 2));
