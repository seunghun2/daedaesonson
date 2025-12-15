const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../data/facilities.json');
const facilities = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));

// 🛡️ 안전장치: 작업할 ID 범위 설정 (206-210)
const MIN_ID = 206;
const MAX_ID = 210;

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

// 1. 오상리공설묘지 (206번)
updateFacilityByName("오상리", {
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

// 2. 구미시옥계공설묘지(만장) (207번)
updateFacilityByName("구미시옥계", {
    '매장묘': {
        rows: [
            { name: "묘지 사용료 (30년)", price: 24000, description: "1㎡ 기준 단가", isRepresentative: true }
        ]
    },
    '옵션': {
        rows: [
            { name: "묘지 관리비 (30년)", price: 2000, description: "1㎡ 기준 단가", isRepresentative: false }
        ]
    }
});

// 3. 신서면공설묘지 (208번)
updateFacilityByName("신서면", {
    '매장묘': {
        rows: [
            { name: "공설묘지 사용료", price: 15400, description: "연천군민 (15년)", isRepresentative: true }
        ]
    },
    '옵션': {
        rows: [
            { name: "공설묘지 관리비", price: 16300, description: "연천군민 (15년)", isRepresentative: false }
        ]
    }
});

// 4. 옥천군공설묘지 (209번)
updateFacilityByName("옥천군공설", {
    '매장묘': {
        rows: [
            { name: "묘지 사용료 (15년)", price: 180000, description: "1기(5㎡) 기준", isRepresentative: true }
        ]
    },
    '옵션': {
        rows: [
            { name: "묘지 관리비 (15년)", price: 120000, description: "1기(5㎡) 기준", isRepresentative: false }
        ]
    }
});

// 5. 온수리공설묘지 (210번)
updateFacilityByName("온수리", {
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
