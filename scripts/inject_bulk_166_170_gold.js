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

console.log("💎 Injecting Gold Standard Data for 166-170 (Yongmiri 1, Yongmiri 2, Janghwari, Unkyung, Jangjeongri)...");

// 1. 용미리제1묘지 (166번 - 만장)
updateFacilityByName("용미리제1", {
    '매장묘': {
        rows: [
            { name: "매장묘 (만장)", price: 0, description: "1998년 매장 중단 (만장)", isRepresentative: true }
        ]
    },
    '옵션': {
        rows: [
            { name: "조성분묘 관리비 (1㎡/5년)", price: 27500, description: "5년치 관리비 (조성된 묘지 대상)", isRepresentative: false }
        ]
    }
});

// 2. 용미리제2묘지 (167번 - 만장)
updateFacilityByName("용미리제2", {
    '매장묘': {
        rows: [
            { name: "매장묘 (만장)", price: 0, description: "1998년 매장 중단 (만장)", isRepresentative: true }
        ]
    },
    '옵션': {
        rows: [
            { name: "조성분묘 관리비 (1㎡/5년)", price: 27500, description: "5년치 관리비 (조성된 묘지 대상)", isRepresentative: false }
        ]
    }
});

// 3. 장화리공설묘지 (168번 - 강화)
updateFacilityByName("장화리", {
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

// 4. 운경공원묘원 (169번 - 양주)
updateFacilityByName("운경공원", {
    '매장묘': {
        rows: [
            { name: "사용료 (평당)", price: 1512400, description: "평당 가격", isRepresentative: true }
        ]
    },
    '옵션': {
        rows: [
            { name: "관리비 (평당)", price: 15000, description: "연 관리비 추정", isRepresentative: false }
        ]
    }
});

// 5. 장정리공설묘지 (170번 - 강화)
updateFacilityByName("장정리", {
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

// Save
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log("✅ 5 Facilities (166-170) updated by NAME matching.");
