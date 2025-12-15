const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../data/facilities.json');
const facilities = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));

function updateFacilityByName(nameHint, pricingData) {
    const fIndex = facilities.findIndex(f => f.name.includes(nameHint));

    if (fIndex === -1) {
        console.error(`❌ Facility containing "${nameHint}" not found!`);
        return;
    }

    facilities[fIndex].pricing = pricingData;
    console.log(`✅ ${facilities[fIndex].name} (ID: ${facilities[fIndex].id}) updated.`);
}

console.log("💎 Injecting Gold Standard Data for Jahayeon, Hadari, Yeosu Catholic, Daegu City, Modori...");

// 1. (재)자하연분당(묘지) (이미지상 이름)
updateFacilityByName("자하연", {
    '매장묘': {
        rows: [
            { name: "매장묘 분양묘 (1㎡)", price: 1007479, description: "사용료 (평당 약 330만원)", isRepresentative: true },
            { name: "371번지 신규조성 분양묘 (1㎡)", price: 1641528, description: "사용료 (평당 약 540만원)", isRepresentative: false }
        ]
    },
    '옵션': {
        rows: [
            { name: "연간 관리비 (1㎡)", price: 7563, description: "매년 납부", isRepresentative: false }
        ]
    }
});

// 2. 하다리공설공원묘지
updateFacilityByName("하다리", {
    '매장묘': {
        rows: [
            { name: "사용료 (단장/15년)", price: 150000, description: "여주시민", isRepresentative: true },
            { name: "사용료 (합장/15년)", price: 225000, description: "여주시민", isRepresentative: false }
        ]
    },
    '옵션': {
        rows: [
            { name: "관리비 (단장/15년)", price: 150000, description: "15년 관리비", isRepresentative: false },
            { name: "관리비 (합장/15년)", price: 225000, description: "15년 관리비", isRepresentative: false }
        ]
    }
});

// 3. (재)광주대교구 여수천주교공원묘원
updateFacilityByName("여수천주교", {
    '매장묘': {
        rows: [
            { name: "묘지배치 (1.8평)", price: 1650000, description: "매장비, 묘비 포함", isRepresentative: true }
        ]
    },
    '봉안묘': { // 평장묘
        rows: [
            { name: "평장묘 (1인용)", price: 1000000, description: "15년 관리비 포함", isRepresentative: false },
            { name: "평장묘 (2인용)", price: 1700000, description: "15년 관리비 포함", isRepresentative: false }
        ]
    },
    '옵션': {
        rows: [
            { name: "묘지 관리비 (15년)", price: 300000, description: "15년", isRepresentative: false }
        ]
    }
});

// 4. 대구시립공원묘지
updateFacilityByName("대구시립", {
    '매장묘': {
        rows: [
            { name: "공설묘지 사용료 (30년)", price: 300000, description: "1기당 / 15년 연장 가능", isRepresentative: true }
        ]
    },
    '봉안묘': { // 봉안평장묘
        rows: [
            { name: "봉안평장묘 (1기/30년)", price: 600000, description: "30년", isRepresentative: false },
            { name: "합장묘 (1기/30년)", price: 990000, description: "30년", isRepresentative: false }
        ]
    },
    '옵션': {
        rows: [
            { name: "공설묘지 관리비 (30년)", price: 300000, description: "1기당 / 15년 연장", isRepresentative: false }
        ]
    }
});

// 5. 모도리공설묘지
updateFacilityByName("모도리", {
    '매장묘': {
        rows: [
            { name: "사용료 (단장/15년)", price: 60000, description: "옹진군민", isRepresentative: true },
            { name: "사용료 (합장/15년)", price: 90000, description: "옹진군민", isRepresentative: false }
        ]
    },
    '옵션': {
        rows: [
            { name: "관리비 (단장/15년)", price: 30000, description: "15년", isRepresentative: false },
            { name: "관리비 (합장/15년)", price: 45000, description: "15년", isRepresentative: false }
        ]
    }
});

// Save
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log("✅ 5 Facilities (106-110) updated with Gold Standard Data.");
