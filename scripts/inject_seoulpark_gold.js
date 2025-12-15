const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../data/facilities.json');

console.log("💎 Injecting Gold Standard Data for Seoul Park (서울공원묘원)...");

const facilities = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));

// Find "서울공원묘원"
let fIndex = facilities.findIndex(f => f.name.includes("서울공원묘원"));

if (fIndex === -1 && facilities[12]) {
    // Try park-0013 (Array index 12 is usually ID 13)
    fIndex = facilities.findIndex(f => f.id === 'park-0013');
}

if (fIndex === -1) {
    console.error("❌ Facility (서울공원묘원/ID 13) not found!");
    process.exit(1);
}

const target = facilities[fIndex];
console.log(`Found Seoul Park at ID: ${target.id} (${target.name})`);

const perfectPricing = {
    '매장묘': {
        rows: [
            {
                name: "평장묘 (2~4기)",
                price: 8900000,
                description: "관리비 5년 포함 (평당 약 200만원)",
                isRepresentative: true // 890만원부터
            },
            {
                name: "평장묘 (8기)",
                price: 13100000,
                description: "가족 평장묘 (관리비 포함)",
                isRepresentative: false
            },
            {
                name: "단분 (매장묘)",
                price: 14100000,
                description: "전통 매장묘 (관리비 포함)",
                isRepresentative: false
            },
            {
                name: "합장묘",
                price: 18300000,
                description: "2위 안치 (관리비 포함)",
                isRepresentative: false
            },
            {
                name: "쌍분",
                price: 22500000,
                description: "부부형 매장묘 (관리비 포함)",
                isRepresentative: false
            }
        ]
    },
    '봉안당': { // 봉안담
        rows: [
            {
                name: "봉안담 개인단 (1단)",
                price: 2160000,
                description: "5년 관리비 포함 (최저 진입가)",
                isRepresentative: true // 216만원부터
            },
            { name: "봉안담 개인단 (8단)", price: 2660000, description: "5년 관리비 포함", isRepresentative: false },
            { name: "봉안담 개인단 (2단)", price: 3160000, description: "5년 관리비 포함", isRepresentative: false },
            { name: "봉안담 개인단 (7단)", price: 3660000, description: "5년 관리비 포함", isRepresentative: false },
            { name: "봉안담 개인단 (3단)", price: 4160000, description: "5년 관리비 포함 (로얄단)", isRepresentative: false },
            { name: "봉안담 개인단 (6단)", price: 4660000, description: "5년 관리비 포함 (로얄단)", isRepresentative: false },

            // Couple
            { name: "봉안담 부부단 (1단)", price: 3350000, description: "5년 관리비 포함", isRepresentative: false },
            { name: "봉안담 부부단 (2단)", price: 5450000, description: "5년 관리비 포함", isRepresentative: false },
            { name: "봉안담 부부단 (5단)", price: 8550000, description: "최고 로얄단 (5년 관리비 포함)", isRepresentative: false }
        ]
    },
    '수목장': {
        rows: [
            // No data
        ]
    },
    '옵션': {
        rows: [
            // Annual Management Fees (Reference)
            { name: "연간 관리비 (매장묘)", price: 20000, description: "평당 / 1년", isRepresentative: false },
            { name: "연간 관리비 (봉안담 개인)", price: 32000, description: "1위 / 1년", isRepresentative: false },
            { name: "연간 관리비 (봉안담 부부)", price: 51000, description: "2위 / 1년", isRepresentative: false },

            // Refund Policy Notice
            { name: "[환불규정] 매장묘", price: 0, description: "설묘 후 환불 불가", isRepresentative: false },
            { name: "[환불규정] 봉안담", price: 0, description: "공정위 표준약관 기준", isRepresentative: false }
        ]
    }
};

target.pricing = perfectPricing;

// Save
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log("✅ Seoul Park (서울공원묘원) Data has been reset to the Gold Standard.");
console.log(JSON.stringify(perfectPricing, null, 2));
