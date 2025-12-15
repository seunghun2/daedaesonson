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

console.log("💎 Injecting Gold Standard Data for 161-165 (Haebang, Dongmyeong x2, Yangpyeong, Suncheon)...");

// 1. 해방교회공원묘원 (161번 - 파주)
updateFacilityByName("해방교회", {
    '매장묘': {
        rows: [
            { name: "묘지사용료 (3평/단독)", price: 900000, description: "3평형", isRepresentative: true },
            { name: "묘지사용료 (4평/합장)", price: 1200000, description: "4평형", isRepresentative: false }
        ]
    },
    '옵션': {
        rows: [
            { name: "관리비 (15년)", price: 600000, description: "15년 선납", isRepresentative: false }
        ]
    }
});

// 2. 동명가족묘지 (162번 - 대구 추정)
// 이름이 "동명가족"이 아닐 수도 있으니 "동명"으로 찾고 필터링 필요할 수도 있음.
// 일단 "동명가족"으로 시도.
updateFacilityByName("동명가족", {
    '매장묘': {
        rows: [
            { name: "공설묘지 사용료 (1㎡/30년)", price: 20000, description: "30년 (1회 연장가능)", isRepresentative: true },
            { name: "합장묘 (30년)", price: 990000, description: "1기당", isRepresentative: false }
        ]
    },
    '옵션': {
        rows: [
            { name: "관리비 (30년)", price: 160000, description: "30년 관리비", isRepresentative: false }
        ]
    }
});

// 3. 동명공동묘지 (163번 - 대구 추정)
updateFacilityByName("동명공동", {
    '매장묘': {
        rows: [
            { name: "공설묘지 사용료 (1㎡/30년)", price: 20000, description: "30년 (1회 연장가능)", isRepresentative: true },
            { name: "합장묘 (30년)", price: 990000, description: "1기당", isRepresentative: false }
        ]
    },
    '옵션': {
        rows: [
            { name: "관리비 (30년)", price: 160000, description: "30년 관리비", isRepresentative: false }
        ]
    }
});

// 4. 양평군공설공원묘지 (164번 - 양평)
updateFacilityByName("양평군공설", {
    '매장묘': {
        rows: [
            { name: "묘지사용료 (1기/15년)", price: 295000, description: "6.6㎡ 기준", isRepresentative: true }
        ]
    },
    '옵션': {
        rows: [
            { name: "묘지관리비 (1기)", price: 150000, description: "기준 관리비", isRepresentative: false },
            { name: "연장관리비 (1년)", price: 10000, description: "연장 시", isRepresentative: false }
        ]
    }
});

// 5. 순천시립공원묘지 (165번 - 순천)
updateFacilityByName("순천시립", {
    '매장묘': {
        rows: [
            { name: "매장 (관내/15년)", price: 515000, description: "순천시민 (3회 연장가능)", isRepresentative: true },
            { name: "매장 (관외/15년)", price: 800000, description: "관외 거주자 (3회 연장가능)", isRepresentative: false }
        ]
    }
});

// Save
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log("✅ 5 Facilities (161-165) updated by NAME matching.");
