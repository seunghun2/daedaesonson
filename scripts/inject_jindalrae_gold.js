const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../data/facilities.json');

console.log("💎 Injecting Gold Standard Data for Jindalrae (38번/진달래문화재단) - PHOTO VERIFIED...");

const facilities = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));

// Find "park-0038"
let fIndex = facilities.findIndex(f => f.id === 'park-0038');

// Fallback search
if (fIndex === -1) {
    fIndex = facilities.findIndex(f => f.name.includes("진달래"));
}
if (fIndex === -1 && facilities[38]) {
    fIndex = 38;
}


const target = facilities[fIndex];
if (!target) {
    console.error("❌ Facility (park-0038/Jindalrae) not found!");
    process.exit(1);
}
console.log(`Found ID 38: ${target.id} (${target.name})`);

const perfectPricing = {
    '매장묘': {
        rows: [
            // Representative Entry (Set Package)
            {
                name: "매장묘 단장형 set (6평)",
                price: 21450000,
                description: "석물+5년관리비 포함 (각자비 별도)",
                isRepresentative: true // 2,145만원부터
            },

            // Other Sets
            {
                name: "매장묘 합장형 set (8평)",
                price: 27750000,
                description: "석물+5년관리비 포함 (각자비 별도)",
                isRepresentative: false
            },
            {
                name: "매장묘 쌍분형 set (12평)",
                price: 39970000,
                description: "석물+5년관리비 포함 (각자비 별도)",
                isRepresentative: false
            },
            {
                name: "평장묘 6위 set (6평)",
                price: 19500000,
                description: "석물+5년관리비 포함 (각자비 별도)",
                isRepresentative: false
            },
            {
                name: "평장묘 12위 set (8평)",
                price: 25740000,
                description: "석물+5년관리비 포함 (각자비 별도)",
                isRepresentative: false
            }
        ]
    },
    '봉안당': {
        rows: [
            // Representative Entry (Lowest Bong-an Set)
            {
                name: "봉안묘 2위 set (3평)",
                price: 10315000,
                description: "석물+5년관리비 포함 (각자비 별도)",
                isRepresentative: true // 1,031만원부터
            },

            // Other Sets
            {
                name: "봉안묘 4위 set (4평)",
                price: 16920000,
                description: "석물+5년관리비 포함 (각자비 별도)",
                isRepresentative: false
            },
            {
                name: "봉안묘 8위 set (6평)",
                price: 21130000,
                description: "석물+5년관리비 포함 (각자비 별도)",
                isRepresentative: false
            },
            {
                name: "봉안묘 12위 set (6평)",
                price: 25130000,
                description: "석물+5년관리비 포함 (각자비 별도)",
                isRepresentative: false
            },
            {
                name: "봉안묘 16위 set (6평)",
                price: 28130000,
                description: "석물+5년관리비 포함 (각자비 별도)",
                isRepresentative: false
            }
        ]
    },
    '수목장': {
        rows: []
    },
    '옵션': {
        rows: [
            { name: "묘지사용 관리비 (1년/평당)", price: 21000, description: "별도 (5년 이후 갱신)", isRepresentative: false },
            { name: "각자비 (글자)", price: 0, description: "별도 문의", isRepresentative: false }
        ]
    }
};

target.pricing = perfectPricing;

// Save
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log("✅ Jindalrae (38번) Data has been reset to the User's Gold Standard.");
console.log(JSON.stringify(perfectPricing, null, 2));
