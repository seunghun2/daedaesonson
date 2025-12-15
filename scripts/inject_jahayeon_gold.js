const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../data/facilities.json');

console.log("💎 Injecting Gold Standard Data for Jahayeon Ilsan (자하연 일산)...");

const facilities = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));

// Find "자하연 일산"
let fIndex = facilities.findIndex(f => f.name.includes("자하연 일산"));

if (fIndex === -1 && facilities[13]) {
    // Try park-0014
    fIndex = facilities.findIndex(f => f.id === 'park-0014');
}

if (fIndex === -1) {
    console.error("❌ Facility (자하연 일산/ID 14) not found!");
    process.exit(1);
}

const target = facilities[fIndex];
console.log(`Found Jahayeon Ilsan at ID: ${target.id} (${target.name})`);

const perfectPricing = {
    '봉안당': {
        rows: [
            // Personal
            {
                name: "봉안담 개인단 (기본)",
                price: 20000000,
                description: "5년 관리비 포함 (최저 진입가)",
                isRepresentative: true // 2,000만원부터
            },
            { name: "봉안담 개인단 (일반)", price: 25000000, description: "5년 관리비 포함", isRepresentative: false },
            { name: "봉안담 개인단 (고급)", price: 40000000, description: "5년 관리비 포함", isRepresentative: false },
            { name: "봉안담 개인단 (최고급)", price: 45000000, description: "5년 관리비 포함", isRepresentative: false },

            // Couple
            { name: "봉안담 부부단 (기본)", price: 30000000, description: "5년 관리비 포함", isRepresentative: false },
            { name: "봉안담 부부단 (일반)", price: 40000000, description: "5년 관리비 포함", isRepresentative: false },
            { name: "봉안담 부부단 (고급)", price: 55000000, description: "5년 관리비 포함", isRepresentative: false },
            { name: "봉안담 부부단 (최고급)", price: 70000000, description: "5년 관리비 포함", isRepresentative: false },

            // Tower Type
            { name: "봉안당 탑형 (A타입)", price: 175000000, description: "프리미엄 탑형", isRepresentative: false },
            { name: "봉안당 탑형 (B타입)", price: 195000000, description: "프리미엄 탑형", isRepresentative: false },
            { name: "봉안당 탑형 (C타입)", price: 215000000, description: "프리미엄 탑형", isRepresentative: false },

            // Bong-an-wi (High-end)
            { name: "봉안위 (일반)", price: 325000000, description: "3억 2,500만원 ~", isRepresentative: false },
            { name: "봉안위 (고급)", price: 390000000, description: "최고급 봉안위", isRepresentative: false }
        ]
    },
    '수목장': { // Natural Burials (자연장)
        rows: [
            {
                name: "평장형 자연장 (기본)",
                price: 145000000,
                description: "관리비 포함 (1.45억부터)",
                isRepresentative: true // 1억 4,500만원부터
            },
            { name: "평장형 자연장 (동향)", price: 180000000, description: "프리미엄 위치", isRepresentative: false },
            { name: "평장형 자연장 (서향)", price: 190000000, description: "프리미엄 위치", isRepresentative: false },
            { name: "평장형 자연장 (북향)", price: 245000000, description: "VIP 구역", isRepresentative: false },
            { name: "평장형 자연장 (남향)", price: 265000000, description: "VVIP 구역", isRepresentative: false },

            // Bong-an-wi (Natural)
            { name: "봉안위 자연장 (A타입)", price: 240000000, description: "", isRepresentative: false },
            { name: "봉안위 자연장 (B타입)", price: 300000000, description: "", isRepresentative: false }
        ]
    },
    '매장묘': {
        rows: [
            {
                name: "매장묘 (문의)",
                price: 0,
                description: "평당 사용료만 명시 (전화 상담 필요)",
                isRepresentative: false
            }
        ]
    },
    '옵션': {
        rows: [
            { name: "관리비", price: 0, description: "모든 가격에 5년 관리비 포함됨", isRepresentative: false }
        ]
    }
};

target.pricing = perfectPricing;

// Save
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log("✅ Jahayeon Ilsan (자하연 일산) Data has been reset to the Gold Standard.");
console.log(JSON.stringify(perfectPricing, null, 2));
