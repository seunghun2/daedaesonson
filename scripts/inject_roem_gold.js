const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../data/facilities.json');

console.log("💎 Injecting Gold Standard Data for Roem (로엠)...");

const facilities = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));

// Find "로엠"
let fIndex = facilities.findIndex(f => f.name.includes("로엠") || f.name.includes("로뎀")); // Typos happen, checking strict ID mostly

if (fIndex === -1 && facilities[10]) {
    // Try park-0011 (Array index 10 is usually ID 11 if sorted, but safe to check ID)
    fIndex = facilities.findIndex(f => f.id === 'park-0011');
}

if (fIndex === -1) {
    console.error("❌ Facility (로엠/ID 11) not found!");
    process.exit(1);
}

const target = facilities[fIndex];
console.log(`Found Roem at ID: ${target.id} (${target.name})`);

const perfectPricing = {
    '매장묘': {
        rows: [
            {
                name: "묘지 사용료",
                price: 3329000,
                description: "1㎡ 기준 (기본 사용료)",
                isRepresentative: true // 332만원부터
            },
            { name: "평안단 일반형 1세트", price: 4300000, description: "석물 세트 (사용료 별도)", isRepresentative: false },
            { name: "평안단 일반형(상위)", price: 5600000, description: "석물 세트 (사용료 별도)", isRepresentative: false },
            { name: "평안단 고급형 / 3단", price: 6400000, description: "고급 석물 세트", isRepresentative: false },
            { name: "공작단 일반형", price: 6500000, description: "~ 8,300,000원 (선택형)", isRepresentative: false },
            { name: "공작단 고급형 / 2단", price: 9000000, description: "~ 10,400,000원", isRepresentative: false }
        ]
    },
    '봉안당': {
        rows: [
            {
                name: "봉안 안장 작업비",
                price: 250000,
                description: "기본 안장 비용 (사용료 별도)",
                isRepresentative: true // 25만원부터
            }
        ]
    },
    '옵션': {
        rows: [
            // Management
            { name: "연간 관리비", price: 70000, description: "1㎡ / 1년", isRepresentative: false },

            // Work Fees
            { name: "안장 작업비 (매장묘)", price: 1500000, description: "", isRepresentative: false },
            { name: "개장 작업비 (단장묘)", price: 1880000, description: "", isRepresentative: false },
            { name: "개장 작업비 (합장묘)", price: 2300000, description: "", isRepresentative: false },
            { name: "개장 석물 폐기", price: 490000, description: "", isRepresentative: false },

            // Stone / Engraving Options
            { name: "비석 각자비 (대)", price: 14000, description: "1글자 당", isRepresentative: false },
            { name: "비석 각자비 (마크)", price: 66000, description: "개당", isRepresentative: false },
            { name: "각자 공임비 (와비)", price: 66000, description: "건당", isRepresentative: false },
            { name: "석물 경보수", price: 88000, description: "", isRepresentative: false },
            { name: "석물 중보수", price: 220000, description: "", isRepresentative: false },
            { name: "석물 해체·조립", price: 880000, description: "", isRepresentative: false },

            // Services
            { name: "천막 설치비", price: 150000, description: "장례 편의", isRepresentative: false },
            { name: "갈비탕 (식사)", price: 10000, description: "1인 기준", isRepresentative: false }
        ]
    }
};

target.pricing = perfectPricing;

// Save
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log("✅ Roem (로엠) Data has been reset to the Gold Standard.");
console.log(JSON.stringify(perfectPricing, null, 2));
