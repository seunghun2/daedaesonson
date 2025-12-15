const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../data/facilities.json');

console.log("💎 Injecting Gold Standard Data for Gyeongchun (경춘공원묘원)...");

const facilities = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));

// Find "경춘공원묘원"
let fIndex = facilities.findIndex(f => f.name.includes("경춘공원묘원"));

if (fIndex === -1 && facilities[25]) {
    // Try park-0026 (ID 26)
    fIndex = facilities.findIndex(f => f.id === 'park-0026');
}

if (fIndex === -1) {
    console.error("❌ Facility (경춘공원묘원/ID 26) not found!");
    process.exit(1);
}

const target = facilities[fIndex];
console.log(`Found Gyeongchun at ID: ${target.id} (${target.name})`);

const perfectPricing = {
    '매장묘': {
        rows: [
            // Land Fee Representative
            {
                name: "묘지 사용료 (1평 기준)",
                price: 1300000,
                description: "매장작업비/석물 별도 (토지사용료만)",
                isRepresentative: true // 130만원부터
            },

            // Packages (Detailed Decision Units)
            {
                name: "매장묘 (2단, 2기)",
                price: 9000000,
                description: "900만원 ~",
                isRepresentative: false
            },
            {
                name: "매장묘 (3단, 2기)",
                price: 12000000,
                description: "1,200만원 ~",
                isRepresentative: false
            }
        ]
    },
    '봉안당': { // Bong-an
        rows: [
            // Couple 2-unit Representative
            {
                name: "부부형 봉안묘 (2기)",
                price: 6500000,
                description: "650만원 ~",
                isRepresentative: true // 650만원부터
            },
            // Family Units
            {
                name: "봉안 가족묘 (8기)",
                price: 15000000,
                description: "1,500만원 ~",
                isRepresentative: false
            },
            {
                name: "봉안 가족묘 (20기)",
                price: 16000000,
                description: "1,600만원 ~",
                isRepresentative: false
            },
            {
                name: "봉안 가족묘 (40기 이상)",
                price: 22500000,
                description: "2,250만원 ~",
                isRepresentative: false
            }
        ]
    },
    '수목장': { // Natural Burial
        rows: [
            {
                name: "평장형 자연장 (6기)",
                price: 6900000,
                description: "690만원 ~",
                isRepresentative: true // 690만원부터
            }
        ]
    },
    '옵션': {
        rows: [
            // Empty as major items are in category rows as 'packages'
        ]
    }
};

target.pricing = perfectPricing;

// Save
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log("✅ Gyeongchun (경춘공원묘원) Data has been reset to the Gold Standard.");
console.log(JSON.stringify(perfectPricing, null, 2));
