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

console.log("💎 Injecting Gold Standard Data for 131-135 (Hoengseong, Songtan, Osan, Chunghyo, Honors)...");

// 1. 횡성군공설추모공원(묘지) (133번)
updateFacilityByName("횡성군공설추모", {
    '매장묘': {
        rows: [
            { name: "묘지사용료 (단장)", price: 361140, description: "사용료", isRepresentative: true }
        ]
    },
    '옵션': {
        rows: [
            { name: "묘지관리비", price: 360000, description: "관리비", isRepresentative: false }
        ]
    }
});

// 2. 송탄공설묘지 (134번)
updateFacilityByName("송탄공설", {
    '매장묘': {
        rows: [
            { name: "공설묘지 사용료 (단장)", price: 451000, description: "10㎡ / 15년", isRepresentative: true },
            { name: "공설묘지 사용료 (합장)", price: 676000, description: "10㎡ / 15년", isRepresentative: false }
        ]
    },
    '옵션': {
        rows: [
            { name: "관리비 (단장)", price: 199000, description: "15년 관리비", isRepresentative: false },
            { name: "관리비 (합장)", price: 299000, description: "15년 관리비", isRepresentative: false }
        ]
    }
});

// 3. 오산시공설공원묘지 (131번)
updateFacilityByName("오산시공설", {
    '매장묘': {
        rows: [
            { name: "묘지사용료 (15년)", price: 45000, description: "1기당 6.6㎡", isRepresentative: true },
            { name: "연장 사용료 (10년)", price: 30000, description: "1기당", isRepresentative: false }
        ]
    },
    '옵션': {
        rows: [
            { name: "묘지관리비 (15년)", price: 15000, description: "1기당", isRepresentative: false },
            { name: "연장 관리비 (10년)", price: 10000, description: "1기당", isRepresentative: false }
        ]
    }
});

// 4. 충효공원묘원 (132번)
updateFacilityByName("충효공원", {
    '매장묘': {
        rows: [
            { name: "묘지사용료 (3.3㎡)", price: 1500000, description: "3.3㎡ 기준", isRepresentative: true },
            { name: "사용료 (평)", price: 600000, description: "평장 기준", isRepresentative: false }
        ]
    },
    '옵션': {
        rows: [
            { name: "관리비 (년/평)", price: 15000, description: "년 관리비", isRepresentative: false }
        ]
    }
});

// 5. 재단법인 아너스홈(구 대성공원묘원) (135번)
updateFacilityByName("아너스홈", {
    '매장묘': {
        rows: [
            { name: "매장 5평 (단장)", price: 2450000, description: "평당 49만원 / 사용료", isRepresentative: true },
            { name: "매장 6평", price: 2940000, description: "평당 49만원 / 사용료", isRepresentative: false }
        ]
    },
    '옵션': {
        rows: [
            { name: "관리비 (5평/년)", price: 80000, description: "1년마다 (평당 1.6만원)", isRepresentative: false },
            { name: "관리비 (6평/년)", price: 96000, description: "1년마다 (평당 1.6만원)", isRepresentative: false }
        ]
    }
});

// Save
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log("✅ 5 Facilities (131-135) updated by NAME matching.");
