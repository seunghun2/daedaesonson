const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../data/facilities.json');

console.log("💎 Injecting Gold Standard Data (CORRECTED) for Anseong Catholic (천주교안성추모공원)...");

const facilities = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));

// Find "천주교안성추모공원"
let fIndex = facilities.findIndex(f => f.name.includes("천주교안성추모공원"));

if (fIndex === -1 && facilities[21]) {
    // Try park-0022
    fIndex = facilities.findIndex(f => f.id === 'park-0022');
}

if (fIndex === -1) {
    console.error("❌ Facility (천주교안성추모공원/ID 22) not found!");
    process.exit(1);
}

const target = facilities[fIndex];
console.log(`Found Anseong Catholic at ID: ${target.id} (${target.name})`);

const perfectPricing = {
    '매장묘': {
        rows: [
            // Corrected Price: 8.9 Million KRW (Not 89 Million)
            {
                name: "매장(단장) 봉분 설치비",
                price: 8900000,
                description: "천주교 전용 (사용료 없음, 봉분 설치 실비)",
                isRepresentative: true // 890만원부터
            },
            {
                name: "매장(합장) 봉분 설치비",
                price: 17800000,
                description: "천주교 전용 (사용료 없음, 봉분 설치 실비)",
                isRepresentative: false
            }
        ]
    },
    '봉안당': { // No Usage Fee
        rows: [
            {
                name: "봉안당 안치 사용료",
                price: 0,
                description: "사용료 없음 (석물/장식 옵션만 별도)",
                isRepresentative: true // "사용료 없음"
            }
        ]
    },
    '수목장': {
        rows: []
    },
    '옵션': { // Minimal Stone Options
        rows: [
            // Burial Stones (Hapjang)
            { name: "묘테석 고급 (합장)", price: 2100000, description: "중국석", isRepresentative: false },
            { name: "비석 고급 (합장)", price: 560000, description: "중국석", isRepresentative: false },
            { name: "상석 고급 (합장)", price: 560000, description: "중국석", isRepresentative: false },

            // Charnel Stones (Danjang)
            { name: "묘테석 고급 (단장)", price: 1850000, description: "중국석", isRepresentative: false },
            { name: "묘테석 기본 (단장)", price: 401000, description: "중국석", isRepresentative: false },
            { name: "비석 고급 (단장)", price: 560000, description: "중국석", isRepresentative: false },
            { name: "비석 기본 (단장)", price: 290000, description: "중국석", isRepresentative: false },

            // Accessories
            { name: "향로/화병 (고급)", price: 100000, description: "각 10만원", isRepresentative: false },
            { name: "비석 받침", price: 13000, description: "부속품", isRepresentative: false }
        ]
    }
};

target.pricing = perfectPricing;

// Save
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log("✅ Anseong Catholic (천주교안성추모공원) Data has been CORRECTED.");
console.log(JSON.stringify(perfectPricing, null, 2));
