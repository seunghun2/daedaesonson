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

console.log("💎 Injecting Gold Standard Data for 171-175 (Ungyang, Wonju, Wolgot, Wollong, Wolpyeong)...");

// 1. 웅양공설공원묘지 (171번 - 거창)
updateFacilityByName("웅양공설", {
    '매장묘': {
        rows: [
            { name: "공설공원묘지 사용료 (15년)", price: 300000, description: "해당면 주민", isRepresentative: true }
        ]
    },
    '옵션': {
        rows: [
            { name: "공설공원묘지 관리비 (15년)", price: 200000, description: "해당면 주민", isRepresentative: false }
        ]
    }
});

// 2. (재)원주공원묘원 (172번 - 원주)
updateFacilityByName("원주공원묘원", {
    '매장묘': {
        rows: [
            { name: "사용료 (1위)", price: 1500000, description: "단장 기준", isRepresentative: true }
        ]
    },
    '옵션': {
        rows: [
            { name: "관리비 (5년/1평)", price: 20000, description: "1평당 5년분", isRepresentative: false }
        ]
    }
});

// 3. 월곳리공설묘지 (173번 - 강화) - '월곳' vs '월곶' 주의. 파일명은 월곳.
updateFacilityByName("월곳리", {
    '매장묘': {
        rows: [
            { name: "공설묘지 사용료 (15년)", price: 15000, description: "강화군민", isRepresentative: true }
        ]
    },
    '옵션': {
        rows: [
            { name: "공설묘지 관리비 (15년)", price: 15000, description: "강화군민", isRepresentative: false }
        ]
    }
});

// 4. 월롱면 공설묘지 (174번 - 파주)
updateFacilityByName("월롱면", {
    '매장묘': {
        rows: [
            { name: "공설묘지 사용료 (15년)", price: 95000, description: "파주시민", isRepresentative: true }
        ]
    },
    '옵션': {
        rows: [
            { name: "공설묘지 관리비 (15년)", price: 150000, description: "파주시민", isRepresentative: false }
        ]
    }
});

// 5. 월평공설공원묘지 (175번 - 거창)
updateFacilityByName("월평공설", {
    '매장묘': {
        rows: [
            { name: "공설공원묘지 사용료 (15년)", price: 300000, description: "해당면 주민", isRepresentative: true }
        ]
    },
    '옵션': {
        rows: [
            { name: "공설공원묘지 관리비 (15년)", price: 200000, description: "해당면 주민", isRepresentative: false }
        ]
    }
});

// Save
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log("✅ 5 Facilities (171-175) updated by NAME matching.");
