const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../data/facilities.json');

console.log("💎 Injecting Gold Standard Data for Ehwa (이화공원묘원)...");

const facilities = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));

// Find "이화공원묘원"
let fIndex = facilities.findIndex(f => f.name.includes("이화공원묘원"));

if (fIndex === -1 && facilities[14]) {
    // Try park-0015
    fIndex = facilities.findIndex(f => f.id === 'park-0015');
}

if (fIndex === -1) {
    console.error("❌ Facility (이화공원묘원/ID 15) not found!");
    process.exit(1);
}

const target = facilities[fIndex];
console.log(`Found Ehwa at ID: ${target.id} (${target.name})`);

const perfectPricing = {
    '매장묘': {
        rows: [
            {
                name: "묘지 사용료 (평당)",
                price: 7000000,
                description: "1평 기준 순수 사용료 (석물/공사 별도)",
                isRepresentative: true // 700만원부터
            }
        ]
    },
    '봉안당': { // None
        rows: []
    },
    '수목장': { // None
        rows: []
    },
    '옵션': { // All stone and work fees here
        rows: [
            // Management Fee (Newly Added)
            { name: "연간 관리비", price: 12000, description: "평당 / 1년 (15년 선납 가능)", isRepresentative: false },

            // Stone Works (High Cost)
            { name: "상석 (석물)", price: 5230000, description: "최소 523만원 ~", isRepresentative: false },
            { name: "표석 (석물)", price: 5230000, description: "최소 523만원 ~", isRepresentative: false },
            { name: "천주교 상석", price: 5570000, description: "전용 상석", isRepresentative: false },
            { name: "와비 (석물)", price: 5590000, description: "최소 559만원 ~", isRepresentative: false },

            // Work Fees
            { name: "매장 용역비", price: 1440000, description: "인건비 등", isRepresentative: false },
            { name: "개장 정리비", price: 300000, description: "기존 묘 정리", isRepresentative: false },
            { name: "묘지 보수비", price: 300000, description: "30~35만원", isRepresentative: false },
            { name: "비석 석각인비", price: 300000, description: "글자 새김", isRepresentative: false },

            // Small Accessories
            { name: "향로석", price: 1100000, description: "", isRepresentative: false },
            { name: "북석 세트", price: 400000, description: "", isRepresentative: false },
            { name: "돌화병", price: 140000, description: "꽃병", isRepresentative: false }
        ]
    }
};

target.pricing = perfectPricing;

// Save
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log("✅ Ehwa (이화공원묘원) Data has been reset to the Gold Standard.");
console.log(JSON.stringify(perfectPricing, null, 2));
