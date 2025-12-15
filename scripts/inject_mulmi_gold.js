const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../data/facilities.json');

console.log("💎 Injecting Gold Standard Data for Mulmi (물미묘원)...");

const facilities = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));

// Find "물미묘원"
let fIndex = facilities.findIndex(f => f.name.includes("물미묘원"));

if (fIndex === -1 && facilities[20]) {
    // Try park-0021
    fIndex = facilities.findIndex(f => f.id === 'park-0021');
}

if (fIndex === -1) {
    console.error("❌ Facility (물미묘원/ID 21) not found!");
    process.exit(1);
}

const target = facilities[fIndex];
console.log(`Found Mulmi at ID: ${target.id} (${target.name})`);

const perfectPricing = {
    '매장묘': {
        rows: [
            // Lowest Price (Local) - Representative
            {
                name: "단장 사용료 (지역주민)",
                price: 2868000,
                description: "신일리/2리/4리 주민 전용 (관리비/석물 별도)",
                isRepresentative: true // 286만원부터
            },

            // Other Residents
            { name: "단장 사용료 (감면대상)", price: 3200000, description: "기초수급, 병역명문가 등", isRepresentative: false },
            { name: "단장 사용료 (주천면)", price: 6214000, description: "주천면 주민", isRepresentative: false },
            { name: "단장 사용료 (일반)", price: 6400000, description: "일반 영월군민", isRepresentative: false },

            // Couple
            { name: "합장 사용료 (지역주민)", price: 4308000, description: "최저가 기준", isRepresentative: false },
            { name: "합장 사용료 (일반)", price: 9600000, description: "일반 영월군민", isRepresentative: false }
        ]
    },
    '봉안당': {
        rows: [
            // Personal
            {
                name: "개인단 사용료 (지역주민)",
                price: 1800000,
                description: "신일리/2리/4리 주민 전용",
                isRepresentative: true // 180만원부터
            },
            { name: "개인단 사용료 (일반)", price: 6000000, description: "일반 영월군민", isRepresentative: false },

            // Couple
            { name: "부부단 사용료 (지역주민)", price: 3600000, description: "최저가 기준", isRepresentative: false },
            { name: "부부단 사용료 (일반)", price: 12000000, description: "일반 영월군민", isRepresentative: false }
        ]
    },
    '수목장': {
        rows: [
            // None
        ]
    },
    '옵션': { // Essential "Hidden" Costs for Public Facilities
        rows: [
            // Burial Fees
            { name: "매장비 (단장)", price: 480000, description: "작업비", isRepresentative: false },
            { name: "매장비 (합장)", price: 580000, description: "작업비", isRepresentative: false },

            // Stone Fees
            { name: "석물비 (단장)", price: 1129000, description: "필수 석물", isRepresentative: false },
            { name: "석물비 (합장)", price: 1366000, description: "필수 석물", isRepresentative: false },
            { name: "석물 설치비", price: 100000, description: "설치 공임", isRepresentative: false },

            // Management Fee (Lump sum potentially?)
            { name: "관리비 (단장)", price: 3000000, description: "사용 기간 분 (별도 확인 필요)", isRepresentative: false }
        ]
    }
};

target.pricing = perfectPricing;

// Save
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log("✅ Mulmi (물미묘원) Data has been reset to the Gold Standard.");
console.log(JSON.stringify(perfectPricing, null, 2));
