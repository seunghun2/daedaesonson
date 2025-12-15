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

console.log("💎 Injecting Gold Standard Data for 136-140 (Inje, Daecheong, Gunwi, Youngnak, Jinchon)...");

// 1. 인제종합장묘센터 하늘공원 (136번)
updateFacilityByName("인제종합", {
    '매장묘': {
        rows: [
            { name: "매장묘역 (단장/15년)", price: 750000, description: "관내 거주자", isRepresentative: true },
            { name: "매장묘역 (합장/15년)", price: 1125000, description: "관내 거주자", isRepresentative: false }
        ]
    },
    '옵션': {
        rows: [
            { name: "매장묘역 (단장/연장10년)", price: 3000000, description: "최소 15년 연장시", isRepresentative: false }
        ]
    }
});

// 2. 대청리공설묘지 (137번)
updateFacilityByName("대청리", {
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

// 3. 가톨릭군위묘원 (138번)
updateFacilityByName("가톨릭군위", {
    '매장묘': {
        rows: [
            { name: "사용료 (30년)", price: 3500000, description: "기본 사용료", isRepresentative: true }
        ]
    },
    '옵션': {
        rows: [
            { name: "관리비 (30년분)", price: 1000000, description: "30년 선납", isRepresentative: false },
            { name: "용역비 기타", price: 1100000, description: "기타 비용", isRepresentative: false },
            { name: "세라믹 영정", price: 200000, description: "사진 제작/부착", isRepresentative: false }
        ]
    }
});

// 4. (재)영락교회공원묘원 (139번)
updateFacilityByName("영락교회", {
    '매장묘': {
        rows: [
            { name: "천광비 (신규/합장)", price: 1050000, description: "작업비용 (사용료 별도 문의)", isRepresentative: true }
        ]
    },
    '옵션': {
        rows: [
            { name: "산정 관리비 (일시납)", price: 1500000, description: "신규/합장 시", isRepresentative: false },
            { name: "년 관리비", price: 50000, description: "1년", isRepresentative: false }
        ]
    }
});

// 5. 진촌리공설묘지 (140번)
updateFacilityByName("진촌리", {
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
console.log("✅ 5 Facilities (136-140) updated by NAME matching.");
