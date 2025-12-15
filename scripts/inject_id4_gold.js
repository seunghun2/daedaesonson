const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../data/facilities.json');

console.log("💎 Injecting Gold Standard Data for ID 4 (Ulsan)...");

const facilities = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));

// Find ID 4 (Ulsan)
let fIndex = facilities.findIndex(f => f.id === 'park-0004');

if (fIndex === -1) {
    const found = facilities.find(f => f.name.includes("울산"));
    if (!found) {
        console.error("❌ Facility (울산공원묘원) not found!");
        process.exit(1);
    }
    console.log(`Found Ulsan at ID: ${found.id}`);
    fIndex = facilities.indexOf(found);
}

const target = facilities[fIndex];

// The "Perfect" Data provided by User for ID 4
const perfectPricing = {
    '매장묘': {
        rows: [
            {
                name: "일반 매장묘 (.5평)",
                price: 22520000,
                description: "사용료+5년관리비+작업+석물 포함 (최소단위)",
                isRepresentative: true // 2,252만원부터
            },
            {
                name: "일반 매장묘 (1평)",
                price: 32400000,
                description: "가장 기본적인 표준 매장형",
                isRepresentative: false
            },
            {
                name: "일반 매장묘 (1평, 상위 구역)",
                price: 40500000,
                description: "위치 조건이 좋은 구역",
                isRepresentative: false
            },
            {
                name: "부부 매장묘 (1평)",
                price: 75440000,
                description: "부부 합장 기준",
                isRepresentative: false
            },
            {
                name: "부부 매장묘 (1평, 상위 구역)",
                price: 105760000,
                description: "넓은 공간의 부부 매장",
                isRepresentative: false
            },
            {
                name: "고급 매장묘 (4평)",
                price: 140300000,
                description: "대형 고급 매장형",
                isRepresentative: false
            },
            {
                name: "고급 매장묘 (4평, 상위 구역)",
                price: 162700000,
                description: "최고급 매장 구성",
                isRepresentative: false
            }
        ]
    },
    '봉안당': {
        rows: [
            {
                name: "위형 봉안묘 (리모델링 기본형)",
                price: 14000000,
                description: "봉안당 최소 진입 상품",
                isRepresentative: true // 1,400만원부터
            },
            {
                name: "위형 봉안묘 (리모델링 중형)",
                price: 16200000,
                description: "",
                isRepresentative: false
            },
            {
                name: "위형 봉안묘 (리모델링 상위형)",
                price: 18400000,
                description: "",
                isRepresentative: false
            },
            {
                name: "봉안 / 평장묘 (.5~1평)",
                price: 25600000,
                description: "봉안과 평장 혼합형",
                isRepresentative: false
            },
            {
                name: "봉안 / 평장묘 (1평)",
                price: 32400000,
                description: "",
                isRepresentative: false
            },
            {
                name: "봉안 / 평장묘 (상위 구역)",
                price: 40500000,
                description: "",
                isRepresentative: false
            },
            {
                name: "봉안 / 평장묘 (대형)",
                price: 66640000,
                description: "넓은 가족 단위 봉안형",
                isRepresentative: false
            }
        ]
    },
    '옵션': {
        rows: [
            // Work Fees
            { name: "매장작업비", price: 1450000, description: "", isRepresentative: false },
            { name: "개장정리비", price: 1100000, description: "", isRepresentative: false },
            { name: "개장비", price: 1200000, description: "", isRepresentative: false },
            { name: "봉분작업비 / 봉수선", price: 1150000, description: "~ 1,450,000원", isRepresentative: false },

            // Management
            { name: "관리비 안내", price: 0, description: "최초 5년 관리비 포함", isRepresentative: false },
            { name: "관리비 (1평/1년)", price: 460000, description: "1년 기준 (추가 연장 시)", isRepresentative: false },

            // Stone Options
            { name: "향로석", price: 330000, description: "", isRepresentative: false },
            { name: "혼유석(상석)", price: 2200000, description: "~ 3,960,000원", isRepresentative: false },
            { name: "와비", price: 2750000, description: "~ 3,300,000원", isRepresentative: false },
            { name: "둘레석", price: 4400000, description: "~ 7,200,000원", isRepresentative: false },
            { name: "고급 둘레석(리모델링)", price: 8800000, description: "~ 16,500,000원", isRepresentative: false }
        ]
    }
};

target.pricing = perfectPricing;

// Save
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log("✅ ID 4 (Ulsan) Data has been reset to the Gold Standard.");
console.log(JSON.stringify(perfectPricing, null, 2));
