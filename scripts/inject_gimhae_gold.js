const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../data/facilities.json');

console.log("💎 Injecting Gold Standard Data for Gimhae Park (김해공원묘원)...");

const facilities = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));

// Find "김해공원묘원"
let fIndex = facilities.findIndex(f => f.name.includes("김해공원묘원"));

if (fIndex === -1 && facilities[15]) {
    // Try park-0016
    fIndex = facilities.findIndex(f => f.id === 'park-0016');
}

if (fIndex === -1) {
    console.error("❌ Facility (김해공원묘원/ID 16) not found!");
    process.exit(1);
}

const target = facilities[fIndex];
console.log(`Found Gimhae Park at ID: ${target.id} (${target.name})`);

const perfectPricing = {
    '매장묘': {
        rows: [
            {
                name: "묘지 사용료 (평당)",
                price: 8300000,
                description: "1평 기준 순수 사용료",
                isRepresentative: true // 830만원부터
            },
            {
                name: "1.5평 1기 세트",
                price: 5600000,
                description: "묘지 + 석물 포함 (소형)",
                isRepresentative: false
            },
            {
                name: "2평 1기 세트",
                price: 7200000,
                description: "묘지 + 석물 포함",
                isRepresentative: false
            },
            {
                name: "부부 평장",
                price: 6000000,
                description: "부부형 평장묘",
                isRepresentative: false
            },
            {
                name: "3평 1기 세트",
                price: 8900000,
                description: "묘지 + 석물 포함 (중형)",
                isRepresentative: false
            },
            {
                name: "2기 세트 (가묘포함)",
                price: 11600000,
                description: "1,160만원 ~",
                isRepresentative: false
            }
        ]
    },
    '봉안당': { // 납골묘지
        rows: [
            {
                name: "납골묘 (4기형)",
                price: 9500000,
                description: "가족 봉안묘 (최소형)",
                isRepresentative: true // 950만원부터
            },
            {
                name: "납골묘 (10기형)",
                price: 16200000,
                description: "대가족 봉안묘",
                isRepresentative: false
            }
        ]
    },
    '수목장': {
        rows: []
    },
    '옵션': {
        rows: [
            // Management Fee
            { name: "연간 관리비", price: 160000, description: "평당 / 1년", isRepresentative: false },

            // Stone Works
            { name: "상석 / 비석", price: 800000, description: "60~80만원대", isRepresentative: false },
            { name: "오비석", price: 1000000, description: "90~100만원", isRepresentative: false },
            { name: "둘레석", price: 2900000, description: "160~290만원", isRepresentative: false }
        ]
    }
};

target.pricing = perfectPricing;

// Save
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log("✅ Gimhae Park (김해공원묘원) Data has been reset to the Gold Standard.");
console.log(JSON.stringify(perfectPricing, null, 2));
