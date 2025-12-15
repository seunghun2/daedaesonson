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

console.log("💎 Injecting Gold Standard Data for 151-155 (Seongseo, Solmwoe, Seokmun, Yongin Catholic, Kkotdongne)...");

// 1. 성서공동묘지 (151번)
updateFacilityByName("성서공동", {
    '매장묘': {
        rows: [
            { name: "공설묘지 사용료 (1㎡/30년)", price: 20000, description: "30년 (1회 연장가능)", isRepresentative: true },
            { name: "합장묘 (30년)", price: 990000, description: "1기당", isRepresentative: false }
        ]
    },
    '옵션': {
        rows: [
            { name: "관리비 (1기/30년)", price: 160000, description: "30년 관리비", isRepresentative: false }
        ]
    }
});

// 2. 솔뫼공설묘지 (152번)
updateFacilityByName("솔뫼공설", {
    '매장묘': {
        rows: [
            { name: "묘지 사용료 (15년)", price: 592100, description: "당진시민 (3회 연장가능)", isRepresentative: true }
        ]
    },
    '옵션': {
        rows: [
            { name: "묘지 관리비 (15년)", price: 384000, description: "관리비", isRepresentative: false },
            { name: "잔디값", price: 49600, description: "식재비", isRepresentative: false }
        ]
    }
});

// 3. 석문공설묘지 (153번)
updateFacilityByName("석문공설", {
    '매장묘': {
        rows: [
            { name: "묘지 사용료 (15년)", price: 591200, description: "당진시민 (3회 연장가능)", isRepresentative: true }
        ]
    },
    '옵션': {
        rows: [
            { name: "묘지 관리비 (15년)", price: 33200, description: "관리비 (솔뫼 대비 저렴)", isRepresentative: false },
            { name: "잔디값", price: 6200, description: "식재비", isRepresentative: false }
        ]
    }
});

// 4. 천주교용인공원묘원 (154번)
updateFacilityByName("천주교용인", {
    '매장묘': {
        rows: [
            { name: "사용료 (기본)", price: 600000, description: "매장비 별도 문의 (031-334-0807)", isRepresentative: true }
        ]
    },
    '옵션': {
        rows: [
            { name: "영구관리 묘지 관리비 (평/년)", price: 10000, description: "연간 관리비", isRepresentative: false },
            { name: "기간제관리 묘지 관리비 (평/년)", price: 20000, description: "연간 관리비", isRepresentative: false }
        ]
    }
});

// 5. 꽃동네 낙원묘지 (155번)
updateFacilityByName("꽃동네", {
    '매장묘': {
        rows: [
            { name: "꽃동네 가족 안장", price: 0, description: "비용 문의 (꽃동네 가족 대상)", isRepresentative: true }
        ]
    },
    '옵션': {
        rows: [
            { name: "평장비석", price: 0, description: "비용 문의", isRepresentative: false }
        ]
    }
});

// Save
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log("✅ 5 Facilities (151-155) updated by NAME matching.");
