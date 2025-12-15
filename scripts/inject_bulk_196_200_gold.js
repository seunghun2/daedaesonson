const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../data/facilities.json');
const facilities = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));

// 🛡️ 안전장치: 작업할 ID 범위 설정 (196-200)
const MIN_ID = 196;
const MAX_ID = 200;

function updateFacilityByName(nameHint, pricingData) {
    // 1. 이름으로 찾기
    const candidates = facilities.filter(f => f.name.includes(nameHint));

    if (candidates.length === 0) {
        console.error(`❌ Facility containing "${nameHint}" not found!`);
        return;
    }

    // 2. ID 범위로 필터링 (Safe Guard)
    const target = candidates.find(f => {
        const idNum = parseInt(f.id.replace('park-', ''));
        return idNum >= MIN_ID && idNum <= MAX_ID;
    });

    if (!target) {
        console.warn(`⚠️  Found candidates for "${nameHint}" but outside ID range (${MIN_ID}-${MAX_ID}). Skipped.`);
        return;
    }

    // 3. 업데이트
    target.pricing = pricingData;
    console.log(`✅ ${target.name} (ID: ${target.id}) updated.`);
}

console.log(`💎 Injecting Gold Standard Data for ${MIN_ID}-${MAX_ID}...`);

// 1. 화산연정공설묘지 (196번)
updateFacilityByName("화산연정", {
    '매장묘': {
        rows: [
            { name: "묘지 사용료 (15년)", price: 90000, description: "2회 연장 가능", isRepresentative: true }
        ]
    },
    '옵션': {
        rows: [
            { name: "묘지 관리비 (15년)", price: 100000, description: "2회 연장 가능", isRepresentative: false }
        ]
    }
});

// 2. 연천읍공설묘지 (197번)
updateFacilityByName("연천읍", {
    '매장묘': {
        rows: [
            { name: "공설묘지 사용료", price: 15400, description: "연천군민 (15년)", isRepresentative: true }
        ]
    },
    '옵션': {
        rows: [
            { name: "공설묘지 관리", price: 16300, description: "연천군민 (15년)", isRepresentative: false }
        ]
    }
});

// 3. 삼계공설묘지 (198번)
updateFacilityByName("삼계공설", {
    '매장묘': {
        rows: [
            { name: "묘지 사용료", price: 25000, description: "3.3㎡ (2위, 1등지: 2만5천원 ~ 3등지: 5천원)", isRepresentative: true }
        ]
    },
    '옵션': {
        rows: [
            { name: "묘지 관리비", price: 2000, description: "1기당", isRepresentative: false }
        ]
    }
});

// 4. 아산주진공설묘지 (199번)
updateFacilityByName("아산주진", {
    '매장묘': {
        rows: [
            { name: "묘지 사용료 (15년)", price: 90000, description: "1기당 기준면적(10㎡)", isRepresentative: true }
        ]
    },
    '옵션': {
        rows: [
            { name: "묘지 관리비 (15년)", price: 30000, description: "1기당 기준면적(10㎡)", isRepresentative: false }
        ]
    }
});

// 5. 부산영락공원묘지 (200번) -> "부산영락"
updateFacilityByName("부산영락", {
    '매장묘': {
        rows: [
            { name: "사용료 및 관리비 (부산시내)", price: 300000, description: "15년", isRepresentative: true },
            { name: "사용료 및 관리비 (타시도)", price: 600000, description: "15년", isRepresentative: false }
        ]
    },
    '옵션': {
        rows: []
    }
});

fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log(`✅ IDs ${MIN_ID}-${MAX_ID} processing secured.`);
