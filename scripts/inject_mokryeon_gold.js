const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../data/facilities.json');

console.log("💎 Injecting Gold Standard Data for Mokryeon (목련공원묘원)...");

const facilities = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));

// Find "목련공원묘원"
let fIndex = facilities.findIndex(f => f.name.includes("목련공원묘원"));

if (fIndex === -1 && facilities[19]) {
    // Try park-0020
    fIndex = facilities.findIndex(f => f.id === 'park-0020');
}

if (fIndex === -1) {
    console.error("❌ Facility (목련공원묘원/ID 20) not found!");
    process.exit(1);
}

const target = facilities[fIndex];
console.log(`Found Mokryeon at ID: ${target.id} (${target.name})`);

const perfectPricing = {
    '매장묘': {
        rows: [
            // Base Entry (The Representative)
            {
                name: "묘지 사용료 (1평 기준)",
                price: 12000000,
                description: "순수 사용료 (석물/관리비 별도)",
                isRepresentative: true // 1,200만원부터
            },

            // All-in-one Packages (High Cost)
            { name: "표준 평장묘 (패키지)", price: 51000000, description: "석물+설치+5년관리비+안치비 포함", isRepresentative: false },
            { name: "고급 평장묘 (패키지)", price: 92000000, description: "석물+설치+5년관리비+안치비 포함", isRepresentative: false },
            { name: "단장 (패키지)", price: 105000000, description: "석물+설치+5년관리비+안치비 포함", isRepresentative: false },
            { name: "합장 (패키지)", price: 189000000, description: "석물+설치+5년관리비+안치비 포함", isRepresentative: false },
            { name: "복합형 쌍묘 (패키지)", price: 296000000, description: "최고급 패키지", isRepresentative: false }
        ]
    },
    '봉안당': {
        rows: [
            {
                name: "개인형 봉안담",
                price: 23000000,
                description: "5년 관리비 포함",
                isRepresentative: true // 2,300만원부터
            },
            {
                name: "부부형 봉안담",
                price: 45000000,
                description: "5년 관리비 포함",
                isRepresentative: false
            },
            {
                name: "개인형 봉안묘 (0.5평)",
                price: 55000000,
                description: "석물+5년관리비+안치비 포함",
                isRepresentative: false
            }
        ]
    },
    '수목장': {
        rows: [
            {
                name: "수목장 개인묘",
                price: 30000000,
                description: "표지석+사용료+2년관리비 포함",
                isRepresentative: true // 3,000만원부터
            },
            {
                name: "수목장 부부묘",
                price: 44000000,
                description: "표지석+사용료+2년관리비 포함",
                isRepresentative: false
            },
            {
                name: "수목장 가족묘",
                price: 105000000,
                description: "표지석+사용료+2년관리비 포함",
                isRepresentative: false
            }
        ]
    },
    '옵션': {
        rows: [
            // Management Fee
            { name: "연간 관리비 (묘지)", price: 190000, description: "평당 / 1년 (패키지는 5년 포함됨)", isRepresentative: false },

            // Family Packages (Reference)
            { name: "가족형 위 (1.5평)", price: 125000000, description: "패키지", isRepresentative: false },
            { name: "가족형 위 (5평)", price: 256000000, description: "패키지", isRepresentative: false }
        ]
    }
};

target.pricing = perfectPricing;

// Save
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log("✅ Mokryeon (목련공원묘원) Data has been reset to the Gold Standard.");
console.log(JSON.stringify(perfectPricing, null, 2));
