const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../data/facilities.json');

console.log("💎 Injecting Gold Standard Data for Dongsan (35번/동산공원묘원) - PHOTO VERIFIED...");

const facilities = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));

// Find "park-0035"
let fIndex = facilities.findIndex(f => f.id === 'park-0035');

// Fallback search
if (fIndex === -1) {
    fIndex = facilities.findIndex(f => f.name.includes("동산공원"));
}

if (fIndex === -1 && facilities[35]) {
    fIndex = 35;
}


const target = facilities[fIndex];
if (!target) {
    console.error("❌ Facility (park-0035/Dongsan) not found!");
    process.exit(1);
}
console.log(`Found ID 35: ${target.id} (${target.name})`);

const perfectPricing = {
    '매장묘': {
        rows: [
            // Representative Entry (Land Fee)
            {
                name: "묘지사용료 (1평/3.3㎡)",
                price: 900000,
                description: "토지 사용료 (설치비/관리비 별도)",
                isRepresentative: true // 90만원부터
            },

            // Other Types (Product Price Only)
            {
                name: "평장묘 1기 (2.4㎡)",
                price: 1050000,
                description: "석물비 (설치비/토지 별도)",
                isRepresentative: false
            },
            {
                name: "평장묘 2기 (4.8㎡)",
                price: 2100000,
                description: "석물비 (설치비/토지 별도)",
                isRepresentative: false
            },
            {
                name: "사각묘 (12㎡)",
                price: 3500000,
                description: "석물비 (설치비/토지 별도)",
                isRepresentative: false
            },
            {
                name: "원형묘 합장 (18㎡)",
                price: 3700000,
                description: "석물비 (설치비/토지 별도)",
                isRepresentative: false
            }
        ]
    },
    '봉안당': {
        rows: [
            // Representative Entry (Full Package)
            {
                name: "봉안담 (10년 패키지)",
                price: 1300000,
                description: "사용료+설치비+관리비10년 포함",
                isRepresentative: true // 130만원부터
            },

            // Other Types
            {
                name: "봉안묘 1기 (2.4㎡)",
                price: 2000000,
                description: "석물비 (설치비/토지 별도)",
                isRepresentative: false
            },
            {
                name: "봉안묘 2기 (4.8㎡)",
                price: 2800000,
                description: "석물비 (설치비/토지 별도)",
                isRepresentative: false
            },
            {
                name: "가족봉안묘 (8기/19.2㎡)",
                price: 7500000,
                description: "석물비 (설치비/토지 별도)",
                isRepresentative: false
            }
        ]
    },
    '수목장': {
        rows: []
    },
    '옵션': {
        rows: [
            { name: "설치비 (평당/3.3㎡)", price: 400000, description: "별도 필수", isRepresentative: false },
            { name: "묘지관리비 (평당/연)", price: 15000, description: "별도", isRepresentative: false },
            { name: "고령토/명당토 (포)", price: 20000, description: "사각/원형묘 20포 소요", isRepresentative: false },
            { name: "석등", price: 750000, description: "선택", isRepresentative: false },
            { name: "사자상 (1쌍)", price: 1200000, description: "선택", isRepresentative: false },
            { name: "글자비 (대/자당)", price: 7000, description: "소 1,500원", isRepresentative: false }
        ]
    }
};

target.pricing = perfectPricing;

// Save
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log("✅ Dongsan (35번) Data has been reset to the User's Gold Standard.");
console.log(JSON.stringify(perfectPricing, null, 2));
