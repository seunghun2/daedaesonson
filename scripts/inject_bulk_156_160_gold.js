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

console.log("💎 Injecting Gold Standard Data for 156-160 (Nakwon, Namhae, Jeongju, Daehoji, Youngnak Gwangju)...");

// 1. 낙원공원묘원 (156번 - 파주)
updateFacilityByName("낙원공원", {
    '매장묘': {
        rows: [
            { name: "묘지 사용료 (평당)", price: 1000000, description: "토지 사용료 (저렴함)", isRepresentative: true },
            { name: "분묘조성 석재패키지", price: 4950000, description: "4각3단둘레석, 비석, 상석 등 포함 (필수 확인)", isRepresentative: false }
        ]
    },
    '옵션': {
        rows: [
            { name: "묘지 관리비 (평당)", price: 16000, description: "연 관리비 추정", isRepresentative: false }
        ]
    }
});

// 2. 남해추모누리 공설종합묘원 (157번 - 남해)
updateFacilityByName("남해추모누리", {
    '매장묘': {
        rows: [
            { name: "매장묘역 사용료 (30년)", price: 860000, description: "남해군민 (1회 연장가능)", isRepresentative: true },
            { name: "매장묘역 석물대", price: 1460000, description: "남해군민 (필수)", isRepresentative: false }
        ]
    },
    '옵션': {
        rows: [
            { name: "매장묘역 관리비 (30년)", price: 600000, description: "30년 관리비", isRepresentative: false }
        ]
    }
});

// 3. 정주동산 (158번 - 연천)
updateFacilityByName("정주동산", {
    '매장묘': {
        rows: [
            { name: "매장 (1기당)", price: 1200000, description: "기본 매장료", isRepresentative: true },
            { name: "납골 (1기당)", price: 600000, description: "납골묘", isRepresentative: false }
        ]
    },
    '옵션': {
        rows: [
            { name: "관리비", price: 40000, description: "연 관리비 추정", isRepresentative: false }
        ]
    }
});

// 4. 대호지공설묘지 (159번 - 당진)
updateFacilityByName("대호지", {
    '매장묘': {
        rows: [
            { name: "묘지 사용료 (15년)", price: 693600, description: "당진시민 (3회 연장가능)", isRepresentative: true }
        ]
    },
    '옵션': {
        rows: [
            { name: "묘지 관리비 (15년)", price: 351200, description: "관리비", isRepresentative: false },
            { name: "잔디값", price: 49600, description: "식재비", isRepresentative: false }
        ]
    }
});

// 5. 영락공원묘지 (160번 - 광주)
updateFacilityByName("영락공원", {
    '매장묘': {
        rows: [
            { name: "묘지 사용료 (15년)", price: 1405000, description: "광주시민 / 30일전 거주", isRepresentative: true },
            { name: "묘지 수수료", price: 271000, description: "광주시민", isRepresentative: false }
        ]
    },
    '옵션': {
        rows: [
            { name: "묘지 관리비 (15년)", price: 150000, description: "15년 관리비", isRepresentative: false }
        ]
    }
});

// Save
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log("✅ 5 Facilities (156-160) updated by NAME matching.");
