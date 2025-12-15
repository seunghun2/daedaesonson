const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../data/facilities.json');

console.log("💎 Injecting Gold Standard Data for Sotbalsan (솥발산)...");

const facilities = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));

// Find "솥발산공원묘원"
let fIndex = facilities.findIndex(f => f.name.includes("솥발산"));

if (fIndex === -1 && facilities[9]) {
    // Try park-0010
    fIndex = facilities.findIndex(f => f.id === 'park-0010');
}

if (fIndex === -1) {
    console.error("❌ Facility (솥발산공원묘원) not found!");
    process.exit(1);
}

const target = facilities[fIndex];
console.log(`Found Sotbalsan at ID: ${target.id}`);

const perfectPricing = {
    '매장묘': {
        rows: [
            {
                name: "묘지 임대 사용료",
                price: 14000000,
                description: "기본 사용료 (1,400만원부터)",
                isRepresentative: true // 1,400만원부터
            },
            { name: "평장 개인형 세트", price: 2900000, description: "부속 석물 + 작업비 포함", isRepresentative: false },
            { name: "평장 합장형 세트", price: 3850000, description: "석물+작업비+각자비 포함", isRepresentative: false },
            { name: "기본 석물 세트", price: 4250000, description: "~ 5,500,000원 (둘레석 포함)", isRepresentative: false }
        ]
    },
    '봉안당': {
        rows: [
            { name: "6기형 가족봉안묘", price: 12150000, description: "세트 (봉안묘+비석+상석+향로+화병)", isRepresentative: true }, // 1,215만원부터
            { name: "16기형 가족봉안묘", price: 20200000, description: "", isRepresentative: false },
            { name: "20기형 가족봉안묘", price: 24300000, description: "", isRepresentative: false },
            { name: "24기형 가족봉안묘", price: 35600000, description: "", isRepresentative: false }
        ]
    },
    '옵션': {
        rows: [
            // Management
            { name: "공동관리비", price: 200000, description: "1년 기준", isRepresentative: false },

            // Work Fees
            { name: "매장 작업비 (기본)", price: 1500000, description: "", isRepresentative: false },
            { name: "장례 작업비 (인건비)", price: 15000000, description: "", isRepresentative: false },
            { name: "개장 정리비", price: 7000000, description: "", isRepresentative: false },
            { name: "사초 작업비", price: 600000, description: "60만원부터", isRepresentative: false },
            { name: "봉안료 추가", price: 500000, description: "", isRepresentative: false },
            { name: "봉안 장례 작업비", price: 5000000, description: "", isRepresentative: false },

            // Stone Options - Duleseok
            { name: "사각 둘레석 (1.5~2.5평)", price: 3100000, description: "", isRepresentative: false },
            { name: "사각 둘레석 (3평 이상)", price: 3500000, description: "", isRepresentative: false },
            { name: "최고급 둘레석 (무궁화)", price: 11000000, description: "무궁화 조각", isRepresentative: false },

            // Stone Options - Single
            { name: "비석 (중국산)", price: 500000, description: "~ 1,900,000원", isRepresentative: false },
            { name: "상석 (고흥석 A급)", price: 300000, description: "~ 800,000원", isRepresentative: false },
            { name: "상석 (애석/영주석)", price: 950000, description: "", isRepresentative: false },
            { name: "상석 (오석)", price: 1650000, description: "", isRepresentative: false },
            { name: "각자비 (기본)", price: 300000, description: "", isRepresentative: false }
        ]
    }
};

target.pricing = perfectPricing;

// Save
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log("✅ Sotbalsan (솥발산) Data has been reset to the Gold Standard.");
console.log(JSON.stringify(perfectPricing, null, 2));
