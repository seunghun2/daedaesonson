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

console.log("💎 Injecting Gold Standard Data by Name Matching...");

// 1. (재)예다원 묘원
updateFacilityByName("예다원", {
    '매장묘': {
        rows: [
            { name: "묘지 사용료 (일반/15년)", price: 180000, description: "1기당 6.61㎡ / 1년 이상 거주", isRepresentative: true },
            { name: "묘지 사용료 (특례/15년)", price: 270000, description: "1기당 6.61㎡ / 1년 미만 거주", isRepresentative: false }
        ]
    },
    '옵션': {
        rows: [
            { name: "묘지 관리비 (일반/15년)", price: 120000, description: "15년 관리비", isRepresentative: false },
            { name: "묘지 관리비 (특례/15년)", price: 120000, description: "15년 관리비", isRepresentative: false }
        ]
    }
});

// 2. 신도리공설묘지
updateFacilityByName("신도리", {
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

// 3. 장봉리공설묘지
updateFacilityByName("장봉리", {
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

// 4. 청양군추모공원(묘지)
updateFacilityByName("청양군추모", {
    '매장묘': {
        rows: [
            { name: "공설묘지 사용료 (단장/30년)", price: 700000, description: "1회 연장 가능", isRepresentative: true },
            { name: "공설묘지 사용료 (합장/30년)", price: 1050000, description: "1회 연장 가능", isRepresentative: false }
        ]
    },
    '옵션': {
        rows: [
            { name: "공설묘지 관리비 (단장/30년)", price: 800000, description: "30년", isRepresentative: false },
            { name: "공설묘지 관리비 (합장/30년)", price: 1200000, description: "30년", isRepresentative: false }
        ]
    }
});

// 5. 와동꽃빛공원(공설묘지)
updateFacilityByName("와동꽃빛", {
    '매장묘': {
        rows: [
            { name: "공설공원묘지 사용료 (매장)", price: 656000, description: "6.6㎡ 이하 (신규매장불가)", isRepresentative: true },
            { name: "연장신청시 (관외/매장)", price: 1312000, description: "6.6㎡ 이하", isRepresentative: false }
        ]
    },
    '봉안묘': { // 자연장 분묘 아님, 0.25㎡는 봉안/자연장 관련일 수 있음
        rows: [
            { name: "공설공원묘지 (봉안/분묘)", price: 108000, description: "0.25㎡ 이하", isRepresentative: false }
        ]
    },
    '옵션': {
        rows: [
            { name: "연장신청시 (관내/매장)", price: 656000, description: "6.6㎡ 이하", isRepresentative: false }
        ]
    }
});

// Save
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log("✅ 5 Facilities updated by NAME matching.");
