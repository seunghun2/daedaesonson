const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../data/facilities.json');

console.log("💎 Injecting Gold Standard Data for Haneulnara Pocheon (하늘나라공원 포천묘원)...");

const facilities = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));

// Find "하늘나라공원"
let fIndex = facilities.findIndex(f => f.name.includes("하늘나라공원") || f.name.includes("포천묘원"));

if (fIndex === -1 && facilities[23]) {
    // Try park-0024
    fIndex = facilities.findIndex(f => f.id === 'park-0024');
}

if (fIndex === -1) {
    console.error("❌ Facility (하늘나라공원 포천묘원/ID 24) not found!");
    process.exit(1);
}

const target = facilities[fIndex];
console.log(`Found Haneulnara Pocheon at ID: ${target.id} (${target.name})`);

const perfectPricing = {
    '매장묘': {
        rows: [
            // Land Usage Fee (Representative)
            {
                name: "매장묘 토지사용료 (15년)",
                price: 9620000,
                description: "평당 사용료 (작업비/석물 별도)",
                isRepresentative: true // 962만원부터
            },

            // Cremated Remains (Has price as 'work fee')
            {
                name: "유골합장 (기본)",
                price: 8000000,
                description: "유골 매장 작업비 포함",
                isRepresentative: true // 800만원부터 (유골 섹션 대표)
            },

            // High Cost Work Fees
            {
                name: "시신 매장 작업비",
                price: 19000000,
                description: "1기당 (고가 작업비 주의)",
                isRepresentative: false
            },
            {
                name: "재래식 유골매장비 (합장)",
                price: 19000000,
                description: "전통 방식",
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
    '옵션': { // Detailed breakdown of stone/works/management
        rows: [
            // Management Fee
            { name: "묘지 관리비", price: 14700, description: "평당 / 연납", isRepresentative: false },
            { name: "공동 관리비", price: 147000, description: "평당", isRepresentative: false },

            // Work Fees (Structure)
            { name: "축대 작업비", price: 10000000, description: "평당 (필요 시)", isRepresentative: false },
            { name: "분상 보수 작업비", price: 1800000, description: "평당", isRepresentative: false },

            // Stone Re-assembly
            { name: "석물 재조립 (단묘테 1단)", price: 1000000, description: "", isRepresentative: false },
            { name: "석물 재조립 (합장묘테)", price: 1200000, description: "", isRepresentative: false },
            { name: "석물 재조립 (화강 둘레석)", price: 2000000, description: "", isRepresentative: false },

            // Representative Stones
            { name: "상석 (2.5자 화강석)", price: 800000, description: "중국산", isRepresentative: false },
            { name: "비석 (1.8자 평오석와비)", price: 550000, description: "중국산", isRepresentative: false },
            { name: "화병 (화석분 1세트)", price: 240000, description: "중국산", isRepresentative: false },
            { name: "묘테 1단 (합장)", price: 2500000, description: "화강석 (중국)", isRepresentative: false },
            { name: "묘테 2단 (합장)", price: 3500000, description: "화강석 (중국)", isRepresentative: false }
        ]
    }
};

target.pricing = perfectPricing;

// Save
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log("✅ Haneulnara Pocheon (하늘나라공원) Data has been reset to the Gold Standard.");
console.log(JSON.stringify(perfectPricing, null, 2));
