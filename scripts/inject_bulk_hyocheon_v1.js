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

console.log("💎 Injecting Gold Standard Data for Hyocheon, Cheonggu, Cheonjabong...");

// 1. 천주교효천공원묘지
updateFacilityByName("효천", {
    '매장묘': {
        rows: [
            { name: "묘지대 (5.4㎡)", price: 820000, description: "5.4㎡ 기준", isRepresentative: true },
            { name: "조성비", price: 540000, description: "묘지사용면적 기준 조성비", isRepresentative: false },
            { name: "매장비", price: 600000, description: "신규안장", isRepresentative: false }
        ]
    },
    '옵션': {
        rows: [
            { name: "비석대 (와비)", price: 600000, description: "황강석 가로72x세로45cm", isRepresentative: false },
            { name: "관리비", price: 50000, description: "1년 관리비 및 벌초대금", isRepresentative: false }
        ]
    }
});

// 2. (재)청구공원
updateFacilityByName("청구공원", {
    '매장묘': {
        rows: [
            { name: "묘지사용료 (평당)", price: 1000000, description: "평당 가격", isRepresentative: true }
        ]
    },
    '봉안당': {
        rows: [
            { name: "봉안당 (1기/15년)", price: 1500000, description: "15년 사용료", isRepresentative: false }
        ]
    },
    '봉안묘': {
        rows: [
            { name: "봉안묘 (2기형)", price: 6000000, description: "6.62㎡", isRepresentative: false },
            { name: "봉안묘 (2기형/특)", price: 7000000, description: "6.6㎡", isRepresentative: false }
        ]
    },
    '옵션': {
        rows: [
            { name: "묘지관리비 (평당)", price: 12000, description: "평당/년", isRepresentative: false }
        ]
    }
});

// 3. 천자봉공원묘원
updateFacilityByName("천자봉", {
    '매장묘': {
        rows: [
            { name: "묘지사용료 (1평당)", price: 1400000, description: "평당 사용료", isRepresentative: true }
        ]
    },
    '옵션': {
        rows: [
            { name: "관리비 (1평/년)", price: 18000, description: "평당 연간 관리비", isRepresentative: false },
            { name: "완비상석 (부부형)", price: 520000, description: "6평 부부형", isRepresentative: false },
            { name: "와비석 (부부형)", price: 930000, description: "6평 부부형", isRepresentative: false },
            { name: "석화분 (3평형)", price: 400000, description: "3평형", isRepresentative: false }
        ]
    }
});

// Save
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log("✅ 3 Facilities updated by NAME matching.");
