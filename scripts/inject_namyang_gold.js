const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../data/facilities.json');

console.log("💎 Injecting Gold Standard Data for Namyang (남양공원묘원)...");

const facilities = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));

// Find "남양공원묘원"
let fIndex = facilities.findIndex(f => f.name.includes("남양공원묘원"));

if (fIndex === -1 && facilities[18]) {
    // Try park-0019 (ID 19 is usually facility 19)
    fIndex = facilities.findIndex(f => f.id === 'park-0019');
}

if (fIndex === -1) {
    console.error("❌ Facility (남양공원묘원/ID 19) not found!");
    process.exit(1);
}

const target = facilities[fIndex];
console.log(`Found Namyang at ID: ${target.id} (${target.name})`);

const perfectPricing = {
    '매장묘': {
        rows: [
            {
                name: "묘지 사용료 (1평 기준)",
                price: 9500000,
                description: "순수 묘지 사용료 (석물/관리비 별도)",
                isRepresentative: true // 950만원부터
            }
        ]
    },
    '봉안당': { // None
        rows: []
    },
    '수목장': { // None
        rows: []
    },
    '옵션': { // Massive Stone Options Here
        rows: [
            // Management
            { name: "연간 관리비", price: 130000, description: "1년 기준", isRepresentative: false },

            // Basic Stone / Accessories
            { name: "단향로", price: 48000, description: "소품", isRepresentative: false },
            { name: "삼향로", price: 96000, description: "소품", isRepresentative: false },
            { name: "화병 (소)", price: 110000, description: "소품", isRepresentative: false },
            { name: "화병 (대)", price: 198000, description: "소품", isRepresentative: false },

            // Tombstones (Wide Range)
            { name: "기본 오석", price: 484000, description: "48만원 ~ 772만원 (크기별 상이)", isRepresentative: false },
            { name: "애석", price: 858000, description: "85만원 ~ 3100만원 (고급형)", isRepresentative: false },
            { name: "오석 와비", price: 1210000, description: "121만원 ~ 596만원", isRepresentative: false },
            { name: "서구식 C/E형", price: 1452000, description: "121만원 ~ 145만원", isRepresentative: false },

            // Borders (Dool-re-seok)
            { name: "원형 둘레석 A형", price: 1452000, description: "145만원 ~ 250만원", isRepresentative: false }
        ]
    }
};

target.pricing = perfectPricing;

// Save
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log("✅ Namyang (남양공원묘원) Data has been reset to the Gold Standard.");
console.log(JSON.stringify(perfectPricing, null, 2));
