const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../data/facilities.json');

console.log("💎 Injecting Gold Standard Data for Hwashin (28번/화신공원묘원) - REVISED...");

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
            // Representative: Individual Type A (Most Common Choice)
            {
                name: "매장묘 A형 (4평)",
                price: 4800000,
                description: "개인형 (분양금 패키지)",
                isRepresentative: true // 480만원부터
            },

            // Other Sizes
            {
                name: "매장묘 B형 (6평)",
                price: 6800000,
                description: "개인형 (분양금 패키지)",
                isRepresentative: false
            },
            {
                name: "매장묘 C형 (8평)",
                price: 8500000,
                description: "개인형 (분양금 패키지)",
                isRepresentative: false
            },
            {
                name: "특수 매장묘 D형 (8평)",
                price: 13500000,
                description: "고급형 (분양금 패키지)",
                isRepresentative: false
            }
        ]
    },
    '봉안당': { // Bong-an (Charnel)
        rows: [
            // Representative: Couple Type (Most Common Choice)
            {
                name: "부부형 봉안묘",
                price: 5000000,
                description: "2위 안치 (분양금 패키지)",
                isRepresentative: true // 500만원부터
            },

            // Family Units
            {
                name: "봉안묘 10기형",
                price: 8000000,
                description: "가족형 (분양금 패키지)",
                isRepresentative: false
            },
            {
                name: "개방형 봉안묘 18기",
                price: 13000000,
                description: "대가족형 (분양금 패키지)",
                isRepresentative: false
            },
            {
                name: "개방형 봉안묘 24기",
                price: 16000000,
                description: "대가족형 (분양금 패키지)",
                isRepresentative: false
            },
            {
                name: "대형 봉안묘 (24기/16평)",
                price: 25000000,
                description: "최고급 대가족형",
                isRepresentative: false
            }
        ]
    },
    '수목장': {
        rows: []
    },
    '옵션': {
        rows: [
            // Management Fees or other options can go here if needed later
            // Currently keeping it clean as per user instruction "Only Key Decision Units"
        ]
    }
};

target.pricing = perfectPricing;

// Save
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log("✅ Hwashin (28번) Data has been CORRECTED to the User's PDF Standard.");
console.log(JSON.stringify(perfectPricing, null, 2));
