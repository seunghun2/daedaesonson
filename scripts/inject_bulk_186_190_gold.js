const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../data/facilities.json');
const facilities = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));

// 🛡️ 안전장치: 작업할 ID 범위 설정 (186-190)
const MIN_ID = 186;
const MAX_ID = 190;

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

// 1. 장계공설묘지 (186번)
updateFacilityByName("장계공설", {
    '매장묘': {
        rows: [
            { name: "묘지 사용료 (15년)", price: 100000, description: "10㎡ 기준", isRepresentative: true }
        ]
    },
    '옵션': {
        rows: [
            { name: "묘지 관리비 (15년)", price: 100000, description: "10㎡ 기준", isRepresentative: false }
        ]
    }
});

// 2. 장흥리공설묘지 (187번)
updateFacilityByName("장흥리", {
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

// 3. 인산리공설묘지 (188번)
updateFacilityByName("인산리", {
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

// 4. 신림덕화공설묘지 (189번)
updateFacilityByName("신림덕화", { // 이름 주의: '신림'이 겹칠 수 있으므로 고유명사 포함
    '매장묘': {
        rows: [
            { name: "묘지 사용료 (15년)", price: 90000, description: "10㎡ 기준", isRepresentative: true }
        ]
    },
    '옵션': {
        rows: [
            { name: "묘지 관리비 (15년)", price: 30000, description: "10㎡ 기준", isRepresentative: false }
        ]
    }
});

// 5. 외포리공설묘지 (190번)
updateFacilityByName("외포리", {
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

fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log(`✅ IDs ${MIN_ID}-${MAX_ID} processing secured.`);
