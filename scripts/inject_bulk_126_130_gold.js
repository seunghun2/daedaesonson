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

console.log("💎 Injecting Gold Standard Data for Chungju, Cheongbuk, Jawolri, Naeri, Cheori...");

// 1. 충주시공설묘지
updateFacilityByName("충주시공설", {
    '매장묘': {
        rows: [
            { name: "묘지 사용료 (단장)", price: 250000, description: "10㎡ / 15년", isRepresentative: true },
            { name: "묘지 사용료 (합장)", price: 500000, description: "15㎡ / 15년", isRepresentative: false }
        ]
    },
    '옵션': {
        rows: [
            { name: "묘지 관리비 (단장)", price: 300000, description: "15년 관리비", isRepresentative: false },
            { name: "묘지 관리비 (합장)", price: 300000, description: "15년 관리비", isRepresentative: false }
        ]
    }
});

// 2. 청북공설묘지
updateFacilityByName("청북공설", {
    '매장묘': {
        rows: [
            { name: "공설묘지 사용료 (단장)", price: 451000, description: "10㎡ / 15년", isRepresentative: true },
            { name: "공설묘지 사용료 (합장)", price: 676000, description: "10㎡ / 15년", isRepresentative: false }
        ]
    },
    '옵션': {
        rows: [
            { name: "공설묘지 관리비 (단장)", price: 199000, description: "15년 관리비", isRepresentative: false },
            { name: "공설묘지 관리비 (합장)", price: 299000, description: "15년 관리비", isRepresentative: false }
        ]
    }
});

// 3. 자월리공설묘지
updateFacilityByName("자월리", {
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

// 4. 내리공설묘지
updateFacilityByName("내리공설", {
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

// 5. 처리공원묘지
updateFacilityByName("처리공원", {
    '매장묘': {
        rows: [
            { name: "공설공원묘지 사용료 (단장)", price: 150000, description: "여주시민 / 15년", isRepresentative: true },
            { name: "공설공원묘지 사용료 (합장)", price: 225000, description: "여주시민 / 15년", isRepresentative: false }
        ]
    },
    '옵션': {
        rows: [
            { name: "관리비 (단장/15년)", price: 150000, description: "15년 관리비", isRepresentative: false },
            { name: "관리비 (합장/15년)", price: 225000, description: "15년 관리비", isRepresentative: false }
        ]
    }
});

// Save
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log("✅ 5 Facilities (126-130) updated by NAME matching.");
