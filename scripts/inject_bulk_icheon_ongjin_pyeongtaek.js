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

console.log("💎 Injecting Gold Standard Data for Icheon, Ongjin, Pyeongtaek Public Facilities...");

// 1. 이천시설성공설공원묘지
updateFacilityByName("이천시설성", {
    '매장묘': {
        rows: [
            { name: "묘지사용료 (6.6㎡)", price: 200000, description: "1기당 기준면적", isRepresentative: true },
            { name: "연장 사용료", price: 200000, description: "연장 시 동일", isRepresentative: false }
        ]
    },
    '옵션': {
        rows: [
            { name: "묘지관리비 (1기)", price: 250000, description: "1기당", isRepresentative: false },
            { name: "연장 관리비", price: 250000, description: "연장 시 동일", isRepresentative: false }
        ]
    }
});

// 2. 이작리공설묘지
updateFacilityByName("이작리", {
    '매장묘': {
        rows: [
            { name: "사용료 (단장/15년)", price: 60000, description: "옹진군민 기준", isRepresentative: true },
            { name: "사용료 (합장/15년)", price: 90000, description: "옹진군민 기준", isRepresentative: false }
        ]
    },
    '옵션': {
        rows: [
            { name: "관리비 (단장/15년)", price: 30000, description: "15년 관리비", isRepresentative: false },
            { name: "관리비 (합장/15년)", price: 45000, description: "15년 관리비", isRepresentative: false }
        ]
    }
});

// 3. 안중공설묘지
updateFacilityByName("안중공설", {
    '매장묘': {
        rows: [
            { name: "공설묘지 사용료 (단장)", price: 451000, description: "10㎡ / 15년", isRepresentative: true },
            { name: "공설묘지 사용료 (합장)", price: 676000, description: "10㎡ / 15년", isRepresentative: false }
        ]
    },
    '옵션': {
        rows: [
            { name: "관리비 (단장/15년)", price: 199000, description: "15년 관리비", isRepresentative: false },
            { name: "관리비 (합장/15년)", price: 299000, description: "15년 관리비", isRepresentative: false }
        ]
    }
});

// 4. 선재리공설묘지
updateFacilityByName("선재리", {
    '매장묘': {
        rows: [
            { name: "사용료 (단장/15년)", price: 60000, description: "옹진군민 기준", isRepresentative: true },
            { name: "사용료 (합장/15년)", price: 90000, description: "옹진군민 기준", isRepresentative: false }
        ]
    },
    '옵션': {
        rows: [
            { name: "관리비 (단장/15년)", price: 30000, description: "15년 관리비", isRepresentative: false },
            { name: "관리비 (합장/15년)", price: 45000, description: "15년 관리비", isRepresentative: false }
        ]
    }
});

// 5. 이천시장호원공설공원묘지(만장)
updateFacilityByName("이천시장호원", {
    '매장묘': {
        rows: [
            { name: "묘지사용료 (6.6㎡)", price: 200000, description: "1기당 기준면적", isRepresentative: true },
            { name: "연장 사용료", price: 200000, description: "연장 시 동일", isRepresentative: false }
        ]
    },
    '옵션': {
        rows: [
            { name: "묘지관리비 (1기)", price: 250000, description: "1기당", isRepresentative: false },
            { name: "연장 관리비", price: 250000, description: "연장 시 동일", isRepresentative: false }
        ]
    }
});

// Save
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log("✅ 5 Public Facilities updated by NAME matching.");
