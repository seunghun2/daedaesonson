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

console.log("💎 Injecting Gold Standard Data for 141-145 (Hyonsu, Yeonpyeong, Gangneung, Nambu, Jahayeon Paldang)...");

// 1. 현수리공원묘지 (141번)
updateFacilityByName("현수리", {
    '매장묘': {
        rows: [
            { name: "공설묘지 사용료 (단장/15년)", price: 10800, description: "여주시민", isRepresentative: true },
            { name: "공설묘지 사용료 (합장/15년)", price: 16200, description: "여주시민", isRepresentative: false }
        ]
    },
    '옵션': {
        rows: [
            { name: "관리비 (단장/15년)", price: 19200, description: "15년", isRepresentative: false },
            { name: "관리비 (합장/15년)", price: 28800, description: "15년", isRepresentative: false }
        ]
    }
});

// 2. 연평리공설묘지 (142번)
updateFacilityByName("연평리", {
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

// 3. 강릉공원묘원(묘지) (143번)
updateFacilityByName("강릉공원", {
    '매장묘': {
        rows: [
            { name: "묘지 1평 (사용료)", price: 1000000, description: "1기당 추정", isRepresentative: true },
            { name: "묘지 1평 (기타비용?)", price: 24975, description: "상세 내역 확인 필요", isRepresentative: false }
        ]
    }
});

// 4. 남부권공설묘지 (144번)
updateFacilityByName("남부권", {
    '매장묘': {
        rows: [
            { name: "묘지 사용료 (15년)", price: 1524000, description: "당진시민 / 3회 연장가능", isRepresentative: true }
        ]
    },
    '옵션': {
        rows: [
            { name: "묘지 관리비 (15년)", price: 538400, description: "3회 연장가능", isRepresentative: false },
            { name: "잔디값", price: 49600, description: "15년", isRepresentative: false }
        ]
    }
});

// 5. (재)자하연팔당(묘지) (145번)
updateFacilityByName("자하연팔당", {
    '매장묘': {
        rows: [
            { name: "매장묘 분양묘 (평당)", price: 2450000, description: "평당 분양가", isRepresentative: true }
        ]
    },
    '옵션': {
        rows: [
            { name: "1년 관리비 (평당)", price: 27000, description: "매년 납부", isRepresentative: false }
        ]
    }
});

// Save
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log("✅ 5 Facilities (141-145) updated by NAME matching.");
