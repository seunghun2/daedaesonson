const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../data/facilities.json');
const facilities = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));

// 🛡️ 안전장치: 작업할 ID 범위 설정 (201-205)
const MIN_ID = 201;
const MAX_ID = 205;

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

// 1. 죽변화성리공설묘지 (201번)
updateFacilityByName("죽변화성리", {
    '매장묘': {
        rows: [
            { name: "묘지 사용료", price: 25000, description: "울진군민 (시설사용료)", isRepresentative: true }
        ]
    },
    '옵션': {
        rows: [
            { name: "묘지 관리비", price: 2000, description: "울진군민 (시설관리비)", isRepresentative: false }
        ]
    }
});

// 2. 신월공설묘지(만장) (202번)
updateFacilityByName("신월", {
    '매장묘': {
        rows: [
            { name: "묘지 사용료", price: 60000, description: "1기당 기준면적(6.6㎡)", isRepresentative: true }
        ]
    },
    '옵션': {
        rows: [
            { name: "묘지 관리비", price: 63000, description: "1기당 기준면적(6.6㎡)", isRepresentative: false }
        ]
    }
});

// 3. 주문공설묘지 (203번)
updateFacilityByName("주문", {
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

// 4. 해남신안공설묘지 (204번)
updateFacilityByName("해남신안", {
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

// 5. 오룡군립묘원(묘지) (205번)
updateFacilityByName("오룡군립", {
    '매장묘': {
        rows: [
            { name: "군립묘원 사용료 (30년)", price: 1900000, description: "1기(10㎡) 기준", isRepresentative: true }
        ]
    },
    '옵션': {
        rows: [
            { name: "군립묘원 관리비 (30년)", price: 600000, description: "1기(10㎡) 기준", isRepresentative: false }
        ]
    }
});

fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log(`✅ IDs ${MIN_ID}-${MAX_ID} processing secured.`);
