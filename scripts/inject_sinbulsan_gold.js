const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../data/facilities.json');

console.log("💎 Injecting Gold Standard Data for Sinbulsan (신불산)...");

const facilities = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));

// Find "신불산공원묘원"
// Assuming park-0006 for now, but confirm by name
let fIndex = facilities.findIndex(f => f.name.includes("신불산"));

if (fIndex === -1) {
    // Try park-0006
    fIndex = facilities.findIndex(f => f.id === 'park-0006');
}

if (fIndex === -1) {
    console.error("❌ Facility (신불산공원묘원) not found!");
    process.exit(1);
}

const target = facilities[fIndex];
console.log(`Found Sinbulsan at ID: ${target.id}`);

// The "Perfect" Data provided by User for Sinbulsan
const perfectPricing = {
    '매장묘': {
        rows: [
            {
                name: "묘지 임대사용료",
                price: 10700000,
                description: "10,700,000원 / 평 (평 단위 임대 방식)",
                isRepresentative: true // 1,070만원부터
            }
        ]
    },
    '봉안당': {
        rows: [] // Explicitly empty to not show up
    },
    // No Tree Burial
    '옵션': {
        rows: [
            { name: "묘지 공동관리비", price: 170000, description: "1평 / 1년", isRepresentative: false },
            { name: "평토 및 바닥 작업비", price: 1500000, description: "1평 기준", isRepresentative: false },
            { name: "봉분 작업비", price: 5000000, description: "", isRepresentative: false },
            { name: "개장 정리 및 원상복구비", price: 0, description: "평수별 상이 (현장 견적)", isRepresentative: false },
            { name: "석물 옵션 일체", price: 0, description: "비석/상석/와비 등 별도 선택", isRepresentative: false }
        ]
    }
};

target.pricing = perfectPricing;

// Save
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log("✅ Sinbulsan (신불산) Data has been reset to the Gold Standard.");
console.log(JSON.stringify(perfectPricing, null, 2));
