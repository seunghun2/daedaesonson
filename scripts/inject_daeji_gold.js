const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../data/facilities.json');

console.log("💎 Injecting Gold Standard Data for Daeji (대지공원묘원)...");

const facilities = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));

// Find "대지공원묘원"
let fIndex = facilities.findIndex(f => f.name.includes("대지공원묘원"));

if (fIndex === -1) {
    if (facilities[7]) console.log("Checking ID park-0008: " + facilities[7].name);
    // Try park-0008
    fIndex = facilities.findIndex(f => f.id === 'park-0008');
}

if (fIndex === -1) {
    console.error("❌ Facility (대지공원묘원) not found!");
    process.exit(1);
}

const target = facilities[fIndex];
console.log(`Found Daeji at ID: ${target.id}`);

const perfectPricing = {
    '매장묘': {
        rows: [
            {
                name: "공원묘지 사용료",
                price: 12000000,
                description: "1,200만원 / 평 (0.3㎡ / 3.3㎡ 기준)",
                isRepresentative: true // 1,200만원부터
            }
        ]
    },
    '봉안당': {
        rows: [
            { name: "대지 납골 기본 (2기)", price: 3000000, description: "최소 진입 상품", isRepresentative: true },
            { name: "대지 납골 기본 (4기)", price: 5000000, description: "", isRepresentative: false },
            { name: "대지 납골 기본 (10기)", price: 6000000, description: "", isRepresentative: false },
            { name: "대형 납골 (12기)", price: 10000000, description: "", isRepresentative: false },
            { name: "대형 납골 (16기)", price: 11000000, description: "", isRepresentative: false },
            { name: "대형 납골 (24기)", price: 13000000, description: "가족형 대형 납골", isRepresentative: false }
        ]
    },
    '옵션': {
        rows: [
            // Management
            { name: "연간 관리비", price: 170000, description: "1평 / 1년 기준", isRepresentative: false },

            // Stone Options - 1 Dan
            { name: "화병 (1단 단장)", price: 90000, description: "", isRepresentative: false },
            { name: "상석 (1단 단장)", price: 110000, description: "", isRepresentative: false },
            { name: "비석 (1단 단장)", price: 330000, description: "", isRepresentative: false },

            // Stone Options - 3 Dan
            { name: "화병 (3단 단장)", price: 145000, description: "", isRepresentative: false },
            { name: "상석 (3단 단장)", price: 284000, description: "", isRepresentative: false },
            { name: "비석 (3단 단장)", price: 710000, description: "", isRepresentative: false },

            // Individual Stones
            { name: "비석 (301형)", price: 490000, description: "", isRepresentative: false },
            { name: "비석 (503·602형)", price: 660000, description: "", isRepresentative: false },
            { name: "비석 (102형)", price: 900000, description: "", isRepresentative: false },
            { name: "상석 (503·602형)", price: 580000, description: "", isRepresentative: false },
            { name: "상석 (803형)", price: 1100000, description: "", isRepresentative: false },
            { name: "상석 (102형)", price: 1200000, description: "", isRepresentative: false },

            // Duleseok / Myote
            { name: "1단 둘레석", price: 792000, description: "", isRepresentative: false },
            { name: "묘테 1단", price: 980000, description: "", isRepresentative: false },
            { name: "묘테 2단", price: 1600000, description: "", isRepresentative: false },
            { name: "묘테 3단", price: 2300000, description: "~ 2,900,000원", isRepresentative: false },
            { name: "단장용 3단 둘레석", price: 2337000, description: "", isRepresentative: false },

            // Hapjang
            { name: "합장용 3단 상석", price: 705000, description: "~ 839,000원", isRepresentative: false },
            { name: "합장용 3단 비석", price: 1082000, description: "~ 1,312,000원", isRepresentative: false },
            { name: "합장용 3단 둘레석 세트", price: 2546000, description: "~ 2,784,000원", isRepresentative: false },
            { name: "갓비석 (4자)", price: 2500000, description: "", isRepresentative: false }
        ]
    }
};

target.pricing = perfectPricing;

// Save
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log("✅ Daeji (대지공원묘원) Data has been reset to the Gold Standard.");
console.log(JSON.stringify(perfectPricing, null, 2));
