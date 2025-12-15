const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../data/facilities.json');

console.log("💎 Injecting Gold Standard Data for Boryeong Moran (보령시모란공원)...");

const facilities = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));

// Find "보령시모란공원"
let fIndex = facilities.findIndex(f => f.name.includes("보령시모란공원"));

if (fIndex === -1 && facilities[17]) {
    // Try park-0018 (ID 17 is usually facility 18 if sequential, but let's check id)
    fIndex = facilities.findIndex(f => f.id === 'park-0018');
}

if (fIndex === -1) {
    console.error("❌ Facility (보령시모란공원/ID 18) not found!");
    process.exit(1);
}

const target = facilities[fIndex];
console.log(`Found Boryeong Moran at ID: ${target.id} (${target.name})`);

const perfectPricing = {
    '매장묘': {
        rows: [
            // Standard (Local, At Burial) - Representative
            {
                name: "단장 A형 (관내 · 안장시)",
                price: 22160000,
                description: "18㎡ (석물+매장비 포함)",
                isRepresentative: true // 2,216만원부터
            },
            {
                name: "단장 B형 (관내 · 안장시)",
                price: 24860000,
                description: "25㎡ (석물+매장비 포함)",
                isRepresentative: false
            },
            {
                name: "합장 A형 (관내 · 안장시)",
                price: 28100000,
                description: "30㎡ (석물+매장비 포함)",
                isRepresentative: false
            },
            {
                name: "합장 B형 (관내 · 안장시)",
                price: 28100000,
                description: "36㎡ (석물+매장비 포함)",
                isRepresentative: false
            },
            {
                name: "합장 C형 (관내 · 안장시)",
                price: 28100000,
                description: "42㎡ (석물+매장비 포함)",
                isRepresentative: false
            },

            // Exterior (Reference)
            {
                name: "합장 A형 (관외)",
                price: 60000000,
                description: "관외 거주자 요금",
                isRepresentative: false
            },
            {
                name: "합장 B형 (관외)",
                price: 72000000,
                description: "관외 거주자 요금",
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
    '옵션': { // High cost contract fees moved here or kept as separate category if too high? 
        // Request says "계약시 고가 구간" -> Included as '기타(고가 계약)' category for clarity
        rows: [
            { name: "합장 A형 (관내·계약시)", price: 90000000, description: "사용료+관리비 선납 (예약)", isRepresentative: false },
            { name: "합장 B형 (관내·계약시)", price: 108000000, description: "사용료+관리비 선납 (예약)", isRepresentative: false },
            { name: "합장 C형 (관내·계약시)", price: 126000000, description: "사용료+관리비 선납 (예약)", isRepresentative: false },

            // Ultra High (Other)
            { name: "단장 A형 (기타·계약시)", price: 99000000, description: "관리비 포함", isRepresentative: false },
            { name: "합장 C형 (기타·계약시)", price: 231000000, description: "관리비 포함", isRepresentative: false }
        ]
    }
};

target.pricing = perfectPricing;

// Save
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log("✅ Boryeong Moran (보령시모란공원) Data has been reset to the Gold Standard.");
console.log(JSON.stringify(perfectPricing, null, 2));
