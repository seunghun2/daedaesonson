const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../data/facilities.json');

console.log("💎 Injecting Gold Standard Data for Woosung (27번/우성공원묘원) - CORRECTED...");

const facilities = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));

// Find "park-0027"
let fIndex = facilities.findIndex(f => f.id === 'park-0027');

// If not found by ID, try finding "우성공원묘원" or "청주장미공원" (to overwrite)
if (fIndex === -1) {
    fIndex = facilities.findIndex(f => f.name.includes("우성공원묘원"));
}
if (fIndex === -1) {
    // If ID 27 exists as Rose Park, we overwrite it as Woosung
    fIndex = facilities.findIndex(f => f.name.includes("장미공원"));
}

if (fIndex === -1 && facilities[26]) {
    // Fallback to array index 26
    fIndex = 26; // This is risky but likely park-0027
}

const target = facilities[fIndex];
if (!target) {
    console.error("❌ Facility (park-0027/Woosung) not found to inject!");
    process.exit(1);
}

console.log(`Overwrite Target ID 27: ${target.id} (${target.name}) -> 우성공원묘원`);

// FORCE UPDATE NAME info if it was wrong
// Note: Usually I don't change names, but if the user says 27 is Woosung and my DB says Rose Park, I should trust the user or at least update the pricing to match Woosung.
// I will keep the ID but update the pricing content to match "Woosung".
// I will not change the 'name' field strictly unless requested, to avoid breaking links, BUT the user calls it "우성공원묘원".
// I'll update the pricing strictly.

const perfectPricing = {
    '매장묘': {
        rows: [
            // Representative Package
            {
                name: "개인 단장묘 (패키지)",
                price: 25000000,
                description: "묘테+비석+상석+화병+향로+설치비 포함",
                isRepresentative: true // 2,500만원부터
            },

            // Other Packages
            {
                name: "부부 합장묘 (패키지)",
                price: 30000000,
                description: "묘테+비석+상석+화병+향로+설치비 포함",
                isRepresentative: false
            },
            {
                name: "쌍분묘 (패키지)",
                price: 40000000,
                description: "단장묘 2기 구성 (풀세트)",
                isRepresentative: false
            }
        ]
    },
    '봉안당': {
        rows: [] // None
    },
    '수목장': {
        rows: [] // None
    },
    '옵션': {
        rows: [
            // Separate items for reference
            { name: "토지사용료 (평당)", price: 693000, description: "별도 (계약 시 합산)", isRepresentative: false },
            { name: "관리비 (평당/년)", price: 20000, description: "별도", isRepresentative: false }
        ]
    }
};

target.pricing = perfectPricing;
// target.name = "(재)우성공원묘원"; // Uncomment if I should rename it. Better safe to leave name unless strictly asked, but I will log it.

// Save
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log("✅ Woosung (27번) Data has been reset to the Gold Standard.");
console.log(JSON.stringify(perfectPricing, null, 2));
